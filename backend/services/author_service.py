# 파일 경로: backend/services/author_service.py
# 역할 및 기능: BoooknTalk DB에 등록된 작가/번역가의 도서 데이터를 우선 조회하고, DB에 없는 미등록 도서만 네이버 고급 검색 API(저자명)에서 가져와 타임라인 형태로 병합합니다.

import httpx
import os
import uuid
import re
from datetime import datetime
from collections import defaultdict
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from models import Contributor, WorkContributor, Work, Edition, Record
from sqlalchemy import func

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(env_path)

NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")

# =========================================================
# [BoooknTalk ISNI 생성 엔진]
# =========================================================

def generate_temp_isni() -> str:
    date_str = datetime.now().strftime("%Y%m%d")
    short_uuid = str(uuid.uuid4()).split('-')[0]
    return f"BKT-TEMP-{date_str}-{short_uuid}"

def get_or_create_contributor(db: Session, name: str, provided_isni: str = None):
    if provided_isni:
        contributor = db.query(Contributor).filter(Contributor.isni == provided_isni).first()
        if contributor:
            return contributor

    contributor = db.query(Contributor).filter(Contributor.name == name).first()
    
    if contributor:
        if not getattr(contributor, 'isni', None): 
            contributor.isni = provided_isni or generate_temp_isni()
            db.commit()
            db.refresh(contributor)
        return contributor

    final_isni = provided_isni or generate_temp_isni()
    
    new_contributor = Contributor(name=name, isni=final_isni)
    db.add(new_contributor)
    db.commit()
    db.refresh(new_contributor)
    
    print(f"✨ [신규 작가 등록] {name} (ISNI: {final_isni})")
    return new_contributor

# =========================================================
# [작가 타임라인 조회 (BoooknTalk + 네이버 API 연동)]
# =========================================================

async def get_author_timeline(name: str, role: str, db: Session):
    timeline_dict = defaultdict(list)
    db_isbns = set()

    # ---------------------------------------------------------
    # [STEP 1] BoooknTalk DB(광장) 우선 조회
    # ---------------------------------------------------------
    db_role = 'author' if role == "writer" else 'translator'

    db_results = db.query(Edition.isbn, Edition.publish_date, Work.title, Work.id.label('work_id')) \
        .select_from(Edition) \
        .join(Work, Edition.work_id == Work.id) \
        .join(WorkContributor, WorkContributor.work_id == Work.id) \
        .join(Contributor, WorkContributor.contributor_id == Contributor.id) \
        .filter(
            Contributor.name == name, 
            func.lower(WorkContributor.role) == db_role
        ).all()

    print(f"🟢 [DB 조회 완료] '{name}'의 광장 등록 도서 {len(db_results)}건 발견!")

    for row in db_results:
        isbn, pub_date, title, work_id = row
        if not isbn: continue
        
        clean_isbn = isbn.replace("-", "").strip()
        db_isbns.add(clean_isbn)

        year = str(pub_date.year) if pub_date else "알 수 없음"
        date_str = pub_date.strftime("%Y-%m-%d") if pub_date else "알 수 없음"

        timeline_dict[year].append({
            "id": str(work_id), 
            "title": title,
            "publish_date": date_str,
            "is_in_square": True, 
            "isbn": clean_isbn
        })

    # ---------------------------------------------------------
    # [STEP 2] 네이버 도서 고급 검색 API 조회 (타임라인 빈 공간 채우기)
    # ---------------------------------------------------------
    naver_url = "https://openapi.naver.com/v1/search/book.json" # 💡 고급검색(book_adv)에서 일반검색(book)으로 변경!
    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET
    }
    
    # 💡 [핵심] 깐깐한 d_auth 대신, query로 넓게 검색하여 띄어쓰기 달라도 일단 다 가져옵니다.
    params = {
        "query": name, 
        "display": 50,
        "sort": "date" 
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(naver_url, headers=headers, params=params, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                
                print(f"🟢 [API 조회 완료] 네이버 통합 검색에서 '{name}' 키워드로 도서 {len(items)}건 가져옴!")

                for item in items:
                    api_isbn_raw = item.get("isbn", "")
                    api_isbn = api_isbn_raw.split(" ")[-1] if " " in api_isbn_raw else api_isbn_raw
                    
                    author_str = item.get("author", "")
                    
                    # 💡 [방어막] 네이버가 강조용으로 넣는 <b> 태그를 지우고, 띄어쓰기 무시하고 이름이 포함되어 있는지 검사!
                    import re
                    clean_author_str = re.sub(r'<[^>]+>', '', author_str).replace(" ", "")
                    clean_name = name.replace(" ", "")
                    
                    # 검색어에 걸려 들어오긴 했지만, 실제 저자가 아닌 경우(예: 책 제목에 이름이 들어간 경우) 컷!
                    if clean_name not in clean_author_str:
                        continue

                    # DB에 없는 새로운 책일 경우에만 타임라인에 추가
                    if api_isbn and api_isbn not in db_isbns:
                        pubdate_raw = item.get("pubdate", "")
                        year = pubdate_raw[:4] if len(pubdate_raw) >= 4 else "알 수 없음"
                        
                        if len(pubdate_raw) == 8:
                            formatted_date = f"{pubdate_raw[:4]}-{pubdate_raw[4:6]}-{pubdate_raw[6:8]}"
                        else:
                            formatted_date = pubdate_raw

                        # 네이버 특유의 <b> 태그 제거 및 다권본 포맷팅 적용
                        raw_title = item.get("title", "")
                        clean_title = re.sub(r'<[^>]+>', '', raw_title).strip()

                        if "세트" in clean_title or "전집" in clean_title:
                            clean_title = clean_title.replace("세트", "").replace("전집", "").replace("()", "").strip()
                            if not clean_title.startswith("[세트]"):
                                clean_title = f"[세트] {clean_title}"

                        timeline_dict[year].append({
                            "id": f"api_{api_isbn}", 
                            "title": clean_title,
                            "publish_date": formatted_date,
                            "is_in_square": False, 
                            "isbn": api_isbn
                        })
            else:
                print(f"🔴 [API 에러]: 네이버 API가 {response.status_code}를 반환했습니다.")
        except Exception as e:
            print(f"🔴 [통신 에러]: 네이버 연결 실패. ({e})")

    # ---------------------------------------------------------
    # [STEP 3] 데이터 병합 및 연도별 정렬
    # ---------------------------------------------------------
    result = [
        {"year": year, "books": books}
        for year, books in sorted(timeline_dict.items(), key=lambda x: x[0], reverse=True)
    ]

    return result

# =========================================================
# [내 서재 등록 작가 통계 조회]
# =========================================================

async def get_user_contributors(user_id: int, role: str, db: Session):
    """
    기능: 특정 유저의 서재(Record)를 뒤져서, 등록된 책들의 작가나 번역가 목록을 완독 권수와 함께 반환합니다.
    """
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
         func.lower(WorkContributor.role) == db_role 
     ) \
     .group_by(Contributor.id, Contributor.name) \
     .order_by(func.count(Record.id).desc()) \
     .all()

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