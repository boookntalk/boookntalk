from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base, get_db, SessionLocal
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from utils import parse_author_string, download_and_update_cover
from sqlalchemy import or_, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from routers import home, memos, editions, library

import models
import httpx
import asyncio
import uuid
import os
import sys
import time
import random
from dotenv import load_dotenv
from sqlalchemy.orm import joinedload

# ==========================================
# [핵심] 경로 문제 해결 코드 (이걸로 교체하세요!)
# ==========================================
# 현재 파일(main.py)이 있는 위치를 시스템 경로에 강제로 추가합니다.
# 이렇게 하면 'import database'라고만 써도 무조건 같은 폴더에서 찾습니다.
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# 이제 점(.)이나 backend. 없이 편하게 import 하세요

# 환경 변수 로드
load_dotenv()
ALADIN_TTB_KEY = os.getenv("ALADIN_TTB_KEY")
GOOGLE_BOOKS_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY")
NLK_API_KEY = os.getenv("NLK_API_KEY")
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")

# -------------------------------------------------------------------
# [2] 데이터 스키마 정의 (Pydantic Schemas)
# -------------------------------------------------------------------

class UserSyncRequest(BaseModel):
    email: str
    nickname: Optional[str] = None
    profile_image: Optional[str] = None

class LibraryUpdate(BaseModel):
    status: Optional[str] = None
    rating: Optional[float] = None
    short_review: Optional[str] = None
    start_date: Optional[str] = None
    finish_date: Optional[str] = None
    current_page: Optional[int] = None
    reading_format: Optional[str] = None
    tags: Optional[list] = None
    
    # ▼▼▼ [NEW] 공개/비공개 업데이트 파라미터 ▼▼▼
    is_public: Optional[bool] = None

# [수정] 도서 등록 요청 데이터 검증 모델
class RegisterBookRequest(BaseModel):
    user_email: str
    title: str
    author: str
    publisher: str
    pubDate: str
    description: str
    
    # ISBN 관련
    isbn: str
    isbn10: Optional[str] = None
    addon_code: Optional[str] = None
    
    cover: str
    pageCount: int
    categoryName: Optional[str] = None
    itemPage: Optional[int] = None
    detailed_authors: Optional[list] = None
    
    # ▼▼▼ [NEW] 서지정보 Level 2 & 3 확장 필드 추가 ▼▼▼
    originalTitle: Optional[str] = None
    binding_type: Optional[str] = None
    kdc_code: Optional[str] = None
    language: Optional[str] = "한국어"
    size_mm: Optional[str] = None
    price: Optional[int] = None

# [추가] 상세 페이지용 응답 스키마
class RecordDetailResponse(BaseModel):
    record: dict
    work: dict
    related_editions: list

class MemoCreate(BaseModel):
    page_number: int
    sentence: str
    thought: Optional[str] = None

# [1] 상단 Pydantic Schema 수정 (약 80번째 줄 부근)
class MemoCreate(BaseModel):
    page_number: int
    sentence: str
    thought: Optional[str] = None
    is_public: Optional[bool] = True # ▼▼▼ 추가

# -------------------------------------------------------------------
# [스키마] 프로필 업데이트 요청용 데이터 모델
# -------------------------------------------------------------------
class ProfileUpdateRequest(BaseModel):
    nickname: str
    bio: Optional[str] = None

# [1] 기존 MemoCreate 스키마 아래에 Update 스키마 추가 (약 85번째 줄 부근)
class MemoUpdate(BaseModel):
    page_number: Optional[int] = None
    sentence: Optional[str] = None
    thought: Optional[str] = None
    is_public: Optional[bool] = None

# -------------------------------------------------------------------
# [3] 앱 수명주기 및 미들웨어 (Lifespan & Middleware)
# -------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 개발 초기 단계에서 DB 스키마 변경이 잦을 때 사용 (주의: 데이터 삭제됨)
    # models.Base.metadata.drop_all(bind=engine)
    # print("drop_all")
    # models.Base.metadata.create_all(bind=engine)
    # print("create_all.")
    yield

app = FastAPI(lifespan=lifespan)

app.include_router(home.router)
app.include_router(memos.router)
app.include_router(editions.router)
app.include_router(library.router)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. 이미지를 저장할 폴더가 없으면 자동으로 생성
UPLOAD_DIR = "static/covers"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# 2. 정적 파일 마운트 (이 코드가 있어야 http://localhost:8000/static/... 접근 가능)
app.mount("/static", StaticFiles(directory="static"), name="static")

# -------------------------------------------------------------------
# [4] 기본 및 인증 API (Auth Endpoints)
# -------------------------------------------------------------------

@app.get("/")
def read_root():
    return {"message": "BoooknTalk Pro API is running!"}

def generate_btk_isbn():
    """
    ISBN이 없는 도서를 위한 BoooknTalk 자체 식별자 생성
    형식: BTK + 현재타임스탬프(10자리) + 난수(3자리) = 총 16자 내외 문자열
    """
    timestamp = int(time.time())
    rand_suffix = random.randint(100, 999)
    return f"BTK{timestamp}{rand_suffix}"

@app.post("/api/auth/sync")
def sync_user(user_data: UserSyncRequest, db: Session = Depends(get_db)):
    """
    프론트엔드 로그인 후 유저 정보를 DB와 동기화
    """
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    
    if not db_user:
        new_user = models.User(
            email=user_data.email,
            nickname=user_data.nickname,
            profile_image=user_data.profile_image,
            is_premium=False 
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"status": "created", "user_id": new_user.id}
    
    # 기존 유저 업데이트
    # db_user.nickname = user_data.nickname
    db_user.profile_image = user_data.profile_image
    db.commit()
    return {"status": "exists", "user_id": db_user.id}

