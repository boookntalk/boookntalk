# 파일 경로: backend/sync_insights.py
# 역할 및 기능: BoooknTalk 기존 유저들의 과거 기록을 스캔하여 통계 테이블을 동기화합니다.
# 업데이트: 작가 랭킹 집계 시 기획자의 '옵션 A(WISH, READING, COMPLETED 전체 포함)' 철학을 반영했습니다.

import os
import re
from sqlalchemy import func, extract
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# ==========================================
# [팩트 체크 1] database.py가 import 되기 전에 .env.local을 찾아 강제로 주입합니다.
# ==========================================
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)

env_local_path = os.path.join(current_dir, ".env.local")
parent_env_local_path = os.path.join(parent_dir, ".env.local")

if os.path.exists(env_local_path):
    load_dotenv(env_local_path, override=True)
elif os.path.exists(parent_env_local_path):
    load_dotenv(parent_env_local_path, override=True)
else:
    load_dotenv()

from database import SessionLocal
import models

# ▼▼▼ 파이썬용 메인 작가 파싱 함수 ▼▼▼
def get_primary_author(author_str: str) -> str:
    if not author_str:
        return "작자 미상"
    
    parts = re.split(r'[,;]', author_str)
    first_author = parts[0].strip()
    
    first_author = re.sub(r'^(지은이|저자|글|옮긴이|역자|그림)\s*[:|：]\s*', '', first_author)
    first_author = re.sub(r'\s*\([^)]+\)$', '', first_author)
    first_author = re.sub(r'(지음|저|옮김|역|그림)$', '', first_author)
    
    return first_author.strip()

"""
sync_all_insights 함수
"""
def sync_all_insights(db: Session):
    print("\n========================================")
    print(f"🔌 타겟 DB 호스트: {os.getenv('host')}")
    print("========================================")

    db.query(models.InsightSummary).delete()
    db.query(models.InsightMonthly).delete()
    db.query(models.InsightGenre).delete()
    db.query(models.InsightAuthor).delete()
    db.commit()

    users = db.query(models.User).all()
    for user in users:
        uid = user.id
        print(f"\n🔍 [유저 ID: {uid} | Email: {user.email}] 스캔 시작...")

        completed_records = db.query(models.Record).filter(
            models.Record.user_id == uid, 
            models.Record.status == "COMPLETED"
        ).all()
        
        total_read = len(completed_records)
        print(f"   ✅ 찾은 완독 도서 수: {total_read}권")
        
        total_reading = db.query(models.Record).filter(models.Record.user_id == uid, models.Record.status == "READING").count()
        total_wish = db.query(models.Record).filter(models.Record.user_id == uid, models.Record.status == "WISH").count()
        total_memos = db.query(models.Memo).filter(models.Memo.user_id == uid).count()
        total_short_reviews = db.query(models.Record).filter(
            models.Record.user_id == uid, 
            models.Record.short_review.isnot(None), 
            models.Record.short_review != ""
        ).count()
        total_long_reviews = db.query(models.LongReview).filter(models.LongReview.user_id == uid).count()

        summary = models.InsightSummary(
            user_id=uid,
            total_read_books=total_read,
            total_reading_books=total_reading,
            total_wish_books=total_wish,
            total_memos=total_memos,
            total_short_reviews=total_short_reviews,
            total_long_reviews=total_long_reviews
        )
        db.add(summary)

        # 월별 독서 흐름 (완독 기준 유지)
        monthly_data = db.query(
            extract('year', models.Record.finish_date).label('year'),
            extract('month', models.Record.finish_date).label('month'),
            func.count(models.Record.id).label('count')
        ).filter(
            models.Record.user_id == uid,
            models.Record.status == "COMPLETED",
            models.Record.finish_date.isnot(None)
        ).group_by(
            extract('year', models.Record.finish_date),
            extract('month', models.Record.finish_date)
        ).all()

        for data in monthly_data:
            if data.year and data.month:
                db.add(models.InsightMonthly(user_id=uid, year=int(data.year), month=int(data.month), read_count=data.count))

        # ==========================================
        # 장르 통계 집계 - ▼▼▼ 옵션 A (전체 상태 포함) 완벽 적용 ▼▼▼
        # ==========================================
        # 이제 WISH(찜)와 READING(읽는 중) 도서의 장르도 모두 나의 선호 장르로 흡수합니다!
        genre_data = db.query(models.Work.category, func.count(models.Record.id).label('count')).join(
            models.Edition, models.Record.edition_id == models.Edition.id
        ).join(
            models.Work, models.Edition.work_id == models.Work.id
        ).filter(
            models.Record.user_id == uid, 
            # ▼▼▼ 기존 "COMPLETED" 단일 조건에서 3가지 상태 모두 포함으로 확장! ▼▼▼
            models.Record.status.in_(["COMPLETED", "READING", "WISH"]) 
        ).group_by(models.Work.category).all()

        for data in genre_data:
            # 아까 sync_genres.py로 세탁을 마쳤으므로, 여기엔 기획자님의 '8대 표준 장르'가 들어옵니다.
            genre_name = data.category if data.category else "기타"
            db.add(models.InsightGenre(user_id=uid, genre_name=genre_name, read_count=data.count))
            
        # ==========================================
        # 작가 랭킹 집계 - ▼▼▼ 옵션 A (전체 상태 포함) 완벽 적용 ▼▼▼
        # ==========================================
        author_data = db.query(models.Work.author, func.count(models.Record.id).label('count')).join(
            models.Edition, models.Record.edition_id == models.Edition.id
        ).join(
            models.Work, models.Edition.work_id == models.Work.id
        ).filter(
            models.Record.user_id == uid, 
            models.Record.status.in_(["COMPLETED", "READING", "WISH"]) # 전체 상태를 포함합니다!
        ).group_by(models.Work.author).all()

        author_counts = {}
        for data in author_data:
            primary_name = get_primary_author(data.author)
            author_counts[primary_name] = author_counts.get(primary_name, 0) + data.count

        for author_name, count in author_counts.items():
            db.add(models.InsightAuthor(user_id=uid, author_name=author_name, read_count=count))

    db.commit()
    print("\n✨ [BoooknTalk] 옵션 A가 적용된 인사이트 동기화가 성공적으로 완료되었습니다!")

if __name__ == "__main__":
    db_session = SessionLocal()
    try:
        sync_all_insights(db_session)
    finally:
        db_session.close()