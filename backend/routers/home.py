from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from typing import Optional
from database import get_db
from sqlalchemy import asc
from datetime import datetime, timedelta  # ▼ 날짜 계산을 위해 추가된 모듈
import models

router = APIRouter(
    prefix="/api/home",
    tags=["Home"]
)

@router.get("/stats")
def get_home_statistics(db: Session = Depends(get_db)):
    total_sentences = db.query(func.count(models.Memo.id)).scalar() or 0
    total_pages_read = db.query(func.sum(models.Record.current_page)).scalar() or 0
    reading_books_count = db.query(func.count(models.Record.id)).filter(models.Record.status == 'READING').scalar() or 0

    return {
        "total_sentences": total_sentences,
        "total_pages": total_pages_read,
        "reading_books": reading_books_count
    }

@router.get("/recent-ugc")
def get_recent_ugc_feeds(db: Session = Depends(get_db), limit: int = 12):
    """
    고도화된 실시간 사색의 파편들 피드:
    1. 고품질 메모(30자 이상) 우선 조회
    2. 데이터 부족 시 조건 완화 및 기간 확장
    3. 최종 데이터 부재 시 시스템 추천 문장 반환
    """
    # [Step 1] 고품질 데이터 1차 조회 (30자 이상의 깊이 있는 사색)
    recent_memos = db.query(models.Memo, models.Record, models.Edition, models.Work)\
        .join(models.Record, models.Memo.record_id == models.Record.id)\
        .join(models.Edition, models.Record.edition_id == models.Edition.id)\
        .join(models.Work, models.Edition.work_id == models.Work.id)\
        .filter(
            models.Memo.is_public == True,
            func.char_length(models.Memo.sentence) >= 30 
        )\
        .order_by(desc(models.Memo.created_at))\
        .limit(limit).all()

    # [Step 2] 데이터가 부족할 경우(4개 미만) 조건 완화하여 추가 조회
    if len(recent_memos) < 4:
        additional_memos = db.query(models.Memo, models.Record, models.Edition, models.Work)\
            .join(models.Record, models.Memo.record_id == models.Record.id)\
            .join(models.Edition, models.Record.edition_id == models.Edition.id)\
            .join(models.Work, models.Edition.work_id == models.Work.id)\
            .filter(
                models.Memo.is_public == True,
                ~models.Memo.id.in_([m[0].id for m in recent_memos]) # 중복 제외
            )\
            .order_by(desc(models.Memo.created_at))\
            .limit(limit - len(recent_memos)).all()
        recent_memos.extend(additional_memos)

    # [Step 3] 공개 설정된 한줄평 가져오기 (기존 로직 유지)
    recent_reviews = db.query(models.Record, models.Edition, models.Work)\
        .join(models.Edition, models.Record.edition_id == models.Edition.id)\
        .join(models.Work, models.Edition.work_id == models.Work.id)\
        .filter(
            models.Record.is_short_review_public == True, 
            models.Record.short_review != None, 
            models.Record.short_review != ""
        )\
        .order_by(desc(models.Record.added_at))\
        .limit(limit).all()

    feeds = []
    # 데이터 가공 (Transformation)
    for memo, record, edition, work in recent_memos:
        user_name = record.user.nickname if record.user and record.user.nickname else "익명"
        
        feeds.append({
            "id": f"memo_{memo.id}",
            "type": "sentence",
            "text": memo.sentence,
            "book": work.title,
            "author": work.author,
            # [수정] models.py의 cover_image를 'cover'라는 키로 매핑
            "cover": edition.cover_image if edition else None, 
            "user": user_name,
            "created_at": memo.created_at.isoformat() if memo.created_at else ""
        })

    # 한줄평 데이터 가공 시에도 Edition 정보가 있다면 동일하게 처리
    for record, edition, work in recent_reviews:
        user_name = record.user.nickname or record.user.email.split('@')[0] if record.user else "익명"
        feeds.append({
            "id": f"review_{record.id}",
            "type": "review",
            "text": record.short_review,
            "book": work.title,
            "cover": edition.cover_image, # 👈 동일하게 수정
            "rating": record.rating,
            "user": user_name,
            "created_at": record.added_at.isoformat() if record.added_at else ""
        })

    # [Step 4] 최종 정렬 및 폴백 데이터 체크
    feeds.sort(key=lambda x: x["created_at"], reverse=True)
    final_feeds = feeds[:limit]

    # 데이터가 아예 없는 경우: BoooknTalk 시스템 큐레이션 반환
    if not final_feeds:
        return [
            {
                "id": "sys_1",
                "type": "sentence",
                "text": "사색이 없는 독서는 소화되지 않은 음식을 먹는 것과 같다. 당신의 사색을 기록해보세요.",
                "book": "BoooknTalk 가이드",
                "author": "에디터",
                "user": "BoooknTalk",
                "created_at": ""
            }
        ]

    return final_feeds