# [추가] BoooknTalk 자체 ISBN 생성기
def generate_btk_isbn():
    # 현재 시간(초) + 랜덤 숫자 3자리 조합 -> 13자리 맞춤
    # 예: 1700000000 + 123 -> BTK1700000123
    timestamp = int(time.time())
    rand_suffix = random.randint(100, 999)
    return f"BTK{timestamp}{rand_suffix}"

# -------------------------------------------------------------------
# [5] 도서 검색 API (External Search API)
# -------------------------------------------------------------------

# -------------------------------------------------------------------
# [추가] 키워드 통합 검색 API (도서명 / 저자명)
# -------------------------------------------------------------------
from sqlalchemy import or_ # 상단에 없을 경우를 대비해 필요합니다.

# =========================================================
# 1. 키워드 검색 API (BoooknTalk 로컬 DB 전용 검색)
# =========================================================
@app.get("/api/books/search/keyword")
async def search_books_by_keyword(
    query: str, 
    display: int = 20, 
    start: int = 1, 
    db: Session = Depends(get_db) # DB 접근을 위해 추가된 필수 파라미터
):
    """
    [상용화 대비 로컬 DB 통합 검색 API]
    외부 API(네이버)를 호출하지 않고, BoooknTalk 회원들이 한 번이라도 
    등록한 도서(Edition)들을 대상으로만 검색합니다.
    """
    search_pattern = f"%{query}%"

    # Work(작품)와 Edition(판본) 테이블을 조인하여 제목, 작가, 출판사에 키워드가 포함된 데이터 검색
    # (ilike를 사용하여 대소문자 구분 없이 부분 일치 검색 수행)
    editions = db.query(models.Edition).join(models.Work).filter(
        or_(
            models.Work.title.ilike(search_pattern),
            models.Work.author.ilike(search_pattern),
            models.Edition.publisher.ilike(search_pattern)
        )
    ).order_by(models.Edition.id.desc()).limit(60).all() # 최신순, 최대 60개 제한

    results = []
    for ed in editions:
        work = ed.work
        results.append({
            "title": work.title,
            "author": work.author,
            "publisher": ed.publisher or "출판사 미상",
            "pubDate": ed.publish_date.strftime("%Y%m%d") if ed.publish_date else "",
            "cover": ed.cover_image or "",
            "description": ed.description or work.description or "",
            "isbn": ed.isbn,
            "price": ed.price or 0,
            
            # 프론트엔드 [서재 담기] 호환성을 위한 데이터
            "pageCount": ed.page_count or 0,
            "categoryName": ed.kdc_code or work.category or "미분류"
        })

    # 프론트엔드가 기존 네이버 API 포맷에 맞춰져 있으므로 동일한 형태로 응답 반환
    return {
        "total": len(results),
        "start": start,
        "display": len(results),
        "items": results
    }
    
# main.py 내부의 search_external_books 함수 교체

