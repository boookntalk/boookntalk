import httpx
import asyncio
import os
from fastapi import HTTPException
from dotenv import load_dotenv

# 환경 변수 로드 (API 키 보안)
load_dotenv()

ALADIN_TTB_KEY = os.getenv("ALADIN_TTB_KEY")
GOOGLE_BOOKS_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY")

async def search_book_info(isbn: str):
    if not ALADIN_TTB_KEY or not GOOGLE_BOOKS_API_KEY:
        raise HTTPException(status_code=500, detail="Server Configuration Error: API Keys missing")

    async with httpx.AsyncClient() as client:
        # 1. API URL 준비
        aladin_url = f"http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey={ALADIN_TTB_KEY}&itemIdType=ISBN13&ItemId={isbn}&output=js&Version=20131101&OptResult=itemPage,fullSentence,originalTitle,bestSellerRank"
        google_url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&key={GOOGLE_BOOKS_API_KEY}"

        # 2. 병렬 호출 (속도 최적화)
        try:
            responses = await asyncio.gather(
                client.get(aladin_url, timeout=5.0),
                client.get(google_url, timeout=5.0),
                return_exceptions=True # 하나가 에러나도 멈추지 않음
            )
        except Exception as e:
            print(f"External API Error: {e}")
            raise HTTPException(status_code=503, detail="외부 도서 검색 서비스 연결 실패")

        # 3. 데이터 파싱 (에러 처리 포함)
        aladin_res = responses[0] if not isinstance(responses[0], Exception) else None
        google_res = responses[1] if not isinstance(responses[1], Exception) else None

        aladin_data = aladin_res.json() if aladin_res and aladin_res.status_code == 200 else {}
        google_data = google_res.json() if google_res and google_res.status_code == 200 else {}

        # 4. 데이터 추출 및 우선순위 결정
        # 알라딘 데이터가 한국 도서에는 더 정확하므로 우선 사용
        aladin_item = aladin_data.get('item', [{}])[0] if aladin_data.get('item') else {}
        
        # 구글 데이터 추출
        google_items = google_data.get('items', [])
        google_info = google_items[0].get('volumeInfo', {}) if google_items else {}

        # 제목이 없으면 검색 실패로 간주
        title = aladin_item.get('title') or google_info.get('title')
        if not title:
            raise HTTPException(status_code=404, detail="도서 정보를 찾을 수 없습니다.")

        # 5. [핵심] 고해상도 표지 로직
        # 구글 이미지가 있으면 고해상도 파라미터 조작, 없으면 알라딘 사용
        image_links = google_info.get('imageLinks', {})
        google_cover = (
            image_links.get('extraLarge') or 
            image_links.get('large') or 
            image_links.get('medium') or 
            image_links.get('thumbnail')
        )

        if google_cover:
            # http -> https 변환 및 zoom 파라미터 제거 (원본 화질 유도)
            final_cover = google_cover.replace("http://", "https://").replace("&zoom=1", "&zoom=0").replace("&edge=curl", "")
        else:
            final_cover = aladin_item.get('cover', "")

        # 6. 최종 데이터 병합 (BoooknTalk 표준 포맷)
        return {
            "title": title,
            "author": aladin_item.get('author') or ", ".join(google_info.get('authors', [])),
            "publisher": aladin_item.get('publisher') or google_info.get('publisher') or "출판사 미상",
            "pubDate": aladin_item.get('pubDate') or google_info.get('publishedDate') or "",
            "description": aladin_item.get('description') or google_info.get('description') or "",
            "isbn": isbn,
            "cover": final_cover,
            "pageCount": aladin_item.get('subInfo', {}).get('itemPage') or google_info.get('pageCount') or 0,
            "previewLink": google_info.get('previewLink') or "",
            "categoryName": aladin_item.get('categoryName') or "미분류", # DB 저장용
            "originalTitle": aladin_item.get('subInfo', {}).get('originalTitle') or ""
        }