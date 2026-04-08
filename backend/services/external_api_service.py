# 경로: services/external_api_service.py
# 역할 및 기능: 네이버 및 도서관 정보나루 API를 호출하여 데이터를 수집하고, BoooknTalk 내부 서재와 ISBN을 대조하여 캐싱하는 서비스

import os
import requests
from datetime import datetime
from sqlalchemy.orm import Session
from models import ExternalBookCache, Edition  # 💡 절대 경로 에러 방지를 위해 'backend.' 제거

# 환경변수 로드
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")
NARU_AUTH_KEY = os.getenv("NARU_AUTH_KEY")

# 기능: 네이버 도서 검색 API를 호출하여 '소설' 카테고리의 최신 출간 도서를 수집합니다.
def fetch_naver_new_releases(limit: int = 15):
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        print("🚨 네이버 API 키가 설정되지 않았습니다.")
        return []

    url = f"https://openapi.naver.com/v1/search/book.json?query=소설&display={limit}&sort=date"
    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        items = response.json().get("items", [])
        
        books = []
        for idx, item in enumerate(items):
            # 네이버 ISBN은 "10자리 13자리" 형태이므로 마지막 13자리만 추출
            raw_isbn = item.get("isbn", "")
            clean_isbn = raw_isbn.split()[-1] if raw_isbn else ""
            
            books.append({
                "category": "naver_new",
                "title": item.get("title", "").replace("<b>", "").replace("</b>", ""),
                "author": item.get("author", "").replace("^", ", "),
                "cover": item.get("image", ""),
                "isbn": clean_isbn,
                "rank": idx + 1
            })
        return books
    except Exception as e:
        print(f"네이버 API 호출 실패: {e}")
        return []

# 기능: 공공데이터포털 도서관 정보나루 API를 호출하여 전국 도서관 인기 대출 도서를 수집합니다.
def fetch_library_popular_books(limit: int = 15):
    if not NARU_AUTH_KEY:
        print("🚨 도서관 정보나루 API 키가 설정되지 않았습니다.")
        return []
    
    url = f"http://data4library.kr/api/loanItemSrch?authKey={NARU_AUTH_KEY}&format=json&pageSize={limit}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        docs = response.json().get("response", {}).get("docs", [])
        
        books = []
        for idx, doc in enumerate(docs):
            item = doc.get("doc", {})
            books.append({
                "category": "library_popular",
                "title": item.get("bookname", ""),
                "author": item.get("authors", ""),
                "cover": item.get("bookImageURL", ""),
                "isbn": item.get("isbn13", ""),
                "rank": idx + 1
            })
        return books
    except Exception as e:
        print(f"도서관 정보나루 API 호출 실패: {e}")
        return []

# 기능: 수집한 외부 API 도서 데이터를 내부 DB와 ISBN 대조 후, 캐시 테이블을 갱신합니다.
def update_external_book_cache(db: Session):
    naver_books = fetch_naver_new_releases(15)
    naru_books = fetch_library_popular_books(15)
    all_books = naver_books + naru_books
    
    if not all_books:
        return False
        
    # 💡 [핵심] 수집된 데이터의 ISBN을 모아서 내부 Edition 테이블과 한 번에 대조 (N+1 성능 최적화)
    isbns = [book["isbn"] for book in all_books if book["isbn"]]
    internal_editions = db.query(Edition.isbn, Edition.work_id).filter(Edition.isbn.in_(isbns)).all()
    isbn_to_work_id = {ed.isbn: ed.work_id for ed in internal_editions}
    
    # 기존 캐시 초기화
    db.query(ExternalBookCache).delete()
    
    # 새 데이터 및 내부 릴레이션 키(internal_work_id) 저장
    new_cache_records = [
        ExternalBookCache(
            category=book["category"],
            title=book["title"],
            author=book["author"],
            cover=book["cover"],
            isbn=book["isbn"],
            internal_work_id=isbn_to_work_id.get(book["isbn"]), # 서재에 있으면 work_id 세팅
            rank=book["rank"]
        )
        for book in all_books
    ]
    
    db.add_all(new_cache_records)
    db.commit()
    return True

# 기능: 메인 대시보드에서 호출할 수 있도록 카테고리별로 캐시된 데이터를 반환합니다.
def get_cached_external_books(db: Session, category: str):
    records = db.query(ExternalBookCache).filter(ExternalBookCache.category == category).order_by(ExternalBookCache.rank.asc()).all()
    return [{
        "title": r.title, 
        "author": r.author, 
        "cover": r.cover, 
        "isbn": r.isbn, 
        "internal_work_id": r.internal_work_id, 
        "rank": r.rank
    } for r in records]