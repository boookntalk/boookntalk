from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional
import httpx
import asyncio
import uuid
import os
import sys
from dotenv import load_dotenv

# ==========================================
# [핵심] 경로 문제 해결 코드 (이걸로 교체하세요!)
# ==========================================
# 현재 파일(main.py)이 있는 위치를 시스템 경로에 강제로 추가합니다.
# 이렇게 하면 'import database'라고만 써도 무조건 같은 폴더에서 찾습니다.
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# 이제 점(.)이나 backend. 없이 편하게 import 하세요
from database import engine, Base, get_db
import models

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

# -------------------------------------------------------------------
# [3] 앱 수명주기 및 미들웨어 (Lifespan & Middleware)
# -------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 개발 초기 단계에서 DB 스키마 변경이 잦을 때 사용 (주의: 데이터 삭제됨)
    # models.Base.metadata.drop_all(bind=engine)
    # models.Base.metadata.create_all(bind=engine)
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

# -------------------------------------------------------------------
# [5] 도서 검색 API (External Search API)
# -------------------------------------------------------------------

@app.get("/api/books/search/{isbn}")
async def search_external_books(isbn: str, extra: Optional[str] = None):
    """
    알라딘 + 구글 북스 API 병렬 검색 및 고화질 표지 추출
    """
    if not ALADIN_TTB_KEY or not GOOGLE_BOOKS_API_KEY:
        print("Error: API Keys missing.")
    
    async with httpx.AsyncClient() as client:
        aladin_url = f"http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey={ALADIN_TTB_KEY}&itemIdType=ISBN13&ItemId={isbn}&output=js&Version=20131101&OptResult=itemPage,fullSentence,originalTitle"
        google_url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&key={GOOGLE_BOOKS_API_KEY}"

        try:
            responses = await asyncio.gather(
                client.get(aladin_url, timeout=5.0), 
                client.get(google_url, timeout=5.0),
                return_exceptions=True
            )
        except Exception:
            raise HTTPException(status_code=503, detail="외부 도서 서비스 연결 실패")
        
        # 응답 처리
        aladin_res = responses[0] if not isinstance(responses[0], Exception) else None
        google_res = responses[1] if not isinstance(responses[1], Exception) else None

        aladin_data = aladin_res.json() if aladin_res and aladin_res.status_code == 200 else {}
        google_data = google_res.json() if google_res and google_res.status_code == 200 else {}

        aladin_item = aladin_data.get('item', [{}])[0] if aladin_data.get('item') else {}
        google_items = google_data.get('items', [])
        google_info = google_items[0].get('volumeInfo', {}) if google_items else {}

        # 제목 확인 (필수)
        title = google_info.get('title') or aladin_item.get('title')
        if not title:
            raise HTTPException(status_code=404, detail="도서 정보를 찾을 수 없습니다.")

        # 저자
        google_authors = google_info.get('authors')
        author = ", ".join(google_authors) if google_authors else aladin_item.get('author', "저자 미상")

        # 고해상도 표지 로직
        image_links = google_info.get('imageLinks', {})
        google_cover = (
            image_links.get('extraLarge') or 
            image_links.get('large') or 
            image_links.get('medium') or 
            image_links.get('small') or 
            image_links.get('thumbnail')
        )
        
        if google_cover:
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
            "isbn": isbn
        }

# -------------------------------------------------------------------
# [6] 서재 관리 API (Library Management)
# -------------------------------------------------------------------

@app.post("/api/books/register")
async def finalize_book_registration(book_info: dict, db: Session = Depends(get_db)):
    """
    도서 및 판본 정보를 DB에 저장하고 내 서재(Record)에 추가
    """
    try:
        # 1. 유저 확인
        user_email = book_info.get('user_email') 
        user = db.query(models.User).filter(models.User.email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user.id

        # 2. ISBN 처리
        final_isbn = book_info.get('isbn') 
        if not final_isbn:
            final_isbn = f"BNT-{uuid.uuid4().hex[:8].upper()}"
        
        # 3. Work (작품) 생성
        work = db.query(models.Work).filter(
            models.Work.title == book_info.get('title'),
            models.Work.author == book_info.get('author')
        ).first()

        if not work:
            work = models.Work(
                title=book_info.get('title'),
                author=book_info.get('author'),
                description=book_info.get('description'),
                category=book_info.get('categoryName')
                # original_title 제거됨
            )
            db.add(work)
            db.flush()

        # 4. Edition (판본) 생성
        edition = db.query(models.Edition).filter(models.Edition.isbn == final_isbn).first()
        if not edition:
            edition = models.Edition(
                isbn=final_isbn,
                work_id=work.id,
                publisher=book_info.get('publisher'),
                cover_image=book_info.get('cover'),
                page_count=book_info.get('pageCount'),
                is_bnt_isbn=(not book_info.get('isbn'))
            )
            db.add(edition)
            db.flush()

        # 5. Record (서재) 등록
        existing_record = db.query(models.Record).filter(
            models.Record.user_id == user_id,
            models.Record.edition_id == edition.id
        ).first()

        if not existing_record:
            new_record = models.Record(
                user_id=user_id,
                edition_id=edition.id,
                status="READING"
            )
            db.add(new_record)
        
        db.commit()
        return {"status": "success", "isbn": final_isbn}

    except Exception as e:
        db.rollback()
        print(f"Registration Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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