@app.get("/api/books/search/{isbn}")
async def search_external_books(isbn: str, extra: Optional[str] = None, db: Session = Depends(get_db)):
    """
    [상용화(BoooknTalk Pro) 대비 2 Tier 검색 아키텍처] 
    1. 국립중앙도서관(NLK): 법적 제약 없는 완벽한 핵심 서지정보 (1순위)
    2. 네이버 오픈 API: 표지 이미지 및 책 소개글 보완 (2순위)
    """
    
    clean_isbn = isbn.replace("-", "").strip()
    
    # --- [NEW] 1. 우리 DB(캐시) 먼저 확인 ---
    existing_edition = db.query(models.Edition).filter(
        (models.Edition.isbn == clean_isbn) | (models.Edition.isbn10 == clean_isbn)
    ).first()

    # 🚨 [핵심 수정] DB에 책이 존재하고, '커버 이미지'도 온전히 있을 때만 캐시를 반환합니다.
    if existing_edition and existing_edition.cover_image:
        work = existing_edition.work
        print(f"⚡ DB 캐시 적중 (완벽한 데이터): {work.title}") 
        
        discoverer_name = "익명의 여행자"
        if getattr(existing_edition, 'creator', None):
            discoverer_name = existing_edition.creator.nickname or existing_edition.creator.email.split('@')[0]
    
        return {
            "title": work.title,
            "author": work.author,
            "publisher": existing_edition.publisher,
            "pubDate": existing_edition.publish_date.strftime("%Y%m%d") if existing_edition.publish_date else "",
            "categoryName": existing_edition.kdc_code or work.category or "미분류",
            "cover": existing_edition.cover_image, # 온전한 이미지
            # ... (나머지 리턴 항목들은 기존과 동일하게 유지) ...
            "description": existing_edition.description or work.description or "",
            "pageCount": existing_edition.page_count or 0,
            "isbn": existing_edition.isbn,
            "isbn10": existing_edition.isbn10 or "",
            "price": existing_edition.price or 0,
            "binding_type": existing_edition.binding_type or "알 수 없음",
            "size_mm": existing_edition.size_mm or "",
            "language": existing_edition.language or "한국어",
            "kdc_code": existing_edition.kdc_code or "",
            "first_discoverer": discoverer_name
        }
    elif existing_edition and not existing_edition.cover_image:
        # DB에 책은 있지만 커버가 없는 경우
        print(f"⚠️ DB 캐시 적중했으나 커버 이미지 누락! 외부 API로 보완합니다: {existing_edition.work.title}")
        # 여기서 return 하지 않고 넘어가면, 아래에 있는 네이버/국립중앙도서관 API 호출 로직이 실행됩니다!
    
    # --- 외부 API 호출 준비 ---
    async with httpx.AsyncClient() as client:
        # 1. 국립중앙도서관 서지정보 API
        nlk_url = f"https://www.nl.go.kr/seoji/SearchApi.do?cert_key={NLK_API_KEY}&result_style=json&page_no=1&page_size=10&isbn={isbn}"
        
        # 2. 네이버 도서 검색 API
        naver_url = f"https://openapi.naver.com/v1/search/book_adv.json?d_isbn={isbn}"
        naver_headers = {
            "X-Naver-Client-Id": NAVER_CLIENT_ID or "",
            "X-Naver-Client-Secret": NAVER_CLIENT_SECRET or ""
        }

        # 병렬 호출
        nlk_res, naver_res = await asyncio.gather(
            client.get(nlk_url, timeout=5.0),
            client.get(naver_url, headers=naver_headers, timeout=5.0),
            return_exceptions=True
        )
        # 🚨 [디버깅 로그 추가] 네이버 API 상태 집중 확인 🚨
        print(f"--- 🔍 ISBN({isbn}) 검색 로그 ---")

        naver_data = {}
        if isinstance(naver_res, Exception):
            print(f"❌ 네이버 API 통신 장애: {naver_res}")
        else:
            print(f"🌐 네이버 API 상태 코드: {naver_res.status_code}")
            if naver_res.status_code == 200:
                naver_data = naver_res.json()
                print("✅ 네이버 도서 검색 성공 (데이터 수신됨)")
            else:
                print(f"❌ 네이버 API 에러 발생: {naver_res.text}") # 👈 여기서 원인이 밝혀집니다!

        nlk_data = {}
        if not isinstance(nlk_res, Exception) and nlk_res.status_code == 200:
            nlk_data = nlk_res.json()

        # 데이터 추출
        nlk_item = nlk_data.get('docs', [{}])[0] if nlk_data.get('docs') else {}
        naver_items = naver_data.get('items', [])
        naver_item = naver_items[0] if naver_items else {}

        # 제목 확인 (검색 실패 여부 판단)
        title = nlk_item.get('TITLE') or naver_item.get('title')
        if not title:
            # 둘 다 없으면 404
            raise HTTPException(status_code=404, detail="도서 정보를 찾을 수 없습니다.")

        # [핵심 수정] 이미지 주소 찾기 (네이버 > 국립중앙도서관 순서로 확인)
        cover = ""
        # 1순위: 네이버 이미지 (화질이 더 좋을 확률 높음)
        if naver_item.get('image'):
            cover = naver_item.get('image')
        # 2순위: 국립중앙도서관 이미지 (필드명이 다양할 수 있음)
        elif nlk_item.get('IMAGE_URL'):
             cover = nlk_item.get('IMAGE_URL')
        elif nlk_item.get('TITLE_URL'): # 가끔 여기에 이미지가 있기도 함
             cover = nlk_item.get('TITLE_URL')
        
        print(f"🖼️ 최종 추출된 커버 이미지 URL: '{cover}'\n--------------------------")
        
        # 나머지 데이터 매핑
        author = nlk_item.get('AUTHOR') or naver_item.get('author') or "저자 미상"
        publisher = nlk_item.get('PUBLISHER') or naver_item.get('publisher') or "출판사 미상"
        pubDate = nlk_item.get('PUBLISH_PREDATE') or naver_item.get('pubdate') or ""
        
        # 페이지 수 파싱
        page_raw = nlk_item.get('PAGE') or ""
        page_count = 0
        if page_raw:
            import re
            nums = re.findall(r'\d+', str(page_raw))
            if nums: page_count = int(nums[0])

        return {
            "title": title,
            "author": author,
            "publisher": publisher,
            "pubDate": pubDate,
            "categoryName": nlk_item.get('KDC') or "", 
            "cover": cover, # 👈 여기가 가장 중요합니다!
            "description": naver_item.get('description') or "",
            "pageCount": page_count,
            "isbn": isbn,
            "detailed_authors": [], 
            "originalTitle": "", 
            "binding_type": "기타",
            "size_mm": "",
            "language": "한국어",
            "kdc_code": nlk_item.get('KDC') or "",
            "first_discoverer": None
        }

# -------------------------------------------------------------------
# [NEW] 도서 상세 정보 조회 API (최초 발견자 정보 포함)
# -------------------------------------------------------------------
@app.get("/api/books/detail/{isbn}")
async def get_book_public_detail(isbn: str, db: Session = Depends(get_db)):
    """
    BoooknTalk DB에 등록된 도서의 상세 정보를 조회합니다.
    최초 등록자(First Discoverer)의 닉네임을 함께 반환합니다.
    """
    # 1. Edition 조회 (Work 정보 포함)
    edition = db.query(models.Edition).filter(models.Edition.isbn == isbn).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="BoooknTalk에 등록되지 않은 도서입니다.")

    # 2. 최초 발견자 닉네임 추출
    # models.py에서 설정한 relationship("User")인 edition.creator를 사용합니다.
    discoverer_name = "익명의 여행자"
    if edition.creator:
        discoverer_name = edition.creator.nickname or edition.creator.email.split('@')[0]

    work = edition.work
    
    return {
        "isbn": edition.isbn,
        "title": work.title,
        "author": work.author,
        "publisher": edition.publisher,
        "pubDate": edition.publish_date.strftime("%Y-%m-%d") if edition.publish_date else "",
        "cover": edition.cover_image,
        "description": edition.description or work.description or "",
        "pageCount": edition.page_count,
        "categoryName": edition.kdc_code or work.category or "미분류",
        "price": edition.price or 0,
        "binding_type": edition.binding_type,
        "size_mm": edition.size_mm,
        
        # ▼▼▼ [핵심] 최초 발견자 데이터 박제 ▼▼▼
        "first_discoverer": discoverer_name
    }

