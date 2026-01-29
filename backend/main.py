from fastapi import FastAPI, Depends, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional
from database import SessionLocal, engine, Base
from datetime import datetime

import database, models
import os
import httpx
import asyncio

from dotenv import load_dotenv

import uuid

load_dotenv()

# DB 테이블 생성
#models.Base.metadata.create_all(bind=engine)

# [중요] 테이블 삭제 및 재생성 로직
# def setup_database():
#     print("기존 테이블 삭제 중...")
#     # 테이블 간의 외래 키(FK) 관계 때문에 삭제 순서가 중요할 수 있지만, 
#     # 아래 명령은 모든 연결된 테이블을 한 번에 처리합니다.
#     Base.metadata.drop_all(bind=engine)
    
#     print("새로운 테이블 생성 중 (is_premium, Work/Edition 구조 반영)...")
#     Base.metadata.create_all(bind=engine)
#     print("데이터베이스 세팅 완료!")

# 1. 프론트엔드에서 보낼 데이터 규격 (Schema) 정의
class UserSyncRequest(BaseModel):
    email: str
    nickname: Optional[str] = None
    profile_image: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- DB 초기화 프로세스 시작 ---")
    # 1. Base에 등록된 모든 테이블을 일단 삭제
    #Base.metadata.drop_all(bind=engine)
    
    # 2. Base에 등록된 모든 테이블을 새로 생성
    # 이 시점에 models.py의 Work, Edition 클래스가 메모리에 올라와 있어야 합니다.
    #Base.metadata.create_all(bind=engine)
    print("--- DB 초기화 프로세스 완료! ---")
    yield

app = FastAPI(lifespan=lifespan)

ALADIN_TTB_KEY = os.getenv("ALADIN_TTB_KEY")
GOOGLE_BOOKS_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY")
        
@app.get("/api/books/search/{isbn}")
async def search_external_books(isbn: str, extra: Optional[str] = None):
    # isbn 변수에 9788937460470이 자동으로 담깁니다.
    # extra 변수에는 query parameter인 ""(빈값)이 담깁니다.

    async with httpx.AsyncClient() as client:
        # 알라딘: 페이지 수 및 상세 정보용
        aladin_url = f"http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey={ALADIN_TTB_KEY}&itemIdType=ISBN13&ItemId={isbn}&output=js&Version=20131101&OptResult=itemPage,fullSentence,originalTitle"
        # 구글: 미리보기 링크용
        google_url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&key={GOOGLE_BOOKS_API_KEY}"

        # 병렬 호출로 속도 최적화
        responses = await asyncio.gather(client.get(aladin_url), client.get(google_url))
        item = responses[0].json().get('item', [{}])[0]
        google_info = responses[1].json().get('items', [{}])[0].get('volumeInfo', {})

        aladin_res = responses[0].json()
        google_res = responses[1].json()

        if not aladin_res.get('item'):
            raise HTTPException(status_code=404, detail="도서 정보를 찾을 수 없습니다.")

        item = aladin_res['item'][0]
        google_info = google_res.get('items', [{}])[0].get('volumeInfo', {})

        # boookntalk 통합 데이터 객체 (프론트엔드로 전달)
        return {
            "title": item.get('title'),
            "author": item.get('author'),
            "publisher": item.get('publisher'),
            "pubDate": item.get('pubDate'),
            "categoryName": item.get('categoryName'),
            "cover": item.get('cover'),
            "description": item.get('description'),
            "pageCount": item.get('subInfo', {}).get('itemPage'),
            "originalTitle": item.get('subInfo', {}).get('originalTitle'),
            "previewLink": google_info.get('previewLink'),
            "isbn": isbn
        }

# CORS 설정: 프론트엔드의 접근을 허용합니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# [핵심] 6. 백엔드 개발: 유저 동기화 API
@app.post("/api/auth/sync")
def sync_user(user_data: UserSyncRequest, db: Session = Depends(database.get_db)):
    # 기존 유저가 있는지 이메일로 확인
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    
    if not db_user:
        # 최초 접속 시 is_premium=False로 자동 생성 (Signup)
        new_user = models.User(
            email=user_data.email,
            nickname=user_data.nickname,
            profile_image=user_data.profile_image,
            is_premium=False 
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"status": "created", "user": new_user}
    
    return {"status": "exists", "user": db_user}

@app.get("/api/posts")
def get_posts(db: Session = Depends(database.get_db)):
    # DB에서 실제 포스트와 유저, 도서 정보를 가져옵니다.
    return db.query(models.Post).all()

@app.get("/")
def read_root():
    return {"message": "Welcome to boookntalk API"}

# [에러 해결] get_db 함수 정의가 있어야 합니다.
def get_db():
    db = SessionLocal() # database.py에서 정의한 세션
    try:
        yield db
    finally:
        db.close()
            
