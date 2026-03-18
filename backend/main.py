#backend/main.py

from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, File, UploadFile, APIRouter, Body, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base, get_db, SessionLocal
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from utils import parse_author_string, download_and_update_cover
from sqlalchemy import or_, func, desc
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from routers import home, memos, editions, library
from dotenv import load_dotenv
from collections import defaultdict

from utils.author_parser import parse_author_string

import models, httpx, asyncio, uuid, os, sys, time, random, shutil, re

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

class ShortReviewRequest(BaseModel):
    edition_id: int
    user_email: str
    short_review: str

class LongReviewRequest(BaseModel):
    long_review_title: str
    long_review_content: str
    is_long_review_draft: bool

# 프론트엔드에서 넘겨받을 JSON 바디 데이터 규격 (현재 로그인한 유저의 이메일)
class FollowRequest(BaseModel):
    user_email: str

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

@app.get("/api/books/search/{isbn}")
async def search_external_books(isbn: str, extra: Optional[str] = None, db: Session = Depends(get_db)):
    """
    [상용화(BoooknTalk Pro) 대비 2 Tier 검색 아키텍처] 
    1. 국립중앙도서관(NLK): 법적 제약 없는 완벽한 핵심 서지정보 (1순위)
    2. 네이버 오픈 API: 표지 이미지 및 책 소개글 보완 (2순위)
    """
    
    clean_isbn = isbn.replace("-", "").strip()
    
    # --- 1. 우리 DB(캐시) 먼저 확인 ---
    existing_edition = db.query(models.Edition).filter(
        (models.Edition.isbn == clean_isbn) | (models.Edition.isbn10 == clean_isbn)
    ).first()

    # DB에 책이 존재하고, '커버 이미지'도 온전히 있을 때만 캐시를 반환합니다.
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
            "cover": existing_edition.cover_image,
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
        print(f"⚠️ DB 캐시 적중했으나 커버 이미지 누락! 외부 API로 보완합니다: {existing_edition.work.title}")
    
    # --- 2. 외부 API 호출 준비 ---
    async with httpx.AsyncClient() as client:
        nlk_url = f"https://www.nl.go.kr/seoji/SearchApi.do?cert_key={NLK_API_KEY}&result_style=json&page_no=1&page_size=10&isbn={isbn}"
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
                print(f"❌ 네이버 API 에러 발생: {naver_res.text}") 

        nlk_data = {}
        if not isinstance(nlk_res, Exception) and nlk_res.status_code == 200:
            nlk_data = nlk_res.json()

        nlk_item = nlk_data.get('docs', [{}])[0] if nlk_data.get('docs') else {}
        naver_items = naver_data.get('items', [])
        naver_item = naver_items[0] if naver_items else {}

        # 제목 확인 (검색 실패 여부 판단)
        raw_title = nlk_item.get('TITLE') or naver_item.get('title')
        if not raw_title:
            raise HTTPException(status_code=404, detail="도서 정보를 찾을 수 없습니다.")

        # ▼▼▼ [NEW] 다권본 및 세트 도서 완벽 분리를 위한 제목 가공 엔진 ▼▼▼
        # 국립중앙도서관의 '권차(VOL)' 데이터를 적극 활용합니다.
        vol = nlk_item.get('VOL') or ""
        clean_title = raw_title.strip()

        if vol:
            vol_str = str(vol).strip()
            # 숫자로만 되어있으면 직관성을 위해 '권'을 붙여줌 (예: '1' -> '1권')
            if vol_str.isdigit():
                vol_str = f"{vol_str}권"

            # 기존 제목에 해당 권수 단어가 명시되어 있지 않다면 강제로 꼬리표 부착
            if vol_str not in clean_title:
                clean_title = f"{clean_title} {vol_str}"

        # 세트/전집 처리 (제목에 명시되어 있다면 깔끔하게 [세트] 태그로 포맷팅)
        if "세트" in clean_title or "전집" in clean_title or "전권" in clean_title:
            # 기존 지저분한 세트 단어를 지우고 앞에 [세트]를 통일감 있게 붙임
            clean_title = clean_title.replace("세트", "").replace("전집", "").replace("()", "").strip()
            if not clean_title.startswith("[세트]"):
                clean_title = f"[세트] {clean_title}"

        final_title = clean_title.strip()
        # ▲▲▲ [NEW] 가공 엔진 끝 ▲▲▲

        cover = ""
        if naver_item.get('image'):
            cover = naver_item.get('image')
        elif nlk_item.get('IMAGE_URL'):
             cover = nlk_item.get('IMAGE_URL')
        elif nlk_item.get('TITLE_URL'): 
             cover = nlk_item.get('TITLE_URL')
        
        print(f"🖼️ 최종 추출된 커버 이미지 URL: '{cover}'\n--------------------------")
        
        author = nlk_item.get('AUTHOR') or naver_item.get('author') or "저자 미상"
        publisher = nlk_item.get('PUBLISHER') or naver_item.get('publisher') or "출판사 미상"
        pubDate = nlk_item.get('PUBLISH_PREDATE') or naver_item.get('pubdate') or ""
        
        page_raw = nlk_item.get('PAGE') or ""
        page_count = 0
        if page_raw:
            import re
            nums = re.findall(r'\d+', str(page_raw))
            if nums: page_count = int(nums[0])

        return {
            "title": final_title, # 👈 가공된 완벽한 제목 전달!
            "author": author,
            "publisher": publisher,
            "pubDate": pubDate,
            "categoryName": nlk_item.get('KDC') or "", 
            "cover": cover, 
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
    내 서재의 모든 책 목록 조회 - 🚀 N+1 쿼리 최적화 완료
    """
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        return []

    # 1. 🚀 [최적화 1단계] Record 조회 시 Edition과 Work를 한 번의 JOIN으로 미리 다 당겨옵니다.
    records = db.query(models.Record)\
        .options(
            joinedload(models.Record.edition).joinedload(models.Edition.work)
        )\
        .filter(models.Record.user_id == user.id)\
        .order_by(models.Record.added_at.desc())\
        .all()
    
    if not records:
        return []
        
    record_ids = [r.id for r in records]
    
    # 2. 긴줄평 유무 확인 (기존과 동일하게 IN 쿼리 1번)
    long_reviews = db.query(models.LongReview.record_id).filter(
        models.LongReview.record_id.in_(record_ids)
    ).all()
    long_review_record_ids = {lr[0] for lr in long_reviews}

    # 3. 🚀 [최적화 2단계] 루프 안에 있던 태그 조회 쿼리를 밖으로 뺐습니다!
    # 사용자의 모든 책에 달린 태그를 단 '1번'의 쿼리로 싹 다 가져옵니다.
    all_tags = db.query(models.RecordTag.record_id, models.Tag.name)\
        .join(models.Tag, models.Tag.id == models.RecordTag.tag_id)\
        .filter(models.RecordTag.record_id.in_(record_ids))\
        .all()
        
    # record_id를 열쇠(Key)로 삼아 태그들을 파이썬 메모리(사전)에 예쁘게 분류해 놓습니다.
    tags_by_record = defaultdict(list)
    for record_id, tag_name in all_tags:
        tags_by_record[record_id].append(tag_name)

    # 4. 결과 조립 (이제 이 루프 내부에는 단 하나의 DB 쿼리도 발생하지 않습니다!)
    results = []
    for record in records:
        edition = record.edition
        work = edition.work if edition else None
        
        # 방어 코드 (혹시 DB에 연결 끊긴 고아 데이터가 있을 경우 에러 방지)
        title = work.title if work else "제목 없음"
        author = work.author if work else "작가 미상"
        cover = edition.cover_image if edition else ""
        isbn = edition.isbn if edition else ""
        isbn10 = edition.isbn10 if edition else ""
        page_count = edition.page_count if edition else 0
        
        rating_val = record.rating if record.rating is not None else 0.0
        
        # 🚀 매번 DB를 찌르는 대신, 아까 만들어둔 메모리 사전에서 쏙쏙 빼옵니다.
        tag_list = tags_by_record.get(record.id, [])
        
        results.append({
            "library_id": record.id,
            "status": record.status,
            "added_at": record.added_at,
            "title": title,
            "author": author,
            "cover": cover,
            "rating": rating_val,
            "short_review": record.short_review or "",
            "start_date": record.start_date.isoformat() if record.start_date else None,
            "finish_date": record.finish_date.isoformat() if record.finish_date else None,
            "current_page": record.current_page,
            "reading_format": record.reading_format,
            "tags": tag_list,
            
            "isbn": isbn,
            "isbn10": isbn10,
            "page_count": page_count,
            "is_short_review_public": record.is_short_review_public,
            "has_long_review": record.id in long_review_record_ids
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


@app.get("/api/users/{user_email}/records")
async def read_user_records(
    user_email: str, 
    status: str = "ALL", 
    current_user_email: Optional[str] = None, # ▼▼▼ [NEW] 현재 접속 중인 유저 확인용
    db: Session = Depends(get_db)
):
    print(f"\n[API 호출] 대상 서재: {user_email}, 방문자: {current_user_email}, 상태: {status}")
 
    # 1. 서재 주인장 정보 조회
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ▼▼▼ [NEW] 본인 서재인지 확인 ▼▼▼
    is_mine = False
    if current_user_email and current_user_email == user_email:
        is_mine = True

    query = db.query(models.Record).options(
        joinedload(models.Record.edition).joinedload(models.Edition.work)
    ).filter(models.Record.user_id == user.id)

    if status == "ALL":
        pass
    elif status == "REVIEW":
        query = query.filter(models.Record.short_review != None, models.Record.short_review != "")
    else:
        query = query.filter(models.Record.status == status)

    records = query.order_by(models.Record.added_at.desc()).all()
    
    record_ids = [r.id for r in records]
    all_tags = []
    if record_ids:
        all_tags = db.query(models.RecordTag.record_id, models.Tag.name)\
            .join(models.Tag, models.RecordTag.tag_id == models.Tag.id)\
            .filter(models.RecordTag.record_id.in_(record_ids)).all()
            
    tags_by_record = {}
    for record_id, tag_name in all_tags:
        if record_id not in tags_by_record:
            tags_by_record[record_id] = []
        tags_by_record[record_id].append(tag_name)

    # ▼▼▼ [핵심 업데이트] 긴줄평 노출 권한 로직 ▼▼▼
    long_reviews = []
    if record_ids:
        if is_mine:
            # 내가 내 서재를 볼 때: 임시저장(비공개) 포함 모든 긴줄평 노출
            long_reviews = db.query(models.LongReview.record_id).filter(
                models.LongReview.record_id.in_(record_ids)
            ).all()
        else:
            # 타인이 내 서재를 볼 때: 발행된(is_draft == False) 긴줄평만 노출
            long_reviews = db.query(models.LongReview.record_id).filter(
                models.LongReview.record_id.in_(record_ids),
                models.LongReview.is_draft == False
            ).all()
            
    long_review_record_ids = {lr[0] for lr in long_reviews}

    response_data = []
    for record in records:
        if not record.edition:
            continue
            
        work_title = record.edition.work.title if record.edition.work else "제목 없음"
        work_author = record.edition.work.author if record.edition.work else "작가 미상"
        tag_list = tags_by_record.get(record.id, [])
        
        has_long_review = record.id in long_review_record_ids

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
            "tags": tag_list,
            "page_count": record.edition.page_count,
            "is_short_review_public": record.is_short_review_public,
            # (만약 Record 모델에 is_spoiler가 있다면 추가. 여기선 긴줄평 정보만 넘깁니다)
            "has_long_review": has_long_review,
            "is_mine": is_mine # 프론트에서 활용할 수 있게 던져줌
        }
        response_data.append(book_info)

    return response_data

@app.get("/api/users/{user_email}/wish")
async def get_my_wishlist(user_email: str, db: Session = Depends(get_db)):
    """[내 서재 - 읽고 싶은 도서] 전용 API"""
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    records = db.query(models.Record).options(
        joinedload(models.Record.edition).joinedload(models.Edition.work)
    ).filter(
        models.Record.user_id == user.id,
        models.Record.status == "WISH"
    ).order_by(models.Record.added_at.desc()).all()

    results = []
    for r in records:
        if not r.edition or not r.edition.work: continue
        work = r.edition.work
        results.append({
            "library_id": r.id,
            "id": r.edition.id,
            "title": work.title,
            "author": work.author,
            "cover": r.edition.cover_image,
            "status": r.status,
            "added_at": r.added_at.isoformat() if r.added_at else None,
            "isbn": r.edition.isbn
        })
    return results

@app.get("/api/users/{user_email}/tags")
async def get_records_by_tags(user_email: str, db: Session = Depends(get_db)):
    """[내 서재 - 나만의 태그] 태그별 도서 모아보기 API"""
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    records = db.query(models.Record).options(
        joinedload(models.Record.edition).joinedload(models.Edition.work)
    ).filter(models.Record.user_id == user.id).all()

    if not records:
        return []

    record_ids = [r.id for r in records]
    record_dict = {r.id: r for r in records}

    record_tags = db.query(models.RecordTag.record_id, models.Tag.name)\
        .join(models.Tag, models.RecordTag.tag_id == models.Tag.id)\
        .filter(models.RecordTag.record_id.in_(record_ids)).all()

    tag_groups = defaultdict(list)
    for rec_id, tag_name in record_tags:
        r = record_dict.get(rec_id)
        if r and r.edition and r.edition.work:
            tag_groups[tag_name].append({
                "library_id": r.id,
                "title": r.edition.work.title,
                "author": r.edition.work.author,
                "cover": r.edition.cover_image,
                "status": r.status
            })

    results = []
    for tag_name, books in tag_groups.items():
        results.append({
            "tag_name": tag_name,
            "count": len(books),
            "books": books
        })
    results.sort(key=lambda x: x["count"], reverse=True)
    
    return results

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
async def get_user_profile(
    user_email: str, 
    current_user_email: Optional[str] = None, # [추가] 현재 화면을 보고 있는 유저
    db: Session = Depends(get_db)
):
    """
    유저 프로필 조회 (+ 나와 상대방의 팔로우 관계 포함)
    """
    # 1. 조회할 대상(타겟) 유저 정보 가져오기
    target_user = db.query(models.User).filter(models.User.email == user_email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    is_following = False
    is_follower = False

    # 2. 현재 로그인한 유저의 이메일이 넘어왔고, 자기 자신의 프로필이 아니라면 양방향 관계 확인
    if current_user_email and current_user_email != user_email:
        current_user = db.query(models.User).filter(models.User.email == current_user_email).first()
        
        if current_user:
            # ① 내가 저 사람을 팔로우 중인가? (버튼 파란색/회색 처리용)
            existing_following = db.query(models.Follow).filter_by(
                follower_id=current_user.id,
                following_id=target_user.id
            ).first()
            is_following = existing_following is not None

            # ② 저 사람이 나를 팔로우 중인가? ('나를 팔로우함' 뱃지 노출용)
            existing_follower = db.query(models.Follow).filter_by(
                follower_id=target_user.id,
                following_id=current_user.id
            ).first()
            is_follower = existing_follower is not None

    # 3. 프론트엔드로 전달할 최종 데이터
    return {
        "id": target_user.id,
        "email": target_user.email,
        "nickname": target_user.nickname or "",
        "bio": target_user.bio or "",
        "profile_image": target_user.profile_image or "",
        
        # [NEW] 소셜 데이터
        "follower_count": target_user.follower_count or 0,
        "following_count": target_user.following_count or 0,
        "is_following": is_following,
        "is_follower": is_follower
    }

# =====================================================================
# 2. 타인의 서재 도서 목록 조회 API
# =====================================================================
@app.get("/api/users/{target_user_id}/library/books")
async def get_user_library_books(
    target_user_id: int, 
    db: Session = Depends(get_db)
):
    """
    [타인의 서재] 대상 유저가 담아둔 도서 목록 반환
    """
    # UserLibrary, Edition, Work 3단 JOIN을 통해 서재 데이터 및 표지 긁어오기 (최신순)
    results = db.query(models.UserLibrary, models.Edition, models.Work)\
        .join(models.Edition, models.UserLibrary.edition_id == models.Edition.id)\
        .join(models.Work, models.Edition.work_id == models.Work.id)\
        .filter(models.UserLibrary.user_id == target_user_id)\
        .order_by(models.UserLibrary.added_at.desc())\
        .all()

    books = []
    for user_lib, edition, work in results:
        books.append({
            "library_id": user_lib.id,
            "edition_id": edition.id,
            "work_id": work.id,
            "title": work.title,
            "author": work.author,
            "cover_image": edition.cover_image,
            "status": user_lib.status,  # READING, COMPLETED, WISH 등
            "added_at": user_lib.added_at
        })

    return books

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
    records = db.query(models.Record)\
        .join(models.Edition)\
        .options(joinedload(models.Record.user))\
        .filter( # N+1 방지: user 테이블을 미리 JOIN해서 가져옵니다!
            models.Edition.work_id == work_id,
            models.Record.short_review.isnot(None),
            models.Record.short_review != "",
            models.Record.is_short_review_public == True
        ).order_by(models.Record.added_at.desc()).all()

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

# ▼▼▼ 2. 신규 긴줄평 API 추가 ▼▼▼
@app.get("/api/works/{work_id}/long-reviews")
async def get_work_long_reviews(work_id: int, db: Session = Depends(get_db)):
    """
    해당 Work에 속한 공개된 긴줄평(서평) 목록을 조회합니다. (HTML 태그 제거 완료)
    """
    long_reviews = db.query(models.LongReview)\
        .join(models.Record).join(models.Edition)\
        .options(joinedload(models.LongReview.record).joinedload(models.Record.user))\
        .filter(
            models.Edition.work_id == work_id,
            models.LongReview.is_draft == False 
        ).order_by(models.LongReview.created_at.desc()).all()
        
    results = []
    for lr in long_reviews:
        user = lr.record.user
        clean_text = re.sub(r'<[^>]+>', '', lr.content) if lr.content else ""
        
        results.append({
            "id": lr.id,
            "record_id": lr.record_id,
            
            # ▼▼▼ [핵심 추가] 이 두 줄이 있어야 프론트엔드에서 내 글 판별과 프로필 이동이 가능합니다! ▼▼▼
            "user_id": user.id,
            "user_email": user.email,
            # ▲▲▲ 추가 완료 ▲▲▲
            
            "title": lr.title,
            "content_preview": clean_text[:150] + "..." if len(clean_text) > 150 else clean_text,
            "user_name": user.nickname or user.email.split('@')[0],
            "user_image": user.profile_image or "",
            "rating": lr.record.rating,
            "created_at": lr.created_at.isoformat() if lr.created_at else ""
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

# @app.post("/api/feeds/{feed_id}/like")
# async def toggle_feed_like(feed_id: str, data: dict, db: Session = Depends(get_db)):
#     user_email = data.get("user_email")
#     user = db.query(models.User).filter(models.User.email == user_email).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     # feed_id 분석 (예: memo_123, review_456)
#     try:
#         prefix, target_id = feed_id.split("_")
#         target_id = int(target_id)
#     except ValueError:
#         raise HTTPException(status_code=400, detail="Invalid feed ID format")

#     # [기획] 상용 서비스에서는 소셜 활동 전용 테이블(LikeLog 등)을 사용하는 것이 데이터 분석에 유리함
#     # 여기서는 유저의 행동이 정상적으로 접수되었음을 알리는 메시지를 반환합니다.
    
#     return {
#         "status": "success", 
#         "feed_id": feed_id,
#         "is_liked": True, # 실제 로직은 DB Toggle 결과에 따라 반환
#         "message": f"User {user.nickname} liked {prefix} {target_id}"
#     }

# # main.py 파일 맨 아래쪽에 추가해 주세요.

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

# -------------------------------------------------------------------
# [NEW] 긴줄평 (Long Review) API (조회, 저장/수정, 삭제)
# -------------------------------------------------------------------

@app.get("/api/records/{record_id}/long-review")
async def get_long_review(record_id: int, db: Session = Depends(get_db)):
    """특정 독서 기록(Record)에 작성된 긴줄평 조회"""
    review = db.query(models.LongReview).filter(models.LongReview.record_id == record_id).first()
    if not review:
        return {} # 작성된 긴줄평이 없으면 빈 객체 반환
    
    return {
        "long_review_title": review.title,
        "long_review_content": review.content,
        "is_long_review_draft": review.is_draft
    }

@app.put("/api/records/{record_id}/long-review")
async def upsert_long_review(record_id: int, req: LongReviewRequest, db: Session = Depends(get_db)):
    """긴줄평 저장 및 수정 (Upsert)"""
    record = db.query(models.Record).filter(models.Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="독서 기록을 찾을 수 없습니다.")

    review = db.query(models.LongReview).filter(models.LongReview.record_id == record_id).first()
    
    # Edition을 통해 Work ID 가져오기 (작품 단위 조회를 위함)
    edition = db.query(models.Edition).filter(models.Edition.id == record.edition_id).first()
    work_id = edition.work_id if edition else None

    if review:
        # 기존 긴줄평 업데이트
        review.title = req.long_review_title
        review.content = req.long_review_content
        review.is_draft = req.is_long_review_draft
    else:
        # 새 긴줄평 생성
        new_review = models.LongReview(
            user_id=record.user_id,
            record_id=record_id,
            work_id=work_id,
            title=req.long_review_title,
            content=req.long_review_content,
            is_draft=req.is_long_review_draft
        )
        db.add(new_review)
    
    db.commit()
    return {"message": "긴줄평이 성공적으로 저장되었습니다."}

@app.delete("/api/records/{record_id}/long-review")
async def delete_long_review(record_id: int, db: Session = Depends(get_db)):
    """긴줄평 삭제"""
    review = db.query(models.LongReview).filter(models.LongReview.record_id == record_id).first()
    if review:
        db.delete(review)
        db.commit()
        return {"message": "긴줄평이 삭제되었습니다."}
    raise HTTPException(status_code=404, detail="삭제할 긴줄평이 없습니다.")

# 1. 긴줄평 이미지를 저장할 폴더 생성 (Static Files 설정 아래쪽에 추가 권장)
REVIEW_UPLOAD_DIR = "static/uploads/reviews"
if not os.path.exists(REVIEW_UPLOAD_DIR):
    os.makedirs(REVIEW_UPLOAD_DIR)

# -------------------------------------------------------------------
# [NEW] 긴줄평 내 삽입용 이미지 업로드 API
# -------------------------------------------------------------------
@app.post("/api/records/{record_id}/long-review/images")
async def upload_review_image(record_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    긴줄평 작성 중 이미지를 삽입할 때 호출되는 업로드 API입니다.
    이미지를 고유한 이름으로 저장하고, 접근 가능한 URL을 반환합니다.
    """
    # 1. 기록 존재 여부 가볍게 확인
    record = db.query(models.Record).filter(models.Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")

    # 2. 파일 확장자 검증 (이미지 파일만 허용)
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        raise HTTPException(status_code=400, detail="허용되지 않는 파일 형식입니다.")

    # 3. 고유한 파일명 생성 (UUID 사용)
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(REVIEW_UPLOAD_DIR, unique_filename)

    # 4. 파일 저장
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 저장 중 오류 발생: {str(e)}")

    # 5. 접근 가능한 URL 반환
    # 예: http://localhost:8000/static/uploads/reviews/unique_id.jpg
    image_url = f"http://localhost:8000/{REVIEW_UPLOAD_DIR}/{unique_filename}"
    
    return {"url": image_url}

# ===================================================================
# [NEW] 긴줄평 (Long Review) API (조회, 저장/수정, 삭제, 이미지 업로드)
# ===================================================================

# 1. 긴줄평 이미지를 저장할 로컬 폴더 생성
REVIEW_UPLOAD_DIR = "static/uploads/reviews"
if not os.path.exists(REVIEW_UPLOAD_DIR):
    os.makedirs(REVIEW_UPLOAD_DIR)

# 2. 데이터 스키마 (파일 상단의 Pydantic 모델 정의 근처에 두어도 됩니다)
class LongReviewRequest(BaseModel):
    long_review_title: str
    long_review_content: str
    is_long_review_draft: bool

# 3. [GET] 긴줄평 조회
@app.get("/api/records/{record_id}/long-review")
async def get_long_review(record_id: int, db: Session = Depends(get_db)):
    """특정 독서 기록(Record)에 작성된 긴줄평 조회"""
    review = db.query(models.LongReview).filter(models.LongReview.record_id == record_id).first()
    if not review:
        return {} # 작성된 긴줄평이 없으면 빈 객체 반환
    
    return {
        "long_review_title": review.title,
        "long_review_content": review.content,
        "is_long_review_draft": review.is_draft,
        "created_at": review.created_at.isoformat() if review.created_at else None
    }

# 4. [PUT] 긴줄평 작성 및 수정 (Upsert)
@app.put("/api/records/{record_id}/long-review")
async def upsert_long_review(record_id: int, req: LongReviewRequest, db: Session = Depends(get_db)):
    """긴줄평 저장 및 수정"""
    record = db.query(models.Record).filter(models.Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="독서 기록을 찾을 수 없습니다.")

    review = db.query(models.LongReview).filter(models.LongReview.record_id == record_id).first()
    
    # Edition을 통해 Work ID 가져오기 (작품 단위 조회를 위함)
    edition = db.query(models.Edition).filter(models.Edition.id == record.edition_id).first()
    work_id = edition.work_id if edition else None

    if review:
        # 기존 긴줄평 업데이트
        review.title = req.long_review_title
        review.content = req.long_review_content
        review.is_draft = req.is_long_review_draft
    else:
        # 새 긴줄평 생성
        new_review = models.LongReview(
            user_id=record.user_id,
            record_id=record_id,
            work_id=work_id,
            title=req.long_review_title,
            content=req.long_review_content,
            is_draft=req.is_long_review_draft
        )
        db.add(new_review)
    
    try:
        db.commit()
        return {"message": "긴줄평이 성공적으로 저장되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="저장 중 오류가 발생했습니다.")

# 5. [DELETE] 긴줄평 삭제 (방금 404 에러가 났던 원인)
@app.delete("/api/records/{record_id}/long-review")
async def delete_long_review(record_id: int, db: Session = Depends(get_db)):
    """긴줄평 삭제 API"""
    review = db.query(models.LongReview).filter(models.LongReview.record_id == record_id).first()
    if review:
        db.delete(review)
        db.commit()
        return {"message": "긴줄평이 성공적으로 삭제되었습니다."}
    raise HTTPException(status_code=404, detail="삭제할 긴줄평을 찾을 수 없습니다.")

# 6. [POST] 긴줄평 에디터 내 이미지 업로드 API
@app.post("/api/records/{record_id}/long-review/images")
async def upload_review_image(record_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    긴줄평 작성 중 이미지를 삽입할 때 호출됩니다.
    이미지를 고유한 이름으로 로컬에 저장하고 URL을 반환합니다.
    """
    record = db.query(models.Record).filter(models.Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드할 수 있습니다.")

    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(REVIEW_UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="파일 저장 중 오류가 발생했습니다.")

    # 프론트엔드 에디터에 반환할 이미지 주소
    image_url = f"http://localhost:8000/{REVIEW_UPLOAD_DIR}/{unique_filename}"
    
    return {"url": image_url}

@app.post("/api/short-reviews")
async def create_short_review(review_data: ShortReviewRequest, db: Session = Depends(get_db)):
    """한줄평 새롭게 작성"""
    user = db.query(models.User).filter(models.User.email == review_data.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    record = db.query(models.Record).filter(
        models.Record.user_id == user.id,
        models.Record.edition_id == review_data.edition_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="내 서재에 없는 책입니다.")

    # Record 테이블의 short_review 컬럼 업데이트
    record.short_review = review_data.short_review
    
    # [디테일] 상태가 아직 '읽고 싶음(WISH)'이라면 한줄평 작성 시 '완독(FINISHED)'으로 자동 변경
    if record.status == "WISH":
        record.status = "FINISHED"

    db.commit()
    db.refresh(record)
    return {"status": "success", "message": "한줄평이 등록되었습니다.", "record_id": record.id}

@app.put("/api/short-reviews/{record_id}")
async def update_short_review(record_id: int, review_data: ShortReviewRequest, db: Session = Depends(get_db)):
    """기존 한줄평 수정"""
    user = db.query(models.User).filter(models.User.email == review_data.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    record = db.query(models.Record).filter(models.Record.id == record_id).first()

    if not record or record.user_id != user.id:
        raise HTTPException(status_code=404, detail="수정할 한줄평을 찾을 수 없거나 권한이 없습니다.")

    record.short_review = review_data.short_review
    db.commit()
    return {"status": "success", "message": "한줄평이 수정되었습니다."}

@app.delete("/api/short-reviews/{record_id}")
async def delete_short_review(record_id: int, db: Session = Depends(get_db)):
    """한줄평 삭제 (Record 자체를 지우는게 아니라 내용만 NULL 처리)"""
    record = db.query(models.Record).filter(models.Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="삭제할 기록을 찾을 수 없습니다.")

    record.short_review = None
    db.commit()
    return {"status": "success", "message": "한줄평이 삭제되었습니다."}

# ===================================================================
# [NEW] 마이페이지 (통계 대시보드) API
# ===================================================================

@app.get("/api/mypage/stats/{user_email}")
async def get_mypage_stats(user_email: str, db: Session = Depends(get_db)):
    """
    유저의 프로필, 요약 통계, 월별 독서량 추이, 선호 장르, 태그 등을 한 번에 반환합니다.
    """
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    # 1. 프로필 정보
    profile = {
        "nickname": user.nickname or user.email.split('@')[0],
        "bio": user.bio or "아직 작성된 한 줄 소개가 없습니다.",
        "profile_image": user.profile_image or ""
    }

    # 2. 독서 기록 전체 가져오기 (Work, Edition 조인)
    records = db.query(models.Record).options(
        joinedload(models.Record.edition).joinedload(models.Edition.work)
    ).filter(models.Record.user_id == user.id).all()

    # 요약 통계 계산
    finished_books = [r for r in records if r.status == 'FINISHED']
    reading_books = [r for r in records if r.status == 'READING']
    
    rated_books = [r for r in records if r.rating is not None and r.rating > 0]
    avg_rating = sum(r.rating for r in rated_books) / len(rated_books) if rated_books else 0.0
    
    total_pages = sum(r.current_page for r in records if r.current_page)

    # 3. 올해 월별 독서량 추이 (완독 기준)
    current_year = datetime.now().year
    monthly_trend = {month: 0 for month in range(1, 13)}
    
    for r in finished_books:
        if r.finish_date and r.finish_date.year == current_year:
            monthly_trend[r.finish_date.month] += 1
            
    trend_data = [{"month": f"{m}월", "count": monthly_trend[m]} for m in range(1, 13)]

    # 4. 장르(카테고리) 취향 분석
    genre_counts = {}
    for r in records:
        if r.edition and r.edition.work and r.edition.work.category:
            cat = r.edition.work.category.split('>')[0].strip() # 대분류만 추출 (예: 국내도서 > 소설 -> 국내도서)
            genre_counts[cat] = genre_counts.get(cat, 0) + 1
            
    top_genres = [{"genre": k, "count": v} for k, v in sorted(genre_counts.items(), key=lambda item: item[1], reverse=True)[:5]]

    # 5. 최다 사용 태그 (Word Cloud용)
    user_record_ids = [r.id for r in records]
    tag_counts = {}
    if user_record_ids:
        record_tags = db.query(models.Tag.name).join(
            models.RecordTag, models.RecordTag.tag_id == models.Tag.id
        ).filter(models.RecordTag.record_id.in_(user_record_ids)).all()
        
        for (tag_name,) in record_tags:
            tag_counts[tag_name] = tag_counts.get(tag_name, 0) + 1
            
    top_tags = [{"text": k, "count": v} for k, v in sorted(tag_counts.items(), key=lambda item: item[1], reverse=True)[:10]]

    return {
        "profile": profile,
        "summary": {
            "total_finished": len(finished_books),
            "total_reading": len(reading_books),
            "avg_rating": round(avg_rating, 1),
            "total_pages": total_pages
        },
        "trend_data": trend_data,
        "top_genres": top_genres,
        "top_tags": top_tags
    }

# ===================================================================
# [NEW] 소셜 광장 (Square / Feed) API
# ===================================================================
from sqlalchemy import or_

@app.get("/api/square/feeds")
async def get_square_feeds(user_email: Optional[str] = None, feed_type: str = "all", limit: int = 30, db: Session = Depends(get_db)):
    """광장 피드 목록 (팔로우 필터링, 스포일러 상태, 본인 글 여부 포함)"""
    current_user_id = None
    following_ids = []
    
    if user_email:
        user = db.query(models.User).filter(models.User.email == user_email).first()
        if user:
            current_user_id = user.id
            follows = db.query(models.Follow.following_id).filter(models.Follow.follower_id == current_user_id).all()
            following_ids = [f[0] for f in follows]

    query = db.query(models.Record).options(
        joinedload(models.Record.user),
        joinedload(models.Record.edition).joinedload(models.Edition.work)
    )

    query = query.filter(
        or_(
            models.Record.short_review != None,
            models.Record.short_review != "",
        )
    ).filter(models.Record.is_short_review_public == True)

    if feed_type == "following":
        if not current_user_id:
            return [] 
        query = query.filter(models.Record.user_id.in_(following_ids))

    records = query.order_by(models.Record.added_at.desc()).limit(limit).all()

    feeds = []
    for r in records:
        if not r.edition or not r.user:
            continue
            
        likes_count = db.query(models.RecordLike).filter(models.RecordLike.record_id == r.id).count()
        
        is_liked = False
        is_following = False
        is_mine = False # ▼▼▼ [NEW] 내 글인지 판별하는 변수
        
        if current_user_id:
            like_exists = db.query(models.RecordLike).filter(
                models.RecordLike.record_id == r.id, 
                models.RecordLike.user_id == current_user_id
            ).first()
            if like_exists: is_liked = True
                
            if r.user_id in following_ids:
                is_following = True
                
            # ▼▼▼ [NEW] 현재 로그인한 유저와 글 작성자가 같으면 True
            if current_user_id == r.user_id:
                is_mine = True

        feeds.append({
            "id": r.id,
            "edition_id": r.edition.id, 
            "isbn": r.edition.isbn,
            "user_id": r.user_id, # 👈 프론트엔드로 전달될 핵심 ID
            "user_name": r.user.nickname or r.user.email.split('@')[0],
            "user_image": r.user.profile_image or "",
            "book_title": r.edition.work.title if r.edition.work else "제목 없음",
            "book_author": r.edition.work.author if r.edition.work else "작가 미상",
            "cover": r.edition.cover_image,
            "text": r.short_review, 
            "rating": r.rating,
            "added_at": r.added_at.strftime("%Y.%m.%d") if r.added_at else "",
            "likes_count": likes_count,
            "is_liked": is_liked,
            "type": "short_review",
            "is_following": is_following,
            "is_spoiler": getattr(r, 'is_spoiler', False),
            "is_mine": is_mine # ▼▼▼ [NEW] 프론트엔드로 본인 글 여부 전달
        })

    return feeds

# ===================================================================
# [NEW] 소셜 광장 (Square / Feed) API - Phase 1 (공감, 위시리스트) 적용
# ===================================================================

@app.get("/api/square/feeds")
async def get_square_feeds(user_email: Optional[str] = None, feed_type: str = "all", limit: int = 30, db: Session = Depends(get_db)):
    """
    공개 처리된 모든 유저의 기록을 가져오고, '좋아요 갯수'와 '내가 좋아요를 눌렀는지'를 판별합니다.
    """
    # 현재 접속 중인 유저 확인 (로그인한 경우)
    current_user_id = None
    if user_email:
        user = db.query(models.User).filter(models.User.email == user_email).first()
        if user:
            current_user_id = user.id

    query = db.query(models.Record).options(
        joinedload(models.Record.user),
        joinedload(models.Record.edition).joinedload(models.Edition.work)
    )

    query = query.filter(
        or_(
            models.Record.short_review != None,
            models.Record.short_review != "",
        )
    ).filter(models.Record.is_short_review_public == True)

    records = query.order_by(models.Record.added_at.desc()).limit(limit).all()

    feeds = []
    for r in records:
        if not r.edition or not r.user:
            continue
            
        # [핵심] 1. 이 글의 총 좋아요 수 계산
        likes_count = db.query(models.RecordLike).filter(models.RecordLike.record_id == r.id).count()
        
        # [핵심] 2. 현재 로그인한 내가 좋아요를 눌렀는지 판별
        is_liked = False
        if current_user_id:
            like_exists = db.query(models.RecordLike).filter(
                models.RecordLike.record_id == r.id, 
                models.RecordLike.user_id == current_user_id
            ).first()
            if like_exists:
                is_liked = True

        feeds.append({
            "id": r.id,
            "edition_id": r.edition.id, # ▼ 내 서재 담기(Wishlist)를 위해 추가
            "isbn": r.edition.isbn,     # ▼ 내 서재 담기(Wishlist)를 위해 추가
            "user_name": r.user.nickname or r.user.email.split('@')[0],
            "user_image": r.user.profile_image or "",
            "book_title": r.edition.work.title if r.edition.work else "제목 없음",
            "book_author": r.edition.work.author if r.edition.work else "작가 미상",
            "cover": r.edition.cover_image,
            "text": r.short_review, 
            "rating": r.rating,
            "added_at": r.added_at.strftime("%Y.%m.%d") if r.added_at else "",
            
            # ▼ 좋아요 데이터 연동
            "likes_count": likes_count,
            "is_liked": is_liked,
            "type": "short_review"
        })

    return feeds

# ===================================================================
# [NEW] 소셜 광장 - 작품(Work) 탭 인기 도서 큐레이션 API
# ===================================================================
from sqlalchemy import func, desc
# (상단에 func, desc가 이미 import 되어 있다면 이 줄은 무시하셔도 됩니다)

@app.get("/api/square/works")
async def get_trending_works(db: Session = Depends(get_db)):
    """
    BoooknTalk 유저들의 서재에 담긴 판본들을 작품 단위로 통합합니다.
    (PostgreSQL 전용 array_agg를 사용해 표지 이미지 배열을 생성합니다.)
    """
    stats = db.query(
        models.Edition.work_id,
        func.count(models.Record.id).label('added_count'),
        func.avg(models.Record.rating).label('avg_rating'),
        # ▼▼▼ [핵심] PostgreSQL 전용! 이 작품에 속한 모든 판본의 표지를 배열로 수집 ▼▼▼
        func.array_agg(models.Edition.cover_image).label('raw_covers'), 
        func.max(models.Edition.id).label('rep_edition_id'),
        func.max(models.Edition.isbn).label('rep_isbn')
    ).join(models.Record, models.Edition.id == models.Record.edition_id)\
     .group_by(models.Edition.work_id).subquery()

    query = db.query(
        models.Work, 
        stats.c.added_count, 
        stats.c.avg_rating, 
        stats.c.raw_covers, 
        stats.c.rep_edition_id, 
        stats.c.rep_isbn
    ).join(stats, models.Work.id == stats.c.work_id)\
     .order_by(desc(stats.c.added_count))

    results = query.all()
    
    response_data = []
    for work, added_count, avg_rating, raw_covers, rep_edition_id, rep_isbn in results:
        # 파이썬에서 중복 표지 및 빈 값(None) 제거 후 최대 4장까지만 추출
        unique_covers = list(set([c for c in raw_covers if c]))[:4]
        best_cover = unique_covers[0] if unique_covers else None

        response_data.append({
            "work_id": work.id,
            "edition_id": rep_edition_id,
            "isbn": rep_isbn,
            "title": work.title,
            "author": work.author,
            "cover": best_cover,         # 하위 호환성 유지
            "covers": unique_covers,     # ▼▼▼ 프론트엔드 콜라주용 배열 데이터! ▼▼▼
            "added_count": added_count,
            "average_rating": round(avg_rating, 1) if avg_rating else 0.0
        })

    return response_data

class LikeToggleRequest(BaseModel):
    user_email: str
    feed_type: str = "short_review"

@app.post("/api/square/feeds/{feed_id}/like")
async def toggle_square_like(feed_id: int, req: LikeToggleRequest, db: Session = Depends(get_db)):
    """광장 피드 공감(하트) 토글 API"""
    user = db.query(models.User).filter(models.User.email == req.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    if req.feed_type == "short_review":
        existing_like = db.query(models.RecordLike).filter_by(user_id=user.id, record_id=feed_id).first()
        if existing_like:
            db.delete(existing_like)
            is_liked = False
        else:
            db.add(models.RecordLike(user_id=user.id, record_id=feed_id))
            is_liked = True
            
        db.commit()
        return {"status": "success", "is_liked": is_liked}
    
    raise HTTPException(status_code=400, detail="알 수 없는 피드 타입입니다.")

class QuickWishRequest(BaseModel):
    user_email: str
    edition_id: int

@app.post("/api/library/wishlist/quick")
async def quick_add_wishlist(req: QuickWishRequest, db: Session = Depends(get_db)):
    """광장에서 클릭 한 번으로 내 서재(WISH)에 담는 API"""
    user = db.query(models.User).filter(models.User.email == req.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    existing_record = db.query(models.Record).filter_by(user_id=user.id, edition_id=req.edition_id).first()
    if existing_record:
        return {"status": "exists", "message": "이미 회원님의 서재에 담긴 책입니다."}

    new_record = models.Record(
        user_id=user.id, 
        edition_id=req.edition_id, 
        status="WISH", 
        rating=0.0
    )
    db.add(new_record)
    db.commit()
    return {"status": "success", "message": "성공적으로 내 서재에 담았습니다!"}

# ▼▼▼ [NEW] 팔로우 토글 API 추가 ▼▼▼
class FollowToggleRequest(BaseModel):
    user_email: str

@app.post("/api/users/{target_user_id}/follow")
async def toggle_follow(
    target_user_id: int, 
    req: FollowToggleRequest, 
    db: Session = Depends(get_db)
):
    """
    [소셜 코어 API] 특정 유저 팔로우 맺기/끊기 (카운트 동기화 포함)
    """
    # 1. 내 정보 조회 (팔로우를 누른 사람)
    current_user = db.query(models.User).filter(models.User.email == req.user_email).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        
    # 2. 자기 자신 팔로우 방지
    if current_user.id == target_user_id:
        raise HTTPException(status_code=400, detail="자기 자신을 팔로우할 수 없습니다.")

    # 3. 타겟 유저 조회 (팔로우 당하는 사람)
    target_user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="팔로우할 대상 유저를 찾을 수 없습니다.")

    # 4. 교차 테이블(Follow)에서 기존 팔로우 여부 명시적 확인
    existing_follow = db.query(models.Follow).filter_by(
        follower_id=current_user.id, 
        following_id=target_user_id
    ).first()

    if existing_follow:
        # [언팔로우 처리]
        db.delete(existing_follow)
        
        # 카운트 감소 로직 (음수 방지 안전장치 포함)
        current_user.following_count = max(0, (current_user.following_count or 0) - 1)
        target_user.follower_count = max(0, (target_user.follower_count or 0) - 1)
        
        is_following = False
    else:
        # [팔로우 처리]
        new_follow = models.Follow(follower_id=current_user.id, following_id=target_user_id)
        db.add(new_follow)
        
        # 카운트 증가 로직
        current_user.following_count = (current_user.following_count or 0) + 1
        target_user.follower_count = (target_user.follower_count or 0) + 1
        
        is_following = True
        
    # DB에 최종 반영
    db.commit()
    
    # 프론트엔드 <FollowButton />이 기대하는 리턴 규격
    return {
        "status": "success", 
        "is_following": is_following,
        "follower_count": target_user.follower_count
    }

@app.get("/api/works/{work_id}")
async def get_work_hub_detail(work_id: int, db: Session = Depends(get_db)):
    """
    [작품 허브] 특정 Work의 통합 정보 및 소셜 통계를 조회합니다.
    """
    # 1. 작품(Work) 기본 정보 조회
    work = db.query(models.Work).filter(models.Work.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="작품을 찾을 수 없습니다.")

    # 2. 이 작품에 속한 모든 Edition ID 추출
    editions = db.query(models.Edition).filter(models.Edition.work_id == work_id).all()
    edition_ids = [e.id for e in editions]

    total_added = 0
    avg_rating = 0.0
    best_cover = None

    if edition_ids:
        # 3. 통합 통계 (총 담긴 횟수, 평균 별점)
        # Record 테이블에서 edition_id가 해당 작품의 판본들인 것만 필터링
        stats = db.query(
            func.count(models.Record.id).label('total_added'),
            func.avg(models.Record.rating).label('avg_rating')
        ).filter(models.Record.edition_id.in_(edition_ids)).first()
        
        total_added = stats.total_added if stats and stats.total_added else 0
        avg_rating = round(stats.avg_rating, 1) if stats and stats.avg_rating else 0.0

        # 4. 대표 커버 이미지 찾기 (가장 많이 서재에 담긴 판본의 표지)
        popular_edition_stat = db.query(
            models.Record.edition_id,
            func.count(models.Record.id).label('cnt')
        ).filter(models.Record.edition_id.in_(edition_ids))\
        .group_by(models.Record.edition_id)\
        .order_by(desc('cnt')).first()

        if popular_edition_stat:
            popular_edition = db.query(models.Edition).filter(models.Edition.id == popular_edition_stat.edition_id).first()
            best_cover = popular_edition.cover_image if popular_edition else None
            
        # 서재에 담긴 기록이 하나도 없다면, 그냥 첫 번째 판본의 표지를 사용
        if not best_cover and editions:
            best_cover = editions[0].cover_image

    return {
        "work_id": work.id,
        "title": work.title,
        "author": work.author,
        "description": work.description,
        "category": work.category,
        "original_title": work.original_title,
        "best_cover": best_cover,
        "total_added": total_added,
        "average_rating": avg_rating,
        "edition_count": len(editions) # 이 작품에 엮인 판본(출판사/개정판)의 총 개수
    }

@app.get("/api/works/{work_id}/editions")
async def get_work_editions(work_id: int, db: Session = Depends(get_db)):
    """
    특정 작품(Work)에 속한 모든 판본(Edition) 목록을 조회합니다.
    """
    editions = db.query(models.Edition).filter(models.Edition.work_id == work_id).order_by(models.Edition.publish_date.desc()).all()
    
    if not editions:
        return []

    results = []
    for ed in editions:
        results.append({
            "edition_id": ed.id,
            "isbn": ed.isbn,
            "publisher": ed.publisher,
            "publish_date": ed.publish_date.isoformat() if ed.publish_date else None,
            "cover_image": ed.cover_image,
            "page_count": ed.page_count
        })
    return results

@app.get("/api/library/{user_id}/reviews/{review_id}")
async def get_long_review_detail(user_id: int, review_id: int, db: Session = Depends(get_db)):
    """
    특정 유저의 서재에 있는 특정 긴줄평(서평)의 전체 내용을 조회합니다.
    """
    review = db.query(models.LongReview)\
        .join(models.Record)\
        .options(
            joinedload(models.LongReview.record).joinedload(models.Record.user),
            joinedload(models.LongReview.record).joinedload(models.Record.edition).joinedload(models.Edition.work)
        )\
        .filter(
            models.LongReview.id == review_id,
            models.Record.user_id == user_id,
            models.LongReview.is_draft == False # 발행된 글만
        ).first()

    if not review:
        raise HTTPException(status_code=404, detail="서평을 찾을 수 없거나 삭제된 글입니다.")

    record = review.record
    user = record.user
    edition = record.edition
    work = edition.work if edition else None

    return {
        "id": review.id,
        "title": review.title,
        "content": review.content, # 150자 자르지 않은 순수 원본 (HTML 포함)
        "created_at": review.created_at.isoformat() if review.created_at else "",
        "rating": record.rating,
        "author": {
            "id": user.id,
            "nickname": user.nickname or user.email.split('@')[0],
            "profile_image": user.profile_image or ""
        },
        "book": {
            "work_id": work.id if work else None,
            "title": work.title if work else "제목 없음",
            "author": work.author if work else "작가 미상",
            "cover": edition.cover_image
        }
    }
    
@app.get("/api/reviews/{review_id}")
async def get_long_review_detail_direct(review_id: int, db: Session = Depends(get_db)):
    """특정 긴줄평(서평)의 전체 내용을 독립적으로 조회합니다."""
    review = db.query(models.LongReview)\
        .join(models.Record)\
        .options(
            joinedload(models.LongReview.record).joinedload(models.Record.user),
            joinedload(models.LongReview.record).joinedload(models.Record.edition).joinedload(models.Edition.work)
        )\
        .filter(
            models.LongReview.id == review_id, # user_id 조건 삭제 (review_id 만으로 충분함)
            models.LongReview.is_draft == False
        ).first()

    if not review:
        raise HTTPException(status_code=404, detail="서평을 찾을 수 없거나 삭제된 글입니다.")

    record = review.record
    user = record.user
    edition = record.edition
    work = edition.work if edition else None

    return {
        "id": review.id,
        "title": review.title,
        "content": review.content,
        "created_at": review.created_at.isoformat() if review.created_at else "",
        "rating": record.rating,
        "author": {
            "id": user.id,
            "nickname": user.nickname or user.email.split('@')[0],
            "profile_image": user.profile_image or ""
        },
        "book": {
            "work_id": work.id if work else None,
            "title": work.title if work else "제목 없음",
            "author": work.author if work else "작가 미상",
            "cover": edition.cover_image
        }
    }

@app.get("/api/admin/sync-authors")
async def sync_existing_authors(db: Session = Depends(get_db)):
    """
    [관리자 전용] 기존 DB에 저장된 모든 Work의 author 문자열을 
    새로 업그레이드된 parse_author_string 엔진으로 다시 분석하여
    Contributor 및 WorkContributor 테이블을 완벽하게 재정립합니다.
    """
    works = db.query(models.Work).all()
    updated_count = 0

    for work in works:
        if not work.author:
            continue

        # 1. 기존에 연결된 낡은 참여자 연결 고리(WorkContributor)를 모두 끊습니다.
        db.query(models.WorkContributor).filter(models.WorkContributor.work_id == work.id).delete()
        
        # 2. 업그레이드된 새 엔진으로 원본 문자열을 다시 정교하게 파싱합니다.
        parsed_authors = parse_author_string(work.author)
        
        # 3. 새로운 규칙에 맞게 DB에 다시 예쁘게 관계를 맺어줍니다.
        for p_auth in parsed_authors:
            # 해당 이름의 참여자가 DB에 있는지 확인 (없으면 새로 생성)
            contributor = db.query(models.Contributor).filter(models.Contributor.name == p_auth['name']).first()
            if not contributor:
                contributor = models.Contributor(name=p_auth['name'])
                db.add(contributor)
                db.flush() # ID를 즉시 발급받기 위해 flush

            # 작품과 참여자를 새로운 역할(role)로 연결
            link = models.WorkContributor(
                work_id=work.id, 
                contributor_id=contributor.id, 
                role=p_auth['role']
            )
            db.add(link)

        updated_count += 1

    # 4. 모든 작업이 성공하면 최종 커밋!
    try:
        db.commit()
        return {
            "status": "success", 
            "message": f"총 {updated_count}개 작품의 참여자 데이터가 새 규칙에 맞게 완벽히 정제되었습니다!"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"데이터 정제 중 오류 발생: {str(e)}")
    
@app.get("/api/admin/cleanup-contributors")
async def cleanup_orphaned_contributors(db: Session = Depends(get_db)):
    """
    [관리자 전용] 어떤 작품(Work)과도 연결되지 않은 찌꺼기(고아) 참여자 데이터를
    contributors 테이블에서 영구적으로 일괄 삭제합니다.
    """
    # 1. 현재 작품과 정상적으로 연결된 참여자들의 ID 목록을 뽑아냅니다.
    active_contributor_ids = db.query(models.WorkContributor.contributor_id).distinct()
    
    # 2. 이 연결된 ID 목록에 포함되지 않는(not_in) 고아 참여자들을 찾아 전부 삭제합니다.
    deleted_count = db.query(models.Contributor).filter(
        models.Contributor.id.not_in(active_contributor_ids)
    ).delete(synchronize_session=False)
    
    # 3. 데이터베이스에 삭제를 최종 확정합니다.
    try:
        db.commit()
        return {
            "status": "success", 
            "message": f"대청소 완료! 총 {deleted_count}개의 찌꺼기 참여자 데이터가 영구 삭제되었습니다."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"데이터 청소 중 오류 발생: {str(e)}")