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
    
    # 2. [수정] Record 테이블에서 'short_review'가 있는 것만 조회
    # (작품(Work) 단위로 묶어서 보여주기 위해 에디션들의 work_id를 활용)
    
    # 2-1. 같은 작품(Work)을 공유하는 모든 에디션 ID 찾기
    related_edition_ids = db.query(models.Edition.id).filter(
        models.Edition.work_id == edition.work_id
    ).all()
    # 리스트 형태로 변환 [(1,), (2,)] -> [1, 2]
    related_edition_ids = [ed.id for ed in related_edition_ids]

    # 2-2. 해당 에디션들에 달린 기록 중, 한줄평이 있고(공개) 내용이 있는 것 조회
    records = db.query(models.Record).filter(
        models.Record.edition_id.in_(related_edition_ids),
        models.Record.short_review != None,       # 한줄평 내용이 있어야 함
        models.Record.short_review != "",         # 빈 문자열 제외
        models.Record.is_short_review_public == True # 공개 설정된 것만
    ).order_by(models.Record.added_at.desc()).all() # 최신순 정렬

    # 3. 데이터 가공
    # 3. 데이터 가공
    result = []
    for record in records:
        # User 정보 조회
        user = db.query(models.User).filter(models.User.id == record.user_id).first()
        
        result.append({
            "id": record.id,
            "user_id": record.user_id, # 👈 [핵심 수정] 이 줄을 반드시 추가해주세요!
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
    edition_req: dict, # 실제로는 Pydantic 스키마 사용 권장
    background_tasks: BackgroundTasks, # 👈 핵심 파라미터
    db: Session = Depends(get_db)
):
    # 1. 필수 데이터 확인 (예시)
    if not edition_req.get("title") or not edition_req.get("isbn"):
        raise HTTPException(status_code=400, detail="Title and ISBN are required") # 👈 이제 에러 안 남

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