@app.post("/api/books/register")
async def finalize_book_registration(book_info: dict, db: Session = Depends(get_db)):
    try:
        # 1. ISBN 처리
        final_isbn = book_info.get('isbn') or f"BNT-{uuid.uuid4().hex[:8].upper()}"
        is_bnt_generated = not book_info.get('isbn')
        
        if not final_isbn:
            # uuid가 임포트되어 있어야 에러가 나지 않습니다.
            final_isbn = f"BNT-{uuid.uuid4().hex[:8].upper()}"
            is_bnt_generated = True
        
        # [해결 2] 데이터 타입 체크
        # 프론트에서 user_id로 email(문자열)을 보낸다면 DB의 registrant_id 타입과 맞아야 합니다.
        raw_user_id = book_info.get('user_id')
        
        # 2. 기존 판본(Edition) 존재 여부 확인
        existing_edition = db.query(models.Edition).filter(models.Edition.isbn == final_isbn).first()
        
        if not existing_edition:
            # 1. Work 생성 (추가 정보 반영)
            new_work = models.Work(
                title=book_info.get('title'),
                author=book_info.get('author'),
                description=book_info.get('description'),
                category=book_info.get('categoryName'),
                original_title=book_info.get('originalTitle')
            )
            db.add(new_work)
            db.flush()

            # 2. Edition 생성 (추가 정보 반영)
            new_edition = models.Edition(
                isbn=final_isbn,
                work_id=new_work.id,
                publisher=book_info.get('publisher'),
                cover_image=book_info.get('cover'),
                page_count=book_info.get('pageCount'),
                pub_date=book_info.get('pubDate'),
                preview_link=book_info.get('previewLink'),
                is_bnt_isbn=is_bnt_generated,
                registrant_id=book_info.get('user_id')
            )
            db.add(new_edition)
            db.flush()
            target_edition_id = new_edition.id
        else:
            target_edition_id = existing_edition.id

        # 5. 사용자의 서재(UserLibrary)에 연결
        # 중복 등록 방지 로직 추가
        already_exists = db.query(models.UserLibrary).filter(
            models.UserLibrary.user_id == raw_user_id,
            models.UserLibrary.edition_id == target_edition_id
        ).first()

        if not already_exists:
            new_user_book = models.UserLibrary(
                user_id=raw_user_id,
                edition_id=target_edition_id,
                status="reading"
            )
            db.add(new_user_book)
        
        db.commit()
        return {"status": "success", "isbn": final_isbn}

    except Exception as e:
        db.rollback()
        # [중요] 터미널에 실제 에러를 찍어서 확인하기 위함
        print(f"Registration Error: {str(e)}") 
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")
    
@app.get("/api/my-library/{user_email}")
async def get_my_library(user_email: str, db: Session = Depends(get_db)):
    # UserLibrary, Edition, Work 테이블을 Join하여 데이터 추출
    library_items = db.query(
        models.UserLibrary,
        models.Edition,
        models.Work
    ).join(models.Edition, models.UserLibrary.edition_id == models.Edition.id)\
     .join(models.Work, models.Edition.work_id == models.Work.id)\
     .filter(models.UserLibrary.user_id == user_email)\
     .all()

    results = []
    for lib, ed, work in library_items:
        results.append({
            "library_id": lib.id,
            "status": lib.status,
            "added_at": lib.added_at,
            "title": work.title,
            "author": work.author,
            "cover": ed.cover_image,
            "isbn": ed.isbn,
            "page_count": ed.page_count,
            "category": work.category
        })
    return results

@app.patch("/api/my-library/{library_id}")
async def update_library_info(library_id: int, info: dict, db: Session = Depends(get_db)):
    db_item = db.query(models.UserLibrary).filter(models.UserLibrary.id == library_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # 전달받은 필드만 업데이트 (rating, status, short_review 등)
    for key, value in info.items():
        setattr(db_item, key, value)
        
    db.commit()
    return {"message": "Updated successfully"}

class LibraryUpdate(BaseModel):
    status: Optional[str] = None
    rating: Optional[float] = None
    start_date: Optional[datetime] = None
    finish_date: Optional[datetime] = None
    short_review: Optional[str] = None
    book_type: Optional[str] = None

# 2. 업데이트 API 엔드포인트
@app.patch("/api/my-library/{library_id}")
async def update_library_entry(
    library_id: int, 
    update_data: LibraryUpdate, 
    db: Session = Depends(get_db)
):
    # 해당 ID의 기록 찾기
    db_item = db.query(models.UserLibrary).filter(models.UserLibrary.id == library_id).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")

    # 전달된 데이터만 추출하여 업데이트 (None이 아닌 값만)
    update_dict = update_data.dict(exclude_unset=True)
    
    for key, value in update_dict.items():
        setattr(db_item, key, value)

    try:
        db.commit()
        db.refresh(db_item)
        return {"message": "성공적으로 업데이트되었습니다.", "data": db_item}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB 업데이트 오류: {str(e)}")