# ▼▼▼ 개선된 신규 도서(New Arrivals) API ▼▼▼
@router.get("/new-arrivals")
def get_new_arrivals(days: int = 3, db: Session = Depends(get_db)):
    """
    오늘 기준 N일(기본 3일) 이내 사이트에 등록된 도서 목록을 반환합니다.
    정렬: 1순위 최신 등록 날짜(일 단위), 2순위 제목 가나다순
    """
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # 1. 3일 이내 데이터 조회 (날짜 최신순 -> 제목 가나다순)
    recent_records = db.query(models.Record, models.Edition, models.Work, models.User)\
        .join(models.Edition, models.Record.edition_id == models.Edition.id)\
        .join(models.Work, models.Edition.work_id == models.Work.id)\
        .outerjoin(models.User, models.Record.user_id == models.User.id)\
        .filter(models.Record.added_at >= cutoff_date)\
        .order_by(desc(func.date(models.Record.added_at)), asc(models.Work.title))\
        .all()
        
    seen_editions = set()
    results = []
    
    # 중복 제거 및 데이터 조립
    for record, edition, work, user in recent_records:
        if edition.id in seen_editions:
            continue
        seen_editions.add(edition.id)
        
        discoverer = "BoooknTalk"
        if user:
            discoverer = user.nickname if user.nickname else user.email.split('@')[0]
            
        results.append({
            "id": edition.isbn,
            "isbn": edition.isbn,
            "title": work.title,
            "author": work.author,
            "cover": edition.cover_image or "",
            "discoverer": discoverer
        })
        
    # 2. 만약 3일 이내 등록된 책이 아예 없다면? -> 가장 최근 등록된 10권 무조건 반환
    if len(results) == 0:
        fallback_records = db.query(models.Record, models.Edition, models.Work, models.User)\
            .join(models.Edition, models.Record.edition_id == models.Edition.id)\
            .join(models.Work, models.Edition.work_id == models.Work.id)\
            .outerjoin(models.User, models.Record.user_id == models.User.id)\
            .order_by(desc(func.date(models.Record.added_at)), asc(models.Work.title))\
            .all()
            
        for record, edition, work, user in fallback_records:
            if edition.id in seen_editions:
                continue
            seen_editions.add(edition.id)
            
            discoverer = "BoooknTalk"
            if user:
                discoverer = user.nickname if user.nickname else user.email.split('@')[0]
                
            results.append({
                "id": edition.isbn,
                "isbn": edition.isbn,
                "title": work.title,
                "author": work.author,
                "cover": edition.cover_image or "",
                "discoverer": discoverer
            })
            
            if len(results) >= 10:
                break

    return results

@router.get("/today-sentences")
def get_today_sentences(user_email: Optional[str] = None, db: Session = Depends(get_db)):
    sentences = []
    limit = 3

    current_user = None
    if user_email:
        current_user = db.query(models.User).filter(models.User.email == user_email).first()

    # 1. 로그인 유저 맞춤 데이터
    if current_user:
        wish_edition_ids = db.query(models.Record.edition_id).filter(
            models.Record.user_id == current_user.id,
            models.Record.status == 'WISH'
        )

        personalized_memos = db.query(models.Memo, models.Edition, models.Work)\
            .join(models.Record, models.Memo.record_id == models.Record.id)\
            .join(models.Edition, models.Record.edition_id == models.Edition.id)\
            .join(models.Work, models.Edition.work_id == models.Work.id)\
            .filter(
                models.Record.edition_id.in_(wish_edition_ids), 
                models.Memo.is_public == True,
                models.Memo.user_id != current_user.id
            )\
            .order_by(func.random())\
            .limit(2).all()
            
        sentences.extend(personalized_memos)

    # 2. 나머지 빈자리 채우기
    remaining_limit = limit - len(sentences)
    if remaining_limit > 0:
        exclude_ids = [m[0].id for m in sentences] if sentences else []
        
        popular_memos = db.query(models.Memo, models.Edition, models.Work)\
            .join(models.Record, models.Memo.record_id == models.Record.id)\
            .join(models.Edition, models.Record.edition_id == models.Edition.id)\
            .join(models.Work, models.Edition.work_id == models.Work.id)\
            .filter(
                models.Memo.is_public == True,
                ~models.Memo.id.in_(exclude_ids)
            )\
            .order_by(desc(models.Memo.created_at)) \
            .limit(remaining_limit).all()
            
        sentences.extend(popular_memos)

    results = []
    themes = ['classic', 'aurora', 'glass']
    
    for idx, (memo, edition, work) in enumerate(sentences):
        results.append({
            "id": memo.id,
            "theme": themes[idx % len(themes)],
            "text": f'"{memo.sentence}"',
            "book": work.title,
            "author": work.author,
            "cover": edition.cover_image or ""
        })

    # DB가 아예 텅 비었을 때의 기본값
    if not results:
        return [{
            "id": 0, "theme": "classic", 
            "text": '"사색이 없는 독서는 소화되지 않은 음식을 먹는 것과 같다."', 
            "book": "BoooknTalk", "author": "에디터", "cover": ""
        }]

    return results

