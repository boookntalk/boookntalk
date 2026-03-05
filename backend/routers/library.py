from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from typing import List

# 기존 라우터가 있다면 그 아래에 추가, 없다면 새로 생성
router = APIRouter(prefix="/api/library", tags=["library"]) 

# [NEW] 특정 사용자의 서재(프로필 + 책 목록) 조회 API
@router.get("/users/{target_user_id}")
def get_user_library_public(target_user_id: int, db: Session = Depends(get_db)):
    # 1. 대상 유저 존재 여부 확인
    target_user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. 해당 유저의 서재 기록 조회 (최신순 정렬)
    # 추후 '비공개' 필드가 생긴다면 여기서 필터링해야 함 (현재는 모두 공개 가정)
    records = db.query(models.Record).filter(
        models.Record.user_id == target_user_id
    ).order_by(models.Record.added_at.desc()).all()

    # 3. 데이터 가공 (책 표지, 제목 등 상세 정보 결합)
    books = []
    for record in records:
        edition = db.query(models.Edition).filter(models.Edition.id == record.edition_id).first()
        if not edition: continue
            
        work = db.query(models.Work).filter(models.Work.id == edition.work_id).first()
        
        books.append({
            "record_id": record.id,
            "work_title": work.title if work else edition.title, # Work가 없으면 Edition 제목 사용
            "cover_image": edition.cover_image,
            "status": record.status, # READING, FINISHED, WISH
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