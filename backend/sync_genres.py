# 파일 경로: backend/sync_genres.py
# 역할 및 기능: BoooknTalk DB(Work 테이블)에 기존 등록된 도서들의 카테고리를 기획자가 정의한 표준 대분류 장르로 일괄 세탁(업데이트)합니다.

import os
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# ==========================================
# [팩트 체크] database.py가 import 되기 전에 .env.local을 찾아 강제로 주입합니다.
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

"""
map_to_standard_genre 함수
기능: KDC 코드(숫자)와 기존 카테고리(텍스트)를 분석하여 기획자가 정의한 BoooknTalk 표준 대분류 장르 문자열을 반환합니다.
"""
def map_to_standard_genre(kdc_code: str, raw_category: str = "") -> str:
    # 1. KDC 코드 기반 매핑 (가장 정확한 도서관 표준)
    if kdc_code:
        kdc_str = str(kdc_code).strip()
        kdc_prefix = kdc_str[:1]
        
        if kdc_prefix == '8':
            if kdc_str.startswith(('814', '824', '834', '844', '804')):
                return "에세이 / 논픽션"
            return "문학 / 소설"
        elif kdc_prefix in ['1', '2', '9']:
            return "인문 / 사회 / 철학"
        elif kdc_prefix == '3':
            if kdc_str.startswith('32'): return "경제 / 경영"
            if kdc_str.startswith(('37', '36')): return "학술 / 전문서"
            return "인문 / 사회 / 철학"
        elif kdc_prefix in ['4', '5']:
            return "과학 / IT / 공학"
        elif kdc_prefix == '6':
            return "실용 / 취미 / 예술"
        elif kdc_prefix == '7':
            return "학술 / 전문서"
        elif kdc_prefix == '0':
            return "기타"

    # 2. 텍스트 카테고리 기반 매핑 (KDC 코드가 없는 네이버/알라딘 등 외부 데이터용 Fallback)
    if raw_category:
        cat_str = str(raw_category).lower()
        if any(x in cat_str for x in ['소설', '시', '희곡', '문학']): return "문학 / 소설"
        if any(x in cat_str for x in ['에세이', '수필', '산문', '전기', '르포']): return "에세이 / 논픽션"
        if any(x in cat_str for x in ['인문', '철학', '역사', '사회', '정치']): return "인문 / 사회 / 철학"
        if any(x in cat_str for x in ['경제', '경영', '재테크', '투자']): return "경제 / 경영"
        if any(x in cat_str for x in ['과학', 'it', '컴퓨터', '공학', '의학']): return "과학 / IT / 공학"
        if any(x in cat_str for x in ['실용', '취미', '예술', '여행', '요리', '건강', '레저']): return "실용 / 취미 / 예술"
        if any(x in cat_str for x in ['아동', '유아', '청소년', '그림책', '동화']): return "아동 / 청소년"
        if any(x in cat_str for x in ['만화', '웹툰', '그래픽노블']): return "만화 / 그래픽노블"
        if any(x in cat_str for x in ['학습', '교재', '전공', '수험서', '사전', '법학', '교육']): return "학술 / 전문서"

    return "기타"

"""
sync_all_genres 함수
기능: DB에 저장된 모든 Work 데이터의 카테고리를 표준 장르로 마이그레이션 합니다.
"""
def sync_all_genres(db: Session):
    print("\n========================================")
    print(f"🔌 타겟 DB 호스트: {os.getenv('host')}")
    print("🧹 [BoooknTalk] 장르 대청소 작업을 시작합니다...")
    print("========================================\n")

    # DB에 있는 모든 책(Work) 데이터를 불러옵니다.
    works = db.query(models.Work).all()
    updated_count = 0

    for work in works:
        original_category = work.category or ""
        
        # 해당 Work에 연결된 Edition 중 kdc_code가 있는 것을 찾습니다.
        edition = db.query(models.Edition).filter(
            models.Edition.work_id == work.id, 
            models.Edition.kdc_code.isnot(None),
            models.Edition.kdc_code != ""
        ).first()
        
        kdc_code = edition.kdc_code if edition else ""

        # 정제기 가동!
        new_standard_genre = map_to_standard_genre(kdc_code, original_category)

        # 기존 카테고리와 다르면 업데이트 쳐줍니다.
        if original_category != new_standard_genre:
            print(f"🔄 [업데이트] '{work.title}' : [{original_category}] ➡️ [{new_standard_genre}]")
            work.category = new_standard_genre
            updated_count += 1

    # 최종 DB 반영
    db.commit()
    print("\n========================================")
    print(f"✨ 대청소 완료! 총 {updated_count}권의 도서 장르가 완벽하게 세탁되었습니다.")
    print("========================================")

if __name__ == "__main__":
    db_session = SessionLocal()
    try:
        sync_all_genres(db_session)
    finally:
        db_session.close()