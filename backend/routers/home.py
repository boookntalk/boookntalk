from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from typing import Optional, List
from database import get_db
from sqlalchemy import asc, func, desc
from datetime import datetime, timedelta  # ▼ 날짜 계산을 위해 추가된 모듈
from models import GlobalTrendingAuthor, Tag, RecordTag
from services.trending_service import update_global_trending_authors
from schemas import TrendingAuthorResponse
from services.external_api_service import get_cached_external_books

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
    """
    고도화된 오늘의 문장(독서노트) API:
    1. 40자 이상의 깊이 있는 공개 메모만 선별
    2. User 테이블을 JOIN하여 작성자 닉네임(user) 추출 추가 👈 [NEW]
    3. Memo 테이블에서 페이지 번호(page) 추출 추가 👈 [NEW]
    4. 최대 3개까지만 랜덤 노출
    """
    sentences = []
    
    # [1] 고품질 문장 쿼리 (User 테이블 추가 JOIN)
    # 쿼리에 models.User를 추가하여 유저 정보까지 한 번에 가져옵니다.
    query = db.query(models.Memo, models.Edition, models.Work, models.User)\
        .join(models.Record, models.Memo.record_id == models.Record.id)\
        .join(models.User, models.Record.user_id == models.User.id)\
        .join(models.Edition, models.Record.edition_id == models.Edition.id)\
        .join(models.Work, models.Edition.work_id == models.Work.id)\
        .filter(models.Memo.is_public == True, func.char_length(models.Memo.sentence) >= 40)\
        .order_by(func.random())\
        .limit(3).all()

    if query:
        for memo, edition, work, user in query:
            # 닉네임이 없으면 이메일 앞자리, 그것도 없으면 'BnTalker'로 예외 처리
            user_name = user.nickname if user and user.nickname else (user.email.split('@')[0] if user else "BnTalker")
            
            sentences.append({
                "id": memo.id,
                "work_id": work.id, 
                "text": memo.sentence,
                "book": work.title,
                "author": work.author,
                "cover": edition.cover_image or "",
                "user": user_name,               # 👈 [NEW] 프론트엔드로 닉네임 전달
                "page": getattr(memo, 'page', getattr(models.Record, 'page', None)) # 👈 [NEW] 페이지 번호 전달 (Memo나 Record 모델 중 있는 곳에서 안전하게 추출)
            })

    # [2] 스마트 폴백: 데이터가 없을 때의 기본값에도 user와 page 규격 맞춤
    if not sentences:
        sentences = [{
            "id": "intro_1",
            "work_id": None,
            "text": "사색이 없는 독서는 소화되지 않은 음식을 먹는 것과 같습니다. BoooknTalk에서 당신만의 깊은 문장을 기록하고 공유해보세요.",
            "book": "BoooknTalk 사용 가이드",
            "author": "에디터",
            "cover": "",
            "user": "BnTalk 최고관리자", # 폴백용 닉네임
            "page": 1                   # 폴백용 페이지
        }]

    return sentences

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
            "work_id": work.id,
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
    메인 화면 Section 1 우측 상단 (독자의 한줄평) - [다중 도서 포커스 적용]
    가장 최근에 달린 고퀄리티(4점 이상) 한줄평 5개를 책 구분 없이 가져옵니다.
    """
    reviews = db.query(models.Record, models.Edition, models.Work, models.User)\
        .join(models.Edition, models.Record.edition_id == models.Edition.id)\
        .join(models.Work, models.Edition.work_id == models.Work.id)\
        .outerjoin(models.User, models.Record.user_id == models.User.id)\
        .filter(
            models.Record.is_short_review_public == True,
            models.Record.short_review != None,
            models.Record.short_review != "",
            models.Record.rating >= 4.0 # 고퀄리티 보장 필터
        )\
        .order_by(desc(models.Record.added_at))\
        .limit(5).all()

    results = []
    for record, edition, work, user in reviews:
        user_name = user.nickname if user and user.nickname else (user.email.split('@')[0] if user else "익명")
        results.append({
            "id": record.id,
            "isbn": edition.isbn,
            "work_id": work.id, # 👈 광장 이동을 위한 식별자
            "title": work.title,
            "author": work.author,
            "cover": edition.cover_image or "",
            "text": record.short_review,
            "user": user_name,
            "rating": record.rating
        })
        
    return results if results else None

@router.get("/best-long-reviews")
def get_best_long_reviews(limit: int = 2, db: Session = Depends(get_db)):
    """
    메인 화면 매거진 섹션용: 'BoooknTalkers의 깊은 사색'
    - 조건: 긴줄평(LongReview) 존재, 100자 이상, Record 평점 4점 이상, 최신순
    """
    # [수정됨] models.LongReview 테이블을 명시적으로 JOIN 합니다.
    reviews = db.query(models.Record, models.Edition, models.Work, models.User, models.LongReview)\
        .join(models.Edition, models.Record.edition_id == models.Edition.id)\
        .join(models.Work, models.Edition.work_id == models.Work.id)\
        .join(models.LongReview, models.Record.id == models.LongReview.record_id) \
        .outerjoin(models.User, models.Record.user_id == models.User.id)\
        .filter(
            func.char_length(models.LongReview.content) >= 100, # 👈 LongReview 테이블의 content 길이를 체크
            models.Record.rating >= 4.0
        )\
        .order_by(desc(models.LongReview.updated_at))\
        .limit(limit).all()

    results = []
    # 쿼리에서 가져온 LongReview 객체를 풀어서 사용합니다.
    for record, edition, work, user, long_review in reviews:
        user_name = user.nickname if user and user.nickname else (user.email.split('@')[0] if user else "익명")
        results.append({
            "id": record.id,
            "work_id": work.id,
            "title": work.title,
            "author": work.author,
            "cover": edition.cover_image or "",
            "text": long_review.content, # 👈 LongReview 객체에서 텍스트 추출
            "user": user_name,
            "rating": record.rating,
            "created_at": long_review.updated_at.isoformat() if long_review.updated_at else ""
        })
        
    if not results:
        results = [{
            "id": "fallback_long_1",
            "work_id": None,
            "title": "데미안",
            "author": "헤르만 헤세",
            "cover": "",
            "text": "새는 알을 깨고 나온다. 알은 곧 세계다. 태어나려고 하는 자는 하나의 세계를 파괴하지 않으면 안 된다. 이 책을 읽고 나의 세계가 완전히 무너지고 새로 태어나는 경험을 했습니다. 진정한 나를 찾아가는 여정에 대한 깊은 통찰이 담겨 있습니다.",
            "user": "BoooknTalk 에디터",
            "rating": 5.0,
            "created_at": ""
        }]
        
    return results

@router.get("/trending-tags")
def get_trending_tags(db: Session = Depends(get_db)):
    # 1. 실제 DB에서 태그 카운트 집계 (limit 제한을 제거하여 모든 태그 조회)
    all_tags = db.query(
            Tag.name, 
            func.count(RecordTag.tag_id).label('tag_count')
        ) \
        .join(RecordTag, Tag.id == RecordTag.tag_id) \
        .group_by(Tag.id, Tag.name) \
        .order_by(desc('tag_count'), Tag.name.asc()) \
        .all()

    # 2. 만약 DB에 태그가 하나도 없다면 빈 배열 반환
    if not all_tags:
        return []

    # 3. 프론트엔드 WordCloud 컴포넌트가 인식할 수 있는 JSON 포맷 [{"text": "태그명"}] 으로 변환
    result = [{"text": tag.name} for tag in all_tags]
    
    return result

# 기능: 캐싱된 글로벌 트렌드 작가 Top 5 목록을 조회하여 0.1초 이내에 프론트엔드에 반환합니다.
@router.get("/inspiring-authors")
def get_inspiring_authors(db: Session = Depends(get_db)):
    # 이미 정제된 캐싱 테이블에서 순위대로 가져오기만 하면 끝납니다.
    authors = db.query(GlobalTrendingAuthor).order_by(GlobalTrendingAuthor.rank.asc()).all()
    
    result = []
    for a in authors:
        result.append({
            "id": a.contributor_id,
            "name": a.author_name,
            "author_profile_image": a.author_profile_image,
            "cover": a.representative_cover,
            "keyword": a.top_keyword,
            "mentions": a.mention_count
        })
        
    return result

# 브라우저 주소창에서 바로 실행해보기 위해 GET으로 변경하고, 경로 중복을 제거합니다.
@router.get("/sync-trending-authors")
def sync_trending_authors(db: Session = Depends(get_db)):
    result = update_global_trending_authors(db)
    return result

# 기능: 트렌딩 작가 목록을 DB에서 조회한 후, TrendingAuthorResponse 스키마 규격에 맞춰 프론트엔드에 반환
@router.get("/trending-authors", response_model=List[TrendingAuthorResponse])
def get_trending_authors(db: Session = Depends(get_db)):
    # DB에서 작가 로테이션 목록을 순위(rank) 순으로 정렬해서 가져오기
    authors = db.query(GlobalTrendingAuthor).order_by(GlobalTrendingAuthor.rank.asc()).all()
    
    return authors

# ==========================================
# [NEW] 메인 대시보드 통합 API (BFF 패턴 적용)
# ==========================================
@router.get("/dashboard")
def get_home_dashboard(user_email: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        # 도서관 인기 및 신간 도서 로드
        library_popular = get_cached_external_books(db=db, category="library_popular")
        naver_new = get_cached_external_books(db=db, category="naver_new")

        return {
            "stats": get_home_statistics(db=db),
            "heroSentences": get_today_sentences(user_email=user_email, db=db),
            "readersChoice": get_readers_choice(db=db),
            "bestLongReviews": get_best_long_reviews(limit=2, db=db), 
            "coverFlowBooks": get_cover_flow_books(db=db),
            "trendingTags": get_trending_tags(db=db), 
            "inspiringAuthors": get_inspiring_authors(db=db),
            "ugcFeeds": get_recent_ugc_feeds(limit=6, db=db), # 아래쪽 함수에 있던 내용 통합
            "libraryPopular": library_popular,
            "naverNewArrivals": naver_new, 
            "newArrivals": get_new_arrivals(days=3, db=db),
        }
    except Exception as e:
        print(f"대시보드 통합 데이터 생성 실패: {e}")
        raise HTTPException(status_code=500, detail="대시보드 데이터를 구성하는 중 에러가 발생했습니다.")