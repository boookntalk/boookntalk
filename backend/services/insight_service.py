# 파일 경로: backend/services/insight_service.py

import re
from sqlalchemy.orm import Session
from datetime import datetime
import models

def get_primary_author(author_str: str) -> str:
    if not author_str: return "작자 미상"
    parts = re.split(r'[,;]', author_str)
    first_author = parts[0].strip()
    first_author = re.sub(r'^(지은이|저자|글|옮긴이|역자|그림)\s*[:|：]\s*', '', first_author)
    first_author = re.sub(r'\s*\([^)]+\)$', '', first_author)
    first_author = re.sub(r'(지음|저|옮김|역|그림)$', '', first_author)
    return first_author.strip()

def sync_insight_on_status_change(
    db: Session, 
    user_id: int, 
    old_status: str | None, 
    new_status: str | None, 
    finish_date: datetime = None, 
    genre_name: str = "기타", 
    author_name: str = "알 수 없음"
):
    # ▼▼▼ [해결 1] 대소문자 무시 & 공백 제거 (프론트에서 'wish'로 넘어와도 'WISH'로 완벽 매핑)
    old_s = old_status.strip().upper() if old_status else None
    new_s = new_status.strip().upper() if new_status else None

    print(f"🚀 [인사이트 트리거 발동] User {user_id} | 상태 변경: {old_s} ➡️ {new_s}")

    # 1. 요약 테이블 (InsightSummary) 업데이트
    summary = db.query(models.InsightSummary).filter(models.InsightSummary.user_id == user_id).first()
    if not summary:
        summary = models.InsightSummary(
            user_id=user_id, total_read_books=0, total_reading_books=0, total_wish_books=0,
            total_memos=0, total_short_reviews=0, total_long_reviews=0
        )
        db.add(summary)
        db.flush()

    # ▼▼▼ [해결 2] 기존 DB에 값이 None일 경우를 대비한 안전 장치
    summary.total_wish_books = summary.total_wish_books or 0
    summary.total_reading_books = summary.total_reading_books or 0
    summary.total_read_books = summary.total_read_books or 0

    # 과거 상태 차감
    if old_s == "WISH":
        summary.total_wish_books = max(0, summary.total_wish_books - 1)
    elif old_s == "READING":
        summary.total_reading_books = max(0, summary.total_reading_books - 1)
    elif old_s in ["COMPLETED", "FINISHED", "READ"]:
        summary.total_read_books = max(0, summary.total_read_books - 1)

    # 새로운 상태 증가
    if new_s == "WISH":
        summary.total_wish_books += 1
    elif new_s == "READING":
        summary.total_reading_books += 1
    elif new_s in ["COMPLETED", "FINISHED", "READ"]:
        summary.total_read_books += 1

    # 터미널에서 즉시 확인 가능한 팩트 로그!
    print(f"📊 [트리거 계산 결과] WISH: {summary.total_wish_books}, READING: {summary.total_reading_books}, COMPLETED: {summary.total_read_books}")

    # ==========================================
    # 2. 장르 및 작가 통계 업데이트 (옵션 A)
    # ==========================================
    valid_preference_statuses = ["COMPLETED", "FINISHED", "READ", "READING", "WISH"]
    
    was_in_preference = old_s in valid_preference_statuses
    is_in_preference = new_s in valid_preference_statuses

    if was_in_preference != is_in_preference:
        count_change = 1 if is_in_preference else -1
        
        primary_author = get_primary_author(author_name)
        genre_to_save = genre_name if genre_name else "기타"

        # 장르 
        genre = db.query(models.InsightGenre).filter_by(user_id=user_id, genre_name=genre_to_save).first()
        if not genre:
            genre = models.InsightGenre(user_id=user_id, genre_name=genre_to_save, read_count=0)
            db.add(genre)
        genre.read_count = max(0, (genre.read_count or 0) + count_change)

        # 작가
        author = db.query(models.InsightAuthor).filter_by(user_id=user_id, author_name=primary_author).first()
        if not author:
            author = models.InsightAuthor(user_id=user_id, author_name=primary_author, read_count=0)
            db.add(author)
        author.read_count = max(0, (author.read_count or 0) + count_change)

    # ==========================================
    # 3. 월별 독서 흐름 (완독일 때만)
    # ==========================================
    was_completed = old_s in ["COMPLETED", "FINISHED", "READ"]
    is_completed = new_s in ["COMPLETED", "FINISHED", "READ"]

    if not was_completed and is_completed and finish_date:
        monthly = db.query(models.InsightMonthly).filter_by(user_id=user_id, year=finish_date.year, month=finish_date.month).first()
        if not monthly:
            monthly = models.InsightMonthly(user_id=user_id, year=finish_date.year, month=finish_date.month, read_count=1)
            db.add(monthly)
        else:
            monthly.read_count = (monthly.read_count or 0) + 1

    elif was_completed and not is_completed and finish_date:
        monthly = db.query(models.InsightMonthly).filter_by(user_id=user_id, year=finish_date.year, month=finish_date.month).first()
        if monthly:
            monthly.read_count = max(0, (monthly.read_count or 0) - 1)