@router.get("/editor-pick")
def get_editor_pick(db: Session = Depends(get_db)):
    """
    메인 화면 Section 1 우측 상단 (이주의 시선)
    관리자가 지정한 리뷰 1개를 가져오거나, 없으면 5점 만점 최신 리뷰로 대체
    """
    pick = db.query(models.Record, models.Edition, models.Work)\
        .join(models.Edition, models.Record.edition_id == models.Edition.id)\
        .join(models.Work, models.Edition.work_id == models.Work.id)\
        .filter(models.Record.is_editor_pick == True)\
        .order_by(desc(models.Record.updated_at)).first()

    if not pick:
        pick = db.query(models.Record, models.Edition, models.Work)\
            .join(models.Edition, models.Record.edition_id == models.Edition.id)\
            .join(models.Work, models.Edition.work_id == models.Work.id)\
            .filter(
                models.Record.is_short_review_public == True, 
                models.Record.rating == 5,
                models.Record.short_review != None,
                models.Record.short_review != ""
            )\
            .order_by(desc(models.Record.added_at)).first()

    # 데이터가 없을 경우의 기본값 (UI가 깨지지 않도록 필드 유지)
    if not pick:
        return {
            "id": 0,
            "text": "성공이라는 욕망 뒤에 감춰진 인간의 나약함에 대하여",
            "user": "BoooknTalk 에디터",
            "isbn": None,
            "title": "기본 추천 도서",
            "author": "작자 미상",
            "cover": ""
        }

    record, edition, work = pick
    user_name = record.user.nickname or record.user.email.split('@')[0] if getattr(record, 'user', None) else "익명"

    # ▼ 추가된 부분: title, author, cover 데이터를 함께 반환
    return {
        "id": record.id,
        "text": record.short_review, 
        "user": user_name,
        "isbn": edition.isbn,
        "title": work.title,
        "author": work.author,
        "cover": edition.cover_image
    }
    
@router.get("/cover-flow-books")
def get_cover_flow_books(db: Session = Depends(get_db)):
    """
    메인 화면 3D 커버 플로우용 데이터 (전체 도서)
    - 인덱스 이동(Jump)을 위해 반드시 제목(title) 기준 오름차순(가나다/ABC)으로 정렬하여 전체 반환
    """
    # 전체 도서를 제목 오름차순으로 조회
    editions = db.query(models.Edition, models.Work)\
        .join(models.Work, models.Edition.work_id == models.Work.id)\
        .order_by(asc(models.Work.title))\
        .all()

    results = []
    seen_isbn = set()
    
    for edition, work in editions:
        if edition.isbn in seen_isbn:
            continue
        seen_isbn.add(edition.isbn)
        
        results.append({
            "id": edition.isbn,
            "isbn": edition.isbn,
            "title": work.title,
            "author": work.author,
            "cover": edition.cover_image or ""
        })

    return results

@router.get("/readers-choice")
def get_readers_choice(db: Session = Depends(get_db)):
    """
    메인 화면 Section 1 우측 상단 (독자의 한줄평)
    가장 최근에 픽(Pick) 되었거나 가장 최근에 리뷰가 달린 책 1권을 선정하고,
    해당 책에 달린 모든 '공개된 한줄평' 리스트를 함께 묶어서 반환합니다.
    """
    # 1. 대상 책 선정 (과거 데이터의 NULL 값까지 포용하도록 isnot(False) 사용)
    target_record = db.query(models.Record)\
        .filter(
            models.Record.is_short_review_public.isnot(False), # True 이거나 비어있는(NULL) 데이터 모두 허용
            models.Record.short_review.isnot(None),
            models.Record.short_review != ""
        )\
        .order_by(desc(models.Record.is_editor_pick), desc(models.Record.added_at))\
        .first()

    if not target_record:
        return None

    target_edition = target_record.edition
    target_work = target_edition.work

    # 2. 해당 책(Work)에 달린 모든 공개 한줄평 가져오기
    reviews = db.query(models.Record)\
        .join(models.Edition, models.Record.edition_id == models.Edition.id)\
        .filter(
            models.Edition.work_id == target_work.id,
            models.Record.is_short_review_public.isnot(False), # 여기도 동일하게 적용
            models.Record.short_review.isnot(None),
            models.Record.short_review != ""
        ).order_by(desc(models.Record.added_at)).all()

    # 3. 프론트엔드로 보낼 리뷰 배열 조립
    review_list = []
    for r in reviews:
        user_name = r.user.nickname or r.user.email.split('@')[0] if r.user else "익명"
        review_list.append({
            "id": r.id,
            "text": r.short_review,
            "user": user_name,
            "rating": r.rating
        })

    return {
        "isbn": target_edition.isbn,
        "title": target_work.title,
        "author": target_work.author,
        "cover": target_edition.cover_image,
        "reviews": review_list
    }