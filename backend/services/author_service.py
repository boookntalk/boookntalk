# 파일 경로: backend/services/author_service.py
# 역할 및 기능: BoooknTalk DB에 등록된 작가/번역가의 도서 데이터를 우선 조회하고, DB에 없는 미등록 도서만 알라딘 API에서 가져와 타임라인 형태로 병합합니다.

import httpx
import os
from collections import defaultdict
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from models import Contributor, WorkContributor, Work, Edition, Record
from sqlalchemy import func
import uuid
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(env_path)

# 함수 기능: 내부 DB(광장)를 우선 훑고, 미등록 도서만 알라딘 도서 검색 API(ItemSearch)를 통해 가져와 연도별로 병합하여 반환합니다.
async def get_author_timeline(name: str, role: str, db: Session):
    timeline_dict = defaultdict(list)
    db_isbns = set()

    # =========================================================
    # [STEP 1] BoooknTalk DB(광장) 우선 조회
    # =========================================================
    db_role = 'author' if role == "writer" else 'translator'

    db_results = db.query(Edition.isbn, Edition.publish_date, Work.title, Work.id.label('work_id')) \
        .select_from(Edition) \
        .join(Work, Edition.work_id == Work.id) \
        .join(WorkContributor, WorkContributor.work_id == Work.id) \
        .join(Contributor, WorkContributor.contributor_id == Contributor.id) \
        .filter(
            Contributor.name == name, 
            func.lower(WorkContributor.role) == db_role  # 💡 핵심: DB 값을 소문자로 변환 후 비교!
        ).all()

    print(f"🟢 [DB 조회 완료] '{name}'의 광장 등록 도서 {len(db_results)}건 발견!")

    for row in db_results:
        isbn, pub_date, title, work_id = row
        if not isbn: continue
        
        clean_isbn = isbn.split(" ")[-1] if " " in isbn else isbn
        db_isbns.add(clean_isbn)

        year = str(pub_date.year) if pub_date else "알 수 없음"
        date_str = pub_date.strftime("%Y-%m-%d") if pub_date else "알 수 없음"

        timeline_dict[year].append({
            "id": work_id, 
            "title": title,
            "publish_date": date_str,
            "is_in_square": True, 
            "isbn": clean_isbn
        })

    # =========================================================
    # [STEP 2] 알라딘 API 조회 (미등록 도서 채우기)
    # =========================================================
    aladin_url = "http://www.aladin.co.kr/ttb/api/ItemSearch.aspx"
    aladin_key = os.getenv("ALADIN_TTB_KEY", "")

    params = {
        "ttbkey": aladin_key,
        "Query": name,
        "QueryType": "Author", # 작가/번역가 이름으로 직접 검색
        "MaxResults": 50,
        "start": 1,
        "SearchTarget": "Book",
        "output": "js", # JSON 형식으로 받기
        "Version": "20131101",
        "Sort": "PublishTime" # 최신 출간일 순
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(aladin_url, params=params)
            if response.status_code == 200:
                data = response.json()
                items = data.get("item", [])
                
                print(f"🟢 [API 조회 완료] 알라딘에서 '{name}'의 도서 {len(items)}건 가져옴!")

                for idx, item in enumerate(items):
                    api_isbn = item.get("isbn13", "")
                    author_str = item.get("author", "")
                    
                    # 역할에 따른 필터링 (알라딘은 지은이, 옮긴이가 한 줄로 들어옴)
                    if role == "writer" and "지은이" not in author_str and "저자" not in author_str:
                        # 완벽한 필터링을 위해 지은이가 아니면 패스 (옵션)
                        pass 
                    if role == "translator" and "옮긴이" not in author_str and "역자" not in author_str:
                        pass

                    if api_isbn and api_isbn not in db_isbns:
                        # 알라딘 pubDate 포맷은 "YYYY-MM-DD"
                        pubdate = item.get("pubDate", "")
                        year = pubdate.split("-")[0] if "-" in pubdate else "알 수 없음"
                        
                        timeline_dict[year].append({
                            "id": f"api_{api_isbn}", 
                            "title": item.get("title", ""),
                            "publish_date": pubdate,
                            "is_in_square": False, 
                            "isbn": api_isbn
                        })
            else:
                print(f"🔴 [API 에러]: 알라딘 API가 {response.status_code}를 반환했습니다.")
        except Exception as e:
            print(f"🔴 [통신 에러]: 알라딘 연결 실패. ({e})")

    # =========================================================
    # [STEP 3] 데이터 병합 및 연도별 정렬
    # =========================================================
    result = [
        {"year": year, "books": books}
        for year, books in sorted(timeline_dict.items(), key=lambda x: x[0], reverse=True)
    ]

    return result

# ▼ [NEW] 내 서재에 등록된 작가/번역가 목록과 완독 권수 추출 함수
async def get_user_contributors(user_id: int, role: str, db: Session):
    """
    기능: 특정 유저의 서재(Record)를 뒤져서, 등록된 책들의 작가나 번역가 목록을 완독 권수와 함께 반환합니다.
    """
    # ▼ [수정] 무조건 소문자로 기준을 잡습니다.
    db_role = 'author' if role == "writer" else 'translator'

    results = db.query(
        Contributor.id,
        Contributor.name,
        func.count(Record.id).label('read_count')
    ).select_from(Record) \
     .join(Edition, Record.edition_id == Edition.id) \
     .join(Work, Edition.work_id == Work.id) \
     .join(WorkContributor, Work.id == WorkContributor.work_id) \
     .join(Contributor, WorkContributor.contributor_id == Contributor.id) \
     .filter(
         Record.user_id == user_id, 
         func.lower(WorkContributor.role) == db_role  # 💡 핵심: DB 값을 소문자로 변환 후 비교!
     ) \
     .group_by(Contributor.id, Contributor.name) \
     .order_by(func.count(Record.id).desc()) \
     .all()

    # 프론트엔드 리스트 UI 규격에 맞게 변환
    author_list = [
        {
            "id": row.id, 
            "name": row.name, 
            "read_count": row.read_count
        }
        for row in results
    ]

    print(f"🟢 [DB 조회 완료] 유저 {user_id}의 서재에서 {role} {len(author_list)}명 발견!")
    return author_list

# =========================================================
# [BoooknTalk ISNI 생성 엔진]
# =========================================================

# 함수 기능: ISNI가 없는 작가를 위해 BoooknTalk 전용 임시 코드를 생성합니다.
def generate_temp_isni() -> str:
    date_str = datetime.now().strftime("%Y%m%d")
    short_uuid = str(uuid.uuid4()).split('-')[0]
    return f"BKT-TEMP-{date_str}-{short_uuid}"

# 함수 기능: ISNI를 기반으로 작가를 찾고, 없으면 DB에 안전하게 새로 등록합니다.
def get_or_create_contributor(db: Session, name: str, provided_isni: str = None):
    # 1. 진짜 ISNI가 제공된 경우: 가장 정확한 식별자(ISNI)로 우선 검색
    if provided_isni:
        contributor = db.query(Contributor).filter(Contributor.isni == provided_isni).first()
        if contributor:
            return contributor

    # 2. ISNI가 없거나 검색되지 않은 경우: 이름으로 검색 (기존 데이터 호환)
    contributor = db.query(Contributor).filter(Contributor.name == name).first()
    
    if contributor:
        # 기존 작가인데 DB에 isni가 비어있다면 임시 코드를 발급해서 업데이트
        if not getattr(contributor, 'isni', None): 
            contributor.isni = provided_isni or generate_temp_isni()
            db.commit()
            db.refresh(contributor)
        return contributor

    # 3. DB에 아예 존재하지 않는 완전 신규 작가인 경우: 새로 생성
    final_isni = provided_isni or generate_temp_isni()
    
    new_contributor = Contributor(name=name, isni=final_isni)
    db.add(new_contributor)
    db.commit()
    db.refresh(new_contributor)
    
    print(f"✨ [신규 작가 등록] {name} (ISNI: {final_isni})")
    
    return new_contributor