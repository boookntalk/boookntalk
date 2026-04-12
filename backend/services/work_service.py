# 경로: backend/services/work_service.py
# 역할 및 기능: BoooknTalk 소셜 광장의 작품 기준 상세 정보 집계 및 관련 공개 리뷰 리스트를 추출하는 비즈니스 로직(서비스 계층)입니다.
# (최신 업데이트: 리뷰가 0개일 때 빈 화면을 방지하고 유저 작성을 유도하는 '콜드스타트 폴백 로직' 적용 완료)

from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from fastapi import HTTPException
from models import Work, Edition, Record, User, LongReview

# 함수 기능: 특정 작품의 마스터 정보 및 커뮤니티 통계(평균 별점, 담은 사람 수, 판본 수)를 집계하여 반환합니다.
def get_work_detail_stats(db: Session, work_id: int):
    # 1. 작품 기본 정보 조회
    work = db.query(Work).filter(Work.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="작품을 찾을 수 없습니다.")

    # 2. 판본 수 및 대표 커버 이미지 추출
    editions = db.query(Edition).filter(Edition.work_id == work_id).all()
    edition_count = len(editions)
    best_cover = None
    if editions:
        cover_edition = next((e for e in editions if e.cover_image), None)
        best_cover = cover_edition.cover_image if cover_edition else None

    # 3. 담은 사람 수 및 평균 별점 집계
    stats = db.query(
        func.count(Record.id).label("total_added"),
        func.avg(Record.rating).label("average_rating")
    ).join(Edition, Record.edition_id == Edition.id)\
     .filter(Edition.work_id == work_id).first()

    total_added = stats.total_added or 0
    average_rating = round(stats.average_rating, 1) if stats.average_rating else 0.0

    return {
        "id": work.id,
        "title": work.title,
        "author": work.author,
        "category": work.category,
        "description": work.description,
        "best_cover": best_cover,
        "edition_count": edition_count,
        "total_added": total_added,
        "average_rating": average_rating
    }

# 함수 기능: 특정 작품에 대해 유저들이 '공개'로 설정한 한줄평 목록을 반환합니다. (데이터가 없으면 에디터 가이드 반환)
def get_work_short_reviews(db: Session, work_id: int):
    records = db.query(Record, User).join(User, Record.user_id == User.id)\
        .join(Edition, Record.edition_id == Edition.id)\
        .filter(
            Edition.work_id == work_id,
            Record.short_review != None,
            Record.short_review != "",
            Record.is_short_review_public == True # 공개 설정된 데이터만 필터링
        ).order_by(Record.added_at.desc()).all()

    result = []
    for record, user in records:
        result.append({
            "id": record.id,
            "user_name": user.nickname or "이름 없음",
            "user_image": user.profile_image,
            "rating": record.rating,
            "short_review": record.short_review,
            "created_at": record.added_at.isoformat() if record.added_at else ""
        })

    # ▼▼▼ [핵심 적용] 데이터가 0개일 때 빈 화면을 막아주는 콜드스타트 폴백 데이터 ▼▼▼
    if not result:
        return [{
            "id": 0, # 클릭 이벤트를 막기 위해 0으로 세팅
            "user_name": "BoooknTalk 에디터",
            "user_image": "", # 빈 문자열을 주면 프론트엔드의 <AuthorAvatar />가 기본 아이콘을 띄웁니다.
            "rating": 0,
            "short_review": "이 책의 첫 번째 페이지를 넘긴 당신, 어떤 문장이 마음에 닿았나요? 당신만의 첫 번째 사색을 기록해 보세요.",
            "created_at": ""
        }]

    return result

# 함수 기능: 특정 작품에 대해 작성된 발행 완료 긴줄평 목록을 반환합니다. (데이터가 없으면 에디터 가이드 반환)
def get_work_long_reviews(db: Session, work_id: int):
    reviews = db.query(LongReview, User).join(User, LongReview.user_id == User.id)\
        .filter(
            LongReview.work_id == work_id,
            LongReview.is_draft == False # 임시저장 상태 제외
        ).order_by(LongReview.created_at.desc()).all()

    result = []
    for review, user in reviews:
        result.append({
            "id": review.id,
            "title": review.title,
            "content": review.content, 
            "user_name": user.nickname or "이름 없음",
            "user_image": user.profile_image,
            "is_spoiler": review.is_spoiler,
            "created_at": review.created_at.isoformat() if review.created_at else ""
        })

    # ▼▼▼ [핵심 적용] 데이터가 0개일 때 빈 화면을 막아주는 콜드스타트 폴백 데이터 ▼▼▼
    if not result:
        return [{
            "id": 0,
            "title": "첫 번째 사색을 기다립니다",
            "content": "아직 기록되지 않은 세계가 당신의 시선을 기다리고 있습니다. 이 책을 읽으며 느꼈던 감정의 결을 BoooknTalkers와 함께 나누어 주세요. 누군가에게는 당신의 기록이 새로운 영감이 됩니다.",
            "user_name": "BoooknTalk 에디터",
            "user_image": "",
            "is_spoiler": False,
            "created_at": ""
        }]

    return result