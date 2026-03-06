from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from database import get_db, SessionLocal # SessionLocal 가져오기 (백그라운드용)
import models
from utils.image_handler import download_and_update_cover

router = APIRouter(prefix="/api/editions", tags=["editions"])

@router.get("/{edition_id}/short-reviews")
def get_edition_short_reviews(edition_id: int, db: Session = Depends(get_db)):
    # 1. 해당 에디션 정보 조회
    edition = db.query(models.Edition).filter(models.Edition.id == edition_id).first()
    if not edition:
        raise HTTPException(status_code=404, detail="Edition not found")
    
    # 2. Record 테이블에서 'short_review'가 있는 것만 조회
    # (작품(Work) 단위로 묶어서 보여주기 위해 에디션들의 work_id를 활용)
    related_edition_ids = db.query(models.Edition.id).filter(
        models.Edition.work_id == edition.work_id
    ).all()
    related_edition_ids = [ed.id for ed in related_edition_ids]

    records = db.query(models.Record).filter(
        models.Record.edition_id.in_(related_edition_ids),
        models.Record.short_review != None,       
        models.Record.short_review != "",         
        models.Record.is_short_review_public == True 
    ).order_by(models.Record.added_at.desc()).all() 

    # 3. 데이터 가공
    result = []
    for record in records:
        # User 정보 조회
        user = db.query(models.User).filter(models.User.id == record.user_id).first()
        
        result.append({
            "id": record.id,
            "user_id": record.user_id, 
            "user_email": user.email if user else None, # 👈 [핵심 수정] 드디어 이메일이 응답 데이터에 포함됩니다!
            "short_review": record.short_review, 
            "rating": record.rating,
            "created_at": record.added_at.isoformat() if record.added_at else "",
            "user_name": user.nickname if user and user.nickname else (user.email.split('@')[0] if user else "Unknown"),
            "user_image": user.profile_image if user else None
        })
    
    return result

# 책(에디션) 생성 API 예시
@router.post("/")
async def create_edition(
    edition_req: dict, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    # 1. 필수 데이터 확인
    if not edition_req.get("title") or not edition_req.get("isbn"):
        raise HTTPException(status_code=400, detail="Title and ISBN are required") 

    # 2. DB 저장
    new_edition = models.Edition(
        title=edition_req.get("title"),
        isbn=edition_req.get("isbn"),
        cover_image=edition_req.get("cover_image"),
        work_id=edition_req.get("work_id"),
        publisher=edition_req.get("publisher"),
        publish_date=edition_req.get("publish_date"),
        description=edition_req.get("description")
    )
    
    db.add(new_edition)
    db.commit()
    db.refresh(new_edition)

    # 3. 백그라운드 이미지 다운로드 예약
    if new_edition.cover_image and "http" in new_edition.cover_image:
        background_tasks.add_task(
            download_and_update_cover, 
            new_edition.id, 
            new_edition.cover_image,
            SessionLocal
        )

    return {
        "id": new_edition.id,
        "title": new_edition.title,
        "cover_image": new_edition.cover_image,
        "isbn": new_edition.isbn
    }