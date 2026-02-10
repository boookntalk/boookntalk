from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from database import engine, Base, get_db
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from utils import parse_author_string
from sqlalchemy import or_

import models
import httpx
import asyncio
import uuid
import os
import sys
import time
import random
from dotenv import load_dotenv

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
    addon_code: Optional[str] = None  # [NEW] 5자리 부가기호 필드 추가!
    
    cover: str
    pageCount: int
    categoryName: Optional[str] = None
    originalTitle: Optional[str] = None
    itemPage: Optional[int] = None

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

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    db_user.nickname = user_data.nickname
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

@app.get("/api/books/search/{isbn}")
async def search_external_books(isbn: str, extra: Optional[str] = None):
    """
    알라딘 + 구글 북스 API 병렬 검색
    [수정 사항] 
    1. ISBN 13/10 우선순위 로직 적용 (13 > 10 > Input)
    2. 두 API 결과를 교차하여 누락된 ISBN 정보 보완
    """
    if not ALADIN_TTB_KEY or not GOOGLE_BOOKS_API_KEY:
        print("Error: API Keys missing.")
    
    async with httpx.AsyncClient() as client:
        # itemIdType=ISBN으로 설정하여 10/13자리 모두 유연하게 검색
        aladin_url = f"http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey={ALADIN_TTB_KEY}&itemIdType=ISBN&ItemId={isbn}&output=js&Version=20131101&OptResult=itemPage,fullSentence,originalTitle"
        google_url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&key={GOOGLE_BOOKS_API_KEY}"

        try:
            responses = await asyncio.gather(
                client.get(aladin_url, timeout=5.0), 
                client.get(google_url, timeout=5.0),
                return_exceptions=True
            )
        except Exception:
            raise HTTPException(status_code=503, detail="외부 도서 서비스 연결 실패")
        
        # 1. API 응답 기본 처리
        aladin_res = responses[0] if not isinstance(responses[0], Exception) else None
        google_res = responses[1] if not isinstance(responses[1], Exception) else None

        aladin_data = aladin_res.json() if aladin_res and aladin_res.status_code == 200 else {}
        google_data = google_res.json() if google_res and google_res.status_code == 200 else {}

        aladin_item = aladin_data.get('item', [{}])[0] if aladin_data.get('item') else {}
        google_items = google_data.get('items', [])
        google_info = google_items[0].get('volumeInfo', {}) if google_items else {}

        # 2. 제목 확인 (검색 실패 여부 판단)
        title = google_info.get('title') or aladin_item.get('title')
        if not title:
            raise HTTPException(status_code=404, detail="도서 정보를 찾을 수 없습니다.")

        # =========================================================
        # [핵심 로직] ISBN 13자리 및 10자리 정밀 추출
        # =========================================================
        found_isbn13 = None
        found_isbn10 = None

        # (1) Google Books에서 추출
        if google_info:
            identifiers = google_info.get('industryIdentifiers', [])
            for ident in identifiers:
                if ident['type'] == 'ISBN_13':
                    found_isbn13 = ident['identifier']
                elif ident['type'] == 'ISBN_10':
                    found_isbn10 = ident['identifier']
        
        # (2) Aladin에서 보완 (구글에 없는 경우 채워넣기)
        if aladin_item:
            # 13자리가 아직 없다면 알라딘 확인
            if not found_isbn13:
                found_isbn13 = aladin_item.get('isbn13')
            
            # 10자리가 아직 없다면 알라딘 확인
            if not found_isbn10:
                raw_isbn = aladin_item.get('isbn') # 알라딘 'isbn' 필드는 10자리일 수도, 13자리일 수도 있음
                if raw_isbn and len(raw_isbn) == 10:
                    found_isbn10 = raw_isbn
                # 만약 알라딘 isbn 필드에 13자리가 있고, found_isbn13이 비어있다면 채움 (안전장치)
                elif raw_isbn and len(raw_isbn) == 13 and not found_isbn13:
                    found_isbn13 = raw_isbn

        # (3) 최종 반환값 결정 (요건: 13 > 10 > Input)
        final_main_isbn = found_isbn13 if found_isbn13 else (found_isbn10 if found_isbn10 else isbn)
        final_sub_isbn = found_isbn10  # 없으면 None

        # =========================================================
        # 기존 메타데이터 로직 (저자, 표지 등) 유지
        # =========================================================
        google_authors = google_info.get('authors')
        author = ", ".join(google_authors) if google_authors else aladin_item.get('author', "저자 미상")

        # 고화질 표지 우선순위 (Google ExtraLarge -> ... -> Aladin)
        image_links = google_info.get('imageLinks', {})
        google_cover = (
            image_links.get('extraLarge') or 
            image_links.get('large') or 
            image_links.get('medium') or 
            image_links.get('small') or 
            image_links.get('thumbnail')
        )
        
        if google_cover:
            # Google 표지 품질 개선 옵션
            final_cover = google_cover.replace("&zoom=1", "&zoom=0").replace("&edge=curl", "").replace("http://", "https://")
        else:
            final_cover = aladin_item.get('cover', "")

        return {
            "title": title,
            "author": author,
            "publisher": google_info.get('publisher') or aladin_item.get('publisher') or "출판사 미상",
            "pubDate": google_info.get('publishedDate') or aladin_item.get('pubDate') or "",
            "categoryName": aladin_item.get('categoryName') or "미분류",
            "cover": final_cover,
            "description": google_info.get('description') or aladin_item.get('description') or "",
            "pageCount": google_info.get('pageCount') or aladin_item.get('subInfo', {}).get('itemPage') or 0,
            "originalTitle": aladin_item.get('subInfo', {}).get('originalTitle') or "",
            "previewLink": google_info.get('previewLink') or "",
            
            # [결과] 계산된 ISBN 반환
            "isbn": final_main_isbn,  # 대표 ISBN
            "isbn10": final_sub_isbn  # 보조 ISBN (없으면 null/None)
        }