# -------------------------------------------------------------------
# [6] 서재 관리 API (Library Management)
# -------------------------------------------------------------------

@app.post("/api/books")
async def register_book(request: RegisterBookRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 1. 사용자 조회
    user = db.query(models.User).filter(models.User.email == request.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    # 2. ISBN 처리
    final_isbn = request.isbn.strip()
    is_bnt_generated = False
    if not final_isbn:
        final_isbn = generate_btk_isbn()
        is_bnt_generated = True

    # ---------------------------------------------------------
    # [3. Work (작품) 확인 및 생성]
    # ---------------------------------------------------------
    work = db.query(models.Work).filter(
        models.Work.title == request.title, 
        models.Work.author == request.author
    ).first()

    if not work:
        work = models.Work(
            title=request.title, 
            author=request.author, 
            description=request.description,
            category=request.categoryName,
            original_title=request.originalTitle # [NEW] 원서명 저장
        )
        db.add(work)
        db.commit()
        db.refresh(work)
        
        # 3-2. 작가 정보 및 알라딘 ID 연동
        try:
            # A. 상세 정보(authorId 포함)가 있는 경우 우선 처리
            if hasattr(request, 'detailed_authors') and request.detailed_authors:
                for a_info in request.detailed_authors:
                    a_name = a_info.get('authorName')
                    a_id = a_info.get('authorId')
                    a_role = "Author"

                    contributor = db.query(models.Contributor).filter(
                        or_(
                            models.Contributor.aladin_author_id == a_id,
                            models.Contributor.name == a_name
                        )
                    ).first()

                    if not contributor:
                        contributor = models.Contributor(name=a_name, aladin_author_id=a_id)
                        db.add(contributor)
                        db.commit()
                        db.refresh(contributor)
                    elif a_id and not contributor.aladin_author_id:
                        contributor.aladin_author_id = a_id
                        db.commit()

                    link_exists = db.query(models.WorkContributor).filter(
                        models.WorkContributor.work_id == work.id,
                        models.WorkContributor.contributor_id == contributor.id
                    ).first()

                    if not link_exists:
                        link = models.WorkContributor(work_id=work.id, contributor_id=contributor.id, role=a_role)
                        db.add(link)
                        db.commit()

            # B. 상세 정보가 없는 경우 기존 문자열 파싱 (Fallback)
            else:
                parsed_authors = parse_author_string(request.author)
                for p_auth in parsed_authors:
                    contributor = db.query(models.Contributor).filter(models.Contributor.name == p_auth['name']).first()
                    if not contributor:
                        contributor = models.Contributor(name=p_auth['name'])
                        db.add(contributor)
                        db.commit()
                        db.refresh(contributor)
                    
                    link_exists = db.query(models.WorkContributor).filter(
                        models.WorkContributor.work_id == work.id,
                        models.WorkContributor.contributor_id == contributor.id,
                        models.WorkContributor.role == p_auth['role']
                    ).first()
                    
                    if not link_exists:
                        link = models.WorkContributor(work_id=work.id, contributor_id=contributor.id, role=p_auth['role'])
                        db.add(link)
                        db.commit()
                    
        except Exception as e:
            print(f"⚠️ 작가 정보 저장 중 오류 발생 (무시됨): {e}")
    else:
        # [NEW] 기존 데이터와 비교하여 더 나은 정보가 들어오면 업데이트
        work_updated = False
        if request.description and request.description != work.description:
            work.description = request.description
            work_updated = True
        if request.originalTitle and request.originalTitle != work.original_title:
            work.original_title = request.originalTitle
            work_updated = True
        if request.categoryName and request.categoryName != work.category:
            work.category = request.categoryName
            work_updated = True
        if work_updated:
            db.commit()
            db.refresh(work)

    # ---------------------------------------------------------
    # [4. Edition (판본) 생성]
    # ---------------------------------------------------------
    edition = db.query(models.Edition).filter(models.Edition.isbn == final_isbn).first()

    # 날짜 파싱 공통 로직
    parsed_pub_date = None
    if request.pubDate:
        clean_date = request.pubDate.replace(".", "").replace("-", "").strip()
        try:
            if len(clean_date) >= 8:
                parsed_pub_date = datetime.strptime(clean_date[:8], "%Y%m%d")
            elif len(clean_date) == 4:
                parsed_pub_date = datetime.strptime(clean_date, "%Y")
        except Exception:
            pass

    if not edition:
        parsed_pub_date = None
        if request.pubDate:
            clean_date = request.pubDate.replace(".", "").replace("-", "").strip()
            try:
                if len(clean_date) >= 8:
                    parsed_pub_date = datetime.strptime(clean_date[:8], "%Y%m%d")
                elif len(clean_date) == 4:
                    parsed_pub_date = datetime.strptime(clean_date, "%Y")
            except Exception as e:
                print(f"Date parsing error: {e}")
        
        edition = models.Edition(
            isbn=final_isbn,           
            isbn10=request.isbn10,
            addon_code=request.addon_code,
            work_id=work.id,           
            publisher=request.publisher,
            cover_image=request.cover, 
            page_count=request.pageCount,
            is_bnt_isbn=is_bnt_generated,
            publish_date=parsed_pub_date,
            binding_type=request.binding_type,
            kdc_code=request.kdc_code,
            language=request.language,
            size_mm=request.size_mm,
            price=request.price,
            
            # ▼▼▼ [NEW] BoooknTalk 최초 발견자(등록자) 영구 박제 ▼▼▼
            created_by_id=user.id
        )
        db.add(edition)
        db.commit()
        db.refresh(edition)
    else:
        # [NEW] 기존 판본 데이터에 빈칸이 있거나 값이 다르면 업데이트 (created_by_id는 건드리지 않음)
        ed_updated = False
        
        if request.isbn10 and not edition.isbn10:
            edition.isbn10 = request.isbn10
            ed_updated = True
        if request.cover and request.cover != edition.cover_image:
            edition.cover_image = request.cover
            ed_updated = True
        if request.pageCount and request.pageCount != edition.page_count:
            edition.page_count = request.pageCount
            ed_updated = True
        if request.price and request.price != edition.price:
            edition.price = request.price
            ed_updated = True
        if request.kdc_code and request.kdc_code != edition.kdc_code:
            edition.kdc_code = request.kdc_code
            ed_updated = True
        if request.binding_type and request.binding_type != edition.binding_type:
            edition.binding_type = request.binding_type
            ed_updated = True
        if request.size_mm and request.size_mm != edition.size_mm:
            edition.size_mm = request.size_mm
            ed_updated = True
        if parsed_pub_date and parsed_pub_date != edition.publish_date:
            edition.publish_date = parsed_pub_date
            ed_updated = True

        if ed_updated:
            db.commit()
            db.refresh(edition)

    # ---------------------------------------------------------
    # [5. Record (서재) 생성]
    # ---------------------------------------------------------
    record = db.query(models.Record).filter(
        models.Record.user_id == user.id, 
        models.Record.edition_id == edition.id  
    ).first()

    if record:
        raise HTTPException(status_code=400, detail="이미 서재에 등록된 도서입니다.")

    new_record = models.Record(
        user_id=user.id,
        edition_id=edition.id,
        status="WISH",
        rating=0.0
    )
    db.add(new_record)
    db.commit()

    # ▼▼▼ [핵심 2] 백그라운드 이미지 다운로드 지시 ▼▼▼
    # 외부 URL(http)이고, 아직 로컬 주소(localhost)가 아닐 때만 실행
    if request.cover and request.cover.startswith("http") and "localhost" not in request.cover:
        print(f"🚀 [Background] 이미지 다운로드 대기열 등록: Edition ID {edition.id}")
        background_tasks.add_task(
            download_and_update_cover, 
            edition.id,         # 저장된 판본 ID
            request.cover,      # 네이버/도서관 이미지 URL
            SessionLocal        # 백그라운드용 독립 DB 세션 팩토리
        )

    return {
        "status": "success", 
        "message": "도서가 서재에 등록되었습니다.",
        "isbn": edition.isbn,
        "title": work.title
    }

@app.get("/api/my-library/{user_email}")
async def get_my_library(user_email: str, db: Session = Depends(get_db)):
    """
    내 서재의 모든 책 목록 조회 (Record 기준)
    """
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        return []

    records = db.query(models.Record).filter(models.Record.user_id == user.id).order_by(models.Record.added_at.desc()).all()
    
    results = []
    for record in records:
        edition = record.edition
        work = edition.work
        rating_val = record.rating if record.rating is not None else 0.0
        
        # [NEW] 태그 목록 조회 (RecordTag 테이블 조인)
        record_tags = db.query(models.Tag).join(
            models.RecordTag, models.Tag.id == models.RecordTag.tag_id
        ).filter(models.RecordTag.record_id == record.id).all()
        tag_list = [t.name for t in record_tags]
        
        results.append({
            "library_id": record.id,
            "status": record.status,
            "added_at": record.added_at,
            "title": work.title,
            "author": work.author,
            "cover": edition.cover_image,
            "rating": rating_val,
            "short_review": record.short_review or "",
            "start_date": record.start_date.isoformat() if record.start_date else None,
            "finish_date": record.finish_date.isoformat() if record.finish_date else None,
            
            # ▼▼▼ [핵심] 새로 추가된 데이터 반환 ▼▼▼
            "current_page": record.current_page,
            "reading_format": record.reading_format,
            "tags": tag_list,
            
            "isbn": edition.isbn,
            "isbn10": edition.isbn10,
            # ▼▼▼ [NEW] 총 페이지 수 응답 추가 ▼▼▼
            "page_count": edition.page_count,
            "is_short_review_public": record.is_short_review_public
        })
    return results

@app.patch("/api/my-library/{library_id}")
async def update_library_entry(library_id: int, update_data: LibraryUpdate, db: Session = Depends(get_db)):
    """
    서재 기록 수정 (상태, 별점, 코멘트, 태그, 매체 등)
    """
    record = db.query(models.Record).filter(models.Record.id == library_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")

    update_dict = update_data.dict(exclude_unset=True)
    
    # 1. 태그 데이터는 별도 테이블에 저장해야 하므로 빼냅니다.
    tags_data = update_dict.pop('tags', None)

    # 2. 일반 컬럼(current_page, reading_format 등) 업데이트
    for key, value in update_dict.items():
        setattr(record, key, value)

    # 3. 태그 관계 저장 로직 (Many-to-Many)
    if tags_data is not None:
        # 기존 연결된 태그 삭제 후 재등록 (가장 깔끔한 동기화 방식)
        db.query(models.RecordTag).filter(models.RecordTag.record_id == library_id).delete()
        for tag_name in tags_data:
            tag_name = tag_name.strip()
            if not tag_name: continue
            
            # Tags 테이블에 이미 있는 태그인지 확인
            tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
            if not tag:
                tag = models.Tag(name=tag_name)
                db.add(tag)
                db.commit() # ID 발급을 위해 즉시 커밋
                db.refresh(tag)
            
            # Record와 Tag 연결
            db.add(models.RecordTag(record_id=library_id, tag_id=tag.id))

    try:
        db.commit()
        db.refresh(record)
        return {"message": "Updated successfully", "data": record.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# 1. 함수 정의 부분에 status 파라미터가 있는지 확인!
@app.get("/api/users/{user_email}/records")
async def read_user_records(
    user_email: str, 
    status: str = "ALL", 
    db: Session = Depends(get_db)
):
    print(f"\n[API 호출] 이메일: {user_email}, 요청된 상태: {status}")
 
    # 1. 사용자 찾기
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. 쟁반(joinedload)에 책(Edition)과 작품(Work) 정보를 한 번에 담아서 가져오라고 지시!
    query = db.query(models.Record).options(
        joinedload(models.Record.edition).joinedload(models.Edition.work)
    ).filter(models.Record.user_id == user.id)

    if status == "ALL":
        pass
    elif status == "REVIEW":
        query = query.filter(models.Record.short_review != None, models.Record.short_review != "")
    else:
        query = query.filter(models.Record.status == status)

    # DB에 딱 한 번만 가서 모든 데이터를 싹 가져옵니다!
    records = query.order_by(models.Record.added_at.desc()).all()
    
    # [태그 최적화] 태그도 책 하나하나마다 묻지 않고, 이 사용자의 모든 태그를 한 번에 가져와서 나눕니다.
    record_ids = [r.id for r in records]
    all_tags = []
    if record_ids:
        all_tags = db.query(models.RecordTag.record_id, models.Tag.name)\
            .join(models.Tag, models.RecordTag.tag_id == models.Tag.id)\
            .filter(models.RecordTag.record_id.in_(record_ids)).all()
            
    # 책 번호(record_id)를 키값으로 태그를 예쁘게 정리해 둡니다.
    tags_by_record = {}
    for record_id, tag_name in all_tags:
        if record_id not in tags_by_record:
            tags_by_record[record_id] = []
        tags_by_record[record_id].append(tag_name)

    # 3. 프론트엔드로 보낼 데이터 조립 (이제 DB를 찌르지 않습니다)
    response_data = []
    for record in records:
        if not record.edition:
            continue
            
        work_title = record.edition.work.title if record.edition.work else "제목 없음"
        work_author = record.edition.work.author if record.edition.work else "작가 미상"
        
        # 미리 찾아둔 태그 바구니에서 쏙 빼옵니다.
        tag_list = tags_by_record.get(record.id, [])

        book_info = {
            "library_id": record.id,
            "id": record.edition.id,
            "title": work_title,
            "author": work_author,
            "cover": record.edition.cover_image,
            "status": record.status,
            "rating": record.rating,
            "short_review": record.short_review,
            "added_at": record.added_at,
            "isbn": record.edition.isbn,
            "isbn10": record.edition.isbn10,
            "start_date": record.start_date.isoformat() if record.start_date else None,
            "finish_date": record.finish_date.isoformat() if record.finish_date else None,
            "current_page": record.current_page,
            "reading_format": record.reading_format,
            "tags": tag_list,  # 👈 최적화된 태그 적용
            "page_count": record.edition.page_count,
            "is_short_review_public": record.is_short_review_public
        }
        response_data.append(book_info)

    return response_data

@app.get("/api/records/{record_id}")
async def get_record_detail(record_id: int, db: Session = Depends(get_db)):
    """
    특정 독서 기록 상세 조회 + '내 서재'에 있는 같은 작품의 다른 에디션 목록 반환
    """
    record = db.query(models.Record).filter(models.Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="독서 기록을 찾을 수 없습니다.")

    current_edition = record.edition
    work = current_edition.work
    user_id = record.user_id
    
    discoverer_name = "익명의 여행자"
    if getattr(current_edition, 'creator', None):
        discoverer_name = current_edition.creator.nickname or current_edition.creator.email.split('@')[0]

    # 내 서재에 있는 다른 에디션 기록 조회
    my_other_records = db.query(models.Record).join(models.Edition).filter(
        models.Record.user_id == user_id,
        models.Edition.work_id == work.id,
        models.Record.id != record_id
    ).all()

    my_editions_data = []
    my_editions_data.append({
        "record_id": record.id,
        "edition_id": current_edition.id,
        "title": work.title,
        "publisher": current_edition.publisher,
        "publish_date": current_edition.publish_date,
        "cover_image": current_edition.cover_image,
        "status": record.status,
        "is_current": True
    })

    for rec in my_other_records:
        ed = rec.edition
        my_editions_data.append({
            "record_id": rec.id,
            "edition_id": ed.id,
            "title": ed.work.title,
            "publisher": ed.publisher,
            "publish_date": ed.publish_date,
            "cover_image": ed.cover_image,
            "status": rec.status,
            "is_current": False
        })

    # 태그 목록 조회
    record_tags = db.query(models.Tag).join(
        models.RecordTag, models.Tag.id == models.RecordTag.tag_id
    ).filter(models.RecordTag.record_id == record.id).all()
    tag_list = [t.name for t in record_tags]

    # ▼▼▼ [NEW] 전체 유저의 평균 별점 및 참여 인원수 계산 로직 ▼▼▼
    # 해당 작품(Work)에 속한 모든 에디션의 기록 중, 평점이 0보다 큰 기록만 집계
    rating_stats = db.query(
        func.count(models.Record.id),
        func.avg(models.Record.rating)
    ).join(models.Edition).filter(
        models.Edition.work_id == work.id,
        models.Record.rating > 0
    ).first()

    rating_count = rating_stats[0] or 0
    average_rating = round(rating_stats[1], 1) if rating_stats[1] else 0.0
    # ▲▲▲ 계산 로직 끝 ▲▲▲

    final_description = getattr(current_edition, 'description', None) or getattr(work, 'description', "")
    
    return {
        "record": {
            "id": record.id,
            "status": record.status,
            "start_date": record.start_date.isoformat() if record.start_date else None,
            "finish_date": record.finish_date.isoformat() if record.finish_date else None,
            "rating": record.rating,
            "short_review": record.short_review,
            "current_page": record.current_page,
            "reading_format": record.reading_format,
            "tags": tag_list,
            "is_short_review_public": record.is_short_review_public
        },
        "work": {
            "id": work.id,
            "title": work.title,
            "author": work.author,
            "category": work.category,
            "original_title": getattr(work, 'original_title', None),
            "description": getattr(work, 'description', ""),
            
            # ▼▼▼ [NEW] 응답 데이터에 통계 추가 ▼▼▼
            "average_rating": average_rating,
            "rating_count": rating_count
        },
        "current_edition": {
            "id": current_edition.id,
            "isbn": current_edition.isbn,
            "cover": current_edition.cover_image,
            "publisher": current_edition.publisher,
            "pubDate": current_edition.publish_date,
            "page_count": current_edition.page_count,
            "description": final_description, 
            "binding_type": getattr(current_edition, 'binding_type', None),
            "kdc_code": getattr(current_edition, 'kdc_code', None),
            "language": getattr(current_edition, 'language', "한국어"),
            "size_mm": getattr(current_edition, 'size_mm', None),
            "price": getattr(current_edition, 'price', None),
            "first_discoverer": discoverer_name
        },
        "my_editions": my_editions_data
    }

@app.post("/api/records/{record_id}/memos")
async def create_memo(record_id: int, memo_data: MemoCreate, db: Session = Depends(get_db)):
    record = db.query(models.Record).filter(models.Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")
        
    new_memo = models.Memo(
        user_id=record.user_id,
        record_id=record_id,
        page_number=memo_data.page_number,
        sentence=memo_data.sentence,
        thought=memo_data.thought,
        is_public=memo_data.is_public # ▼▼▼ 추가
    )
    db.add(new_memo)
    db.commit()
    db.refresh(new_memo)
    return {"status": "success", "memo_id": new_memo.id}

@app.get("/api/records/{record_id}/memos")
async def get_memos(record_id: int, db: Session = Depends(get_db)):
    memos = db.query(models.Memo).filter(models.Memo.record_id == record_id).order_by(models.Memo.created_at.desc()).all()
    
    result = []
    for m in memos:
        user = m.user
        result.append({
            "id": m.id,
            "page_number": m.page_number,
            "sentence": m.sentence,
            "thought": m.thought,
            "created_at": m.created_at.isoformat(),
            "author_name": user.nickname or user.email.split('@')[0],
            "author_image": user.profile_image or "",
            "is_public": m.is_public # ▼▼▼ 추가
        })
    return result

@app.delete("/api/memos/{memo_id}")
async def delete_memo(memo_id: int, db: Session = Depends(get_db)):
    memo = db.query(models.Memo).filter(models.Memo.id == memo_id).first()
    if not memo:
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")
    db.delete(memo)
    db.commit()
    return {"status": "success"}

# [2] 하단 메모 삭제 API(delete_memo) 바로 위쪽에 아래 코드 추가
@app.patch("/api/memos/{memo_id}")
async def update_memo(memo_id: int, memo_data: MemoUpdate, db: Session = Depends(get_db)):
    """
    기존에 작성된 메모(기억의 지층) 수정 API
    """
    memo = db.query(models.Memo).filter(models.Memo.id == memo_id).first()
    if not memo:
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")

    # 전달받은 데이터 중 값이 있는 것만 업데이트
    update_dict = memo_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(memo, key, value)

    db.commit()
    return {"status": "success"}

@app.delete("/api/library/{library_id}")
async def delete_library_entry(library_id: int, db: Session = Depends(get_db)):
    """
    내 서재에서 특정 도서 기록 삭제 
    (관련된 태그, 메모 등도 함께 안전하게 삭제)
    """
    # 1. 삭제할 기록(Record) 조회
    record = db.query(models.Record).filter(models.Record.id == library_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="삭제할 도서 기록을 찾을 수 없습니다.")

    try:
        # 2. 연관된 데이터 먼저 삭제 (외래키 제약조건 충돌 방지)
        # - 해당 도서에 달린 태그 연결 정보 삭제
        db.query(models.RecordTag).filter(models.RecordTag.record_id == library_id).delete()
        
        # - 해당 도서에 작성한 '기억의 지층' 메모들 삭제
        db.query(models.Memo).filter(models.Memo.record_id == library_id).delete()

        # 3. 최종 서재 기록 삭제
        db.delete(record)
        db.commit()
        
        return {"status": "success", "message": "서재에서 성공적으로 삭제되었습니다."}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"삭제 중 오류가 발생했습니다: {str(e)}")

# -------------------------------------------------------------------
# [API] 1. 유저 프로필 조회
# -------------------------------------------------------------------
@app.get("/api/users/{user_email}/profile")
async def get_user_profile(user_email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    return {
        "email": user.email,
        "nickname": user.nickname or "",
        "bio": user.bio or "",
        "profile_image": user.profile_image or ""
    }

# -------------------------------------------------------------------
# [API] 2. 유저 프로필(닉네임, 한줄소개) 업데이트
# -------------------------------------------------------------------
@app.put("/api/users/{user_email}/profile")
async def update_user_profile(
    user_email: str, 
    profile_data: ProfileUpdateRequest, 
    db: Session = Depends(get_db)
):
    # 1. 대상 유저 조회
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    # 2. 닉네임 중복 검사 (본인 닉네임이 아닌데 다른 사람이 쓰고 있는 경우)
    if profile_data.nickname and profile_data.nickname != user.nickname:
        existing_user = db.query(models.User).filter(models.User.nickname == profile_data.nickname).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="이미 사용 중인 닉네임입니다.")

    try:
        # 3. 닉네임 변경 이력 기록 (실제 변경이 일어났고, 기존 닉네임이 존재할 때만)
        if profile_data.nickname and profile_data.nickname != user.nickname:
            if user.nickname:  # 최초 등록이 아닌 '변경'인 경우만 기록
                history_record = models.NicknameHistory(
                    user_id=user.id,
                    old_nickname=user.nickname,
                    new_nickname=profile_data.nickname
                )
                db.add(history_record)

            # 유저 테이블 업데이트
            user.nickname = profile_data.nickname

        # 4. 기타 정보 업데이트 (한 줄 소개, 프로필 이미지 등)
        if profile_data.bio is not None:
            user.bio = profile_data.bio
        
        # 만약 프로필 이미지도 수정 가능하게 스키마에 있다면 추가
        # if profile_data.profile_image:
        #     user.profile_image = profile_data.profile_image
        
        db.commit()
        db.refresh(user)
        
        return {
            "status": "success", 
            "message": "프로필이 성공적으로 업데이트되었습니다.",
            "data": {
                "nickname": user.nickname,
                "bio": user.bio,
                "profile_image": user.profile_image
            }
        }
    except Exception as e: # IntegrityError를 포함한 포괄적 예외 처리
        db.rollback()
        print(f"Profile Update Error: {e}") # 디버깅용 로그
        raise HTTPException(status_code=500, detail="서버 내부 오류로 프로필을 업데이트하지 못했습니다.")

# [추가] 특정 책(Work)의 공개된 한줄평 목록 가져오기 API
@app.get("/api/works/{work_id}/short-reviews")
async def get_work_short_reviews(work_id: int, db: Session = Depends(get_db)):
    # Edition 테이블을 조인하여, 해당 Work에 속한 모든 Edition의 기록을 가져옵니다.
    records = db.query(models.Record).join(models.Edition).filter(
        models.Edition.work_id == work_id,
        models.Record.short_review.isnot(None),       # 한줄평 내용이 null이 아니고
        models.Record.short_review != "",             # 빈 문자열이 아니며
        models.Record.is_short_review_public == True  # 공개 설정된 데이터만
    ).order_by(models.Record.added_at.desc()).all()   # 최신순 정렬

    results = []
    for r in records:
        user = r.user
        results.append({
            "id": r.id,
            "user_name": user.nickname or user.email.split('@')[0],
            "user_image": user.profile_image or "",
            "rating": r.rating,
            "short_review": r.short_review,
            "created_at": r.added_at.isoformat() if r.added_at else ""
        })
    
    return results

@app.get("/api/users/{user_email}/short-reviews")
async def get_user_short_reviews(user_email: str, db: Session = Depends(get_db)):
    """
    내 서재에 남긴 '나의 한줄평' 전체 목록을 가져옵니다.
    """
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        
    # short_review가 비어있지 않은 기록만 필터링하여 최신순 정렬
    records = db.query(models.Record).filter(
        models.Record.user_id == user.id,
        models.Record.short_review != None,
        models.Record.short_review != ""
    ).order_by(models.Record.added_at.desc()).all()
    
    results = []
    for r in records:
        edition = r.edition
        work = edition.work
        results.append({
            "record_id": r.id,
            "title": work.title,
            "author": work.author,
            "cover": edition.cover_image,
            "rating": r.rating,
            "short_review": r.short_review,
            "is_short_review_public": r.is_short_review_public, # 공개/비공개 상태
            "created_at": r.added_at.isoformat() if r.added_at else None
        })
    return results

@app.post("/api/feeds/{feed_id}/like")
async def toggle_feed_like(feed_id: str, data: dict, db: Session = Depends(get_db)):
    user_email = data.get("user_email")
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # feed_id 분석 (예: memo_123, review_456)
    try:
        prefix, target_id = feed_id.split("_")
        target_id = int(target_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid feed ID format")

    # [기획] 상용 서비스에서는 소셜 활동 전용 테이블(LikeLog 등)을 사용하는 것이 데이터 분석에 유리함
    # 여기서는 유저의 행동이 정상적으로 접수되었음을 알리는 메시지를 반환합니다.
    
    return {
        "status": "success", 
        "feed_id": feed_id,
        "is_liked": True, # 실제 로직은 DB Toggle 결과에 따라 반환
        "message": f"User {user.nickname} liked {prefix} {target_id}"
    }

# main.py 파일 맨 아래쪽에 추가해 주세요.

@app.get("/api/admin/sync-covers")
async def sync_existing_covers(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    [관리자 전용] 기존에 등록된 도서 중 외부 URL(네이버 등)을 
    사용하고 있는 도서를 찾아 로컬로 일괄 다운로드합니다.
    """
    # 1. DB에서 로컬 주소(localhost)가 아닌 외부 http 주소를 가진 책들만 골라냅니다.
    editions_to_update = db.query(models.Edition).filter(
        models.Edition.cover_image.isnot(None),
        models.Edition.cover_image.like("http%"),
        ~models.Edition.cover_image.like("%localhost%"),       # 우리 서버 주소 제외
        ~models.Edition.cover_image.like("%/static/covers/%")  # 이미 다운로드된 주소 제외
    ).all()

    count = 0
    # 2. 찾아낸 책들을 하나씩 백그라운드 다운로드 대기열에 넣습니다.
    for edition in editions_to_update:
        background_tasks.add_task(
            download_and_update_cover,
            edition.id,
            edition.cover_image,
            SessionLocal
        )
        count += 1

    # 3. 작업 지시 완료 메시지 반환
    return {
        "status": "success",
        "message": f"총 {count}권의 도서 커버 이미지를 찾아 다운로드를 시작했습니다!",
        "target_editions": [ed.id for ed in editions_to_update]
    }