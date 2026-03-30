# 파일 경로: backend/routers/library.py

from utils.global_category_mapper import get_category_hierarchy
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

# ▼▼▼ [에러 해결 1] 누락되었던 datetime 및 Pydantic 모듈 추가 ▼▼▼
from datetime import datetime
from pydantic import BaseModel

from database import get_db
import models

# ▼▼▼ [공통 코드] 인사이트 실시간 동기화 서비스 Import ▼▼▼
from services.insight_service import sync_insight_on_status_change

# ==========================================
# ▼▼▼ [에러 해결 2] 누락되었던 Request 스키마 정의 ▼▼▼
# (프론트엔드에서 API 호출 시 body로 넘어오는 데이터 구조입니다)
# ==========================================
class RecordCreateRequest(BaseModel):
    user_id: int
    edition_id: int
    status: str

class StatusUpdateRequest(BaseModel):
    user_id: int
    new_status: str

# 라우터 세팅
router = APIRouter(prefix="/api/library", tags=["library"]) 


# [기존 유지] 특정 사용자의 서재(프로필 + 책 목록) 조회 API
@router.get("/users/{target_user_id}")
def get_user_library_public(target_user_id: int, db: Session = Depends(get_db)):
    target_user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    records = db.query(models.Record).filter(
        models.Record.user_id == target_user_id
    ).order_by(models.Record.added_at.desc()).all()

    books = []
    for record in records:
        edition = db.query(models.Edition).filter(models.Edition.id == record.edition_id).first()
        if not edition: continue
            
        work = db.query(models.Work).filter(models.Work.id == edition.work_id).first()
        
        books.append({
            "record_id": record.id,
            "work_title": work.title if work else edition.title, 
            "cover_image": edition.cover_image,
            "status": record.status, 
            "rating": record.rating,
            "added_at": record.added_at.isoformat() if record.added_at else None
        })
    
    return {
        "profile": {
            "id": target_user.id,
            "nickname": target_user.nickname or target_user.email.split('@')[0],
            "bio": target_user.bio or "아직 소개글이 없습니다.",
            "profile_image": target_user.profile_image
        },
        "stats": {
            "total_books": len(books),
            "reading_count": sum(1 for b in books if b['status'] == 'READING'),
            "finished_count": sum(1 for b in books if b['status'] == 'FINISHED'),
        },
        "books": books
    }
    

# ▼▼▼ [에러 해결 3] 도서 추가 (추측성 코드 제거 및 스키마 적용 완료) ▼▼▼
@router.post("/")
def add_to_library(request: RecordCreateRequest, db: Session = Depends(get_db)):
    
    new_record = models.Record(
        user_id=request.user_id,
        edition_id=request.edition_id,
        status=request.status,
    )
    db.add(new_record)
    db.flush()

    work = db.query(models.Work).join(models.Edition).filter(models.Edition.id == request.edition_id).first()
    
    sync_insight_on_status_change(
        db=db,
        user_id=request.user_id, 
        old_status=None,          
        new_status=new_record.status, 
        finish_date=new_record.finish_date,
        genre_name=work.category if work else "기타",
        author_name=work.author if work else "알 수 없음"
    )

    db.commit()
    db.refresh(new_record)
    return new_record


# ▼▼▼ [에러 해결 4] 상태 변경 (추측성 코드 제거 및 스키마 적용 완료) ▼▼▼
@router.patch("/{record_id}/status")
def update_record_status(record_id: int, request: StatusUpdateRequest, db: Session = Depends(get_db)):
    record = db.query(models.Record).filter(models.Record.id == record_id, models.Record.user_id == request.user_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")

    old_status = record.status
    record.status = request.new_status
    
    if request.new_status == "COMPLETED" and old_status != "COMPLETED":
        record.finish_date = datetime.utcnow() # 완독 시간 자동 기록

    work = record.edition.work if record.edition else None

    sync_insight_on_status_change(
        db=db,
        user_id=request.user_id,
        old_status=old_status,        
        new_status=record.status,     
        finish_date=record.finish_date,
        genre_name=work.category if work else "기타",
        author_name=work.author if work else "알 수 없음"
    )

    db.commit()
    db.refresh(record)
    return record


# ▼▼▼ [에러 해결] 파라미터에서 user_id를 제거하고 내부에서 추출하도록 변경 ▼▼▼
@router.delete("/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    # 1. record_id만으로 일단 기록을 찾습니다.
    record = db.query(models.Record).filter(models.Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")

    # 2. 찾은 기록에서 이 책의 주인(user_id)과 기존 상태를 추출합니다.
    target_user_id = record.user_id 
    old_status = record.status
    work = record.edition.work if record.edition else None

    # ▼▼▼ [공통 트리거 발동] 도서 삭제 차감 (-1) ▼▼▼
    # 추출한 target_user_id를 통계 동기화 엔진에 넘겨줍니다.
    sync_insight_on_status_change(
        db=db,
        user_id=target_user_id,
        old_status=old_status,
        new_status=None,          # 새로운 상태 없음 (삭제됨)
        finish_date=record.finish_date,
        genre_name=work.category if work else "기타",
        author_name=work.author if work else "알 수 없음"
    )

    db.delete(record)
    db.commit()
    return {"message": "정상적으로 삭제되었습니다."}

