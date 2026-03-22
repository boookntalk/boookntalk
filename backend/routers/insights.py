# 파일 경로: backend/routers/insights.py
# 역할 및 기능: BoooknTalk 서재 인사이트 화면에 필요한 전체 요약 통계와 연간/월간 독서 흐름 데이터를 초고속으로 제공하는 API 라우터입니다.

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from database import get_db
import models

router = APIRouter(
    prefix="/api/insights",
    tags=["Insights"]
)

# 기능: 유저의 이메일을 기반으로 '전체 기간(All-time)'의 요약 지표, 장르 스펙트럼, 작가 랭킹 데이터를 한 번에 응답합니다.
@router.get("/user/{email}/summary")
def get_insight_summary(email: str, db: Session = Depends(get_db)):
    # 1. 유저 검증 및 ID 확보
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_id = user.id

    # 2. 요약 데이터 조회 (Record나 Memo 테이블을 뒤지지 않고 InsightSummary 한 줄만 읽어옵니다)
    summary = db.query(models.InsightSummary).filter(models.InsightSummary.user_id == user_id).first()
    
    # 3. 선호 장르 스펙트럼 조회 (많이 읽은 순으로 정렬)
    genres = db.query(models.InsightGenre).filter(
        models.InsightGenre.user_id == user_id,
        models.InsightGenre.read_count > 0
    ).order_by(models.InsightGenre.read_count.desc()).all()

    # 4. 사랑한 작가 TOP 3 조회
    top_authors = db.query(models.InsightAuthor).filter(
        models.InsightAuthor.user_id == user_id,
        models.InsightAuthor.read_count > 0
    ).order_by(models.InsightAuthor.read_count.desc()).limit(5).all()

    # 프론트엔드 차트가 요구하는 JSON 규격으로 포장하여 반환
    return {
        "overview": {
            "read_books": summary.total_read_books if summary else 0,
            "reading_books": summary.total_reading_books if summary else 0,
            "wish_books": summary.total_wish_books if summary else 0
        },
        "genre_spectrum": [{"name": g.genre_name, "value": g.read_count} for g in genres],
        "top_authors": [{"rank": i + 1, "name": a.author_name, "count": a.read_count} for i, a in enumerate(top_authors)],
        "records_weight": {
            "memo_count": summary.total_memos if summary else 0,
            "short_review_count": summary.total_short_reviews if summary else 0,
            "long_review_count": summary.total_long_reviews if summary else 0
        }
    }


# 기능: 선택한 연도(또는 '전체')에 따라 거시적(연도별) 또는 미시적(월별) 독서 흐름 데이터를 다이나믹하게 집계하여 응답합니다.
# 파일 경로: backend/routers/insights.py

# 기능: 선택한 연도(또는 '전체')에 따라 거시적(연도별) 또는 미시적(월별) 독서 흐름 데이터를 다이나믹하게 집계하여 응답합니다.
# [업그레이드] 완독(FINISHED)은 다 읽은 날(finish_date) 기준, 읽는 중(READING)은 서재에 담은 날(added_at) 기준으로 분리하여 이중 카운팅합니다.
@router.get("/user/{email}/yearly-flow")
def get_yearly_flow(
    email: str, 
    year: str = Query("all", description="'all' 또는 특정 연도(예: '2026')"), 
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_id = user.id

    # 1. 유저의 모든 서재 기록을 가져옵니다. (메모리 상에서 두 가지 기준일로 정밀 타격하기 위함)
    records = db.query(models.Record).filter(models.Record.user_id == user_id).all()

    # [상태 A] 전체 기간 (All-time) 선택 시 -> 연도별 그룹핑
    if year.lower() == "all":
        flow_dict = {} # 연도별 데이터를 담을 딕셔너리
        total_read = 0

        for r in records:
            # 1-1. 완독한 책은 'finish_date' 기준으로 연도 카운팅
            if r.status in ['FINISHED', 'COMPLETED'] and r.finish_date:
                y = r.finish_date.year
                if y not in flow_dict: 
                    flow_dict[y] = {"finished_count": 0, "reading_count": 0}
                flow_dict[y]["finished_count"] += 1
                total_read += 1
                
            # 1-2. 읽는 중인 책은 'added_at' 기준으로 연도 카운팅
            elif r.status == 'READING' and r.added_at:
                y = r.added_at.year
                if y not in flow_dict: 
                    flow_dict[y] = {"finished_count": 0, "reading_count": 0}
                flow_dict[y]["reading_count"] += 1

        # 연도 오름차순(과거->최신)으로 정렬하여 프론트엔드 배열 포맷으로 변환
        flow_data = []
        for y in sorted(flow_dict.keys()):
            flow_data.append({
                "name": f"{y}년",
                "finished_count": flow_dict[y]["finished_count"],
                "reading_count": flow_dict[y]["reading_count"]
            })

        return {
            "type": "yearly",
            "total_read_in_period": total_read,
            "flow_data": flow_data
        }

    # [상태 B] 특정 연도 (예: 2026) 선택 시 -> 월별 그룹핑
    else:
        target_year = int(year)
        
        # 1월부터 12월까지 기본 뼈대(0건)를 미리 만들어 둡니다.
        flow_dict = {m: {"finished_count": 0, "reading_count": 0} for m in range(1, 13)}
        total_read = 0

        for r in records:
            # 2-1. 완독한 책 중 '해당 연도'에 다 읽은 책을 월별로 꽂아 넣습니다.
            if r.status in ['FINISHED', 'COMPLETED'] and r.finish_date and r.finish_date.year == target_year:
                flow_dict[r.finish_date.month]["finished_count"] += 1
                total_read += 1
                
            # 2-2. 읽는 중인 책 중 '해당 연도'에 서재에 담은 책을 월별로 꽂아 넣습니다.
            elif r.status == 'READING' and r.added_at and r.added_at.year == target_year:
                flow_dict[r.added_at.month]["reading_count"] += 1

        # 프론트엔드 차트가 예쁘게 그려지도록 배열 생성
        flow_data = []
        for m in range(1, 13):
            flow_data.append({
                "name": f"{m}월",
                "finished_count": flow_dict[m]["finished_count"],
                "reading_count": flow_dict[m]["reading_count"]
            })

        return {
            "type": "monthly",
            "total_read_in_period": total_read,
            "flow_data": flow_data
        }