# -------------------------------------------------------------------
# [6] 서재 관리 API (Library Management)
# -------------------------------------------------------------------

@app.post("/api/books")
async def register_book(request: RegisterBookRequest, db: Session = Depends(get_db)):
    # 1. 사용자 조회 (기존 코드 유지)
    user = db.query(models.User).filter(models.User.email == request.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    # 2. ISBN 처리 (기존 코드 유지)
    final_isbn = request.isbn.strip()
    is_bnt_generated = False
    if not final_isbn:
        final_isbn = generate_btk_isbn()
        is_bnt_generated = True

    # ---------------------------------------------------------
    # [3. Work (작품) 확인 및 생성 - 여기가 핵심 변경 구간!]
    # ---------------------------------------------------------
    work = db.query(models.Work).filter(
        models.Work.title == request.title, 
        models.Work.author == request.author
    ).first()

    if not work:
        # 3-1. Work가 없으면 새로 생성
        work = models.Work(
            title=request.title, 
            author=request.author, # 원본 문자열도 검색용으로 저장
            description=request.description,
            category=request.categoryName
        )
        db.add(work)
        db.commit()
        db.refresh(work)
        
        # 3-2. [✨ 작가 정보 파싱 및 저장 로직 시작]
        try:
            # utils.py의 함수로 문자열을 쪼갬
            parsed_authors = parse_author_string(request.author)
            
            for p_auth in parsed_authors:
                # A. 해당 작가가 이미 DB에 있는지 이름으로 확인
                contributor = db.query(models.Contributor).filter(
                    models.Contributor.name == p_auth['name']
                ).first()
                
                # B. 없으면 새로 등록
                if not contributor:
                    contributor = models.Contributor(name=p_auth['name'])
                    db.add(contributor)
                    db.commit()
                    db.refresh(contributor)
                
                # C. 작품-작가 연결 (중복 연결 방지)
                # "해리포터" 작품에 "J.K. 롤링"이 "Author"로 이미 연결되어 있는지 확인
                link_exists = db.query(models.WorkContributor).filter(
                    models.WorkContributor.work_id == work.id,
                    models.WorkContributor.contributor_id == contributor.id,
                    models.WorkContributor.role == p_auth['role']
                ).first()
                
                # D. 연결이 안 되어 있다면 연결 데이터(WorkContributor) 생성
                if not link_exists:
                    link = models.WorkContributor(
                        work_id=work.id,
                        contributor_id=contributor.id,
                        role=p_auth['role']
                    )
                    db.add(link)
                    db.commit()
                    
        except Exception as e:
            # 작가 정보 저장하다 에러가 나도, 책 등록 자체는 멈추지 않도록 처리
            print(f"⚠️ 작가 정보 저장 중 오류 발생 (무시됨): {e}")

    # ---------------------------------------------------------
    # [4. Edition (판본) 생성] (기존 로직 + addon_code 반영)
    # ---------------------------------------------------------
    edition = db.query(models.Edition).filter(models.Edition.isbn == final_isbn).first()

    if not edition:
        edition = models.Edition(
            isbn=final_isbn,           
            isbn10=request.isbn10,
            addon_code=request.addon_code, # 5자리 부가기호
            work_id=work.id,           
            publisher=request.publisher,
            cover_image=request.cover, 
            page_count=request.pageCount,
            is_bnt_isbn=is_bnt_generated 
        )
        db.add(edition)
        db.commit()
        db.refresh(edition)
    else:
        # 기존 책 업데이트 로직 (부가기호 등 누락된 정보 채우기)
        updated = False
        if request.addon_code and not edition.addon_code:
            edition.addon_code = request.addon_code
            updated = True
        if request.isbn10 and not edition.isbn10:
            edition.isbn10 = request.isbn10
            updated = True
        
        if updated:
            db.commit()

    # ---------------------------------------------------------
    # [5. Record (서재) 생성] (기존 로직 유지)
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

    # Record 테이블 조회 (최신순 정렬 등을 원하면 .order_by 추가 가능)
    records = db.query(models.Record).filter(models.Record.user_id == user.id).all()
    
    results = []
    for record in records:
        edition = record.edition
        work = edition.work
        
        # 데이터가 없을 때를 대비한 안전한 처리
        rating_val = record.rating if record.rating is not None else 0.0
        
        results.append({
            "library_id": record.id,
            "status": record.status,
            "added_at": record.added_at,
            "title": work.title,
            "author": work.author,
            "cover": edition.cover_image,
            "rating": rating_val,
            "short_review": record.short_review or "",
            "start_date": record.start_date,
            "finish_date": record.finish_date
        })
    return results

@app.patch("/api/my-library/{library_id}")
async def update_library_entry(library_id: int, update_data: LibraryUpdate, db: Session = Depends(get_db)):
    """
    서재 기록 수정 (상태, 별점, 코멘트 등)
    """
    record = db.query(models.Record).filter(models.Record.id == library_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")

    # None이 아닌 값만 업데이트
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(record, key, value)

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
    status: str = "ALL",  # 기본값은 전체
    db: Session = Depends(get_db)
):
    
    # ▼▼▼ [감시 코드 추가] 서버 터미널에서 확인하세요! ▼▼▼
    print(f"\n[API 호출] 이메일: {user_email}, 요청된 상태: {status}")
    # ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
 
    # 1. 사용자 찾기
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. 기본 쿼리 생성 (이 사용자의 기록만 가져오기)
    query = db.query(models.Record).filter(models.Record.user_id == user.id)

    # 3. 상태(status)에 따른 필터링 로직 분기
    if status == "ALL":
        print(">> 필터링: 전체 보기 (ALL)") # 로그 추가
        pass
    elif status == "REVIEW":
        print(">> 필터링: 리뷰 있는 책만") # 로그 추가
        query = query.filter(models.Record.short_review != None, models.Record.short_review != "")
    else:
        # [나머지 탭] READING, COMPLETED, STOPPED 등
        # 클라이언트에서 보낸 status 값과 DB의 status 컬럼이 정확히 일치하는 것만
        print(f">> 필터링: 상태값 ({status}) 검색") # 로그 추가
        query = query.filter(models.Record.status == status)

    records = query.order_by(models.Record.added_at.desc()).all()
    print(f">> 검색된 책 개수: {len(records)}권\n") # 로그 추가

    # 4. 최신순(등록순) 정렬 후 DB에서 실행 (.all())
    records = query.order_by(models.Record.added_at.desc()).all()
    
    # ---------------------------------------------------------
    # [5. 데이터 가공 단계]
    # DB 객체(Record)를 프론트엔드가 쓰기 편한 JSON(Dictionary) 형태로 변환
    # ---------------------------------------------------------
    response_data = []
    
    for record in records:
        # 만약 연결된 책 정보(edition)가 없으면 건너뜀 (데이터 무결성 보호)
        if not record.edition:
            continue
            
        # Work(작품) 정보 안전하게 가져오기 (없으면 기본값)
        work_title = record.edition.work.title if record.edition.work else "제목 없음"
        work_author = record.edition.work.author if record.edition.work else "작가 미상"

        # 프론트엔드로 보낼 최종 데이터 조립
        book_info = {
            "library_id": record.id,       # 내 서재에서의 고유 ID (삭제/수정 시 필요)
            "id": record.edition.id,       # 책(판본)의 ID
            "title": work_title,
            "author": work_author,
            "cover": record.edition.cover_image,
            "status": record.status,
            "rating": record.rating,
            "short_review": record.short_review,
            "added_at": record.added_at,
            
            # ▼▼▼ [핵심] ISBN 정보 포함 (이제 화면에 나옵니다!) ▼▼▼
            "isbn": record.edition.isbn,      # ISBN 13
            "isbn10": record.edition.isbn10   # ISBN 10
        }
        
        response_data.append(book_info)

    # 6. 가공된 데이터 반환
    return response_data