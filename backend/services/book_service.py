import httpx
import asyncio
from fastapi import HTTPException

ALADIN_API_KEY = "내_알라딘_TTB_키"
GOOGLE_BOOKS_API_KEY = "내_구글_API_키"

async def search_book_info(isbn: str):
    async with httpx.AsyncClient() as client:
        # 1. 알라딘과 구글 API를 동시에 호출 (병렬 처리로 속도 향상)
        aladin_url = f"http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey={ALADIN_API_KEY}&itemIdType=ISBN13&ItemId={isbn}&output=js&Version=20131101&OptResult=itemPage,FullSentence,bestSellerRank"
        google_url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&key={GOOGLE_BOOKS_API_KEY}"

        responses = await asyncio.gather(
            client.get(aladin_url),
            client.get(google_url)
        )

        aladin_data = responses[0].json()
        google_data = responses[1].json()

        # 데이터 검증 및 가공
        if not aladin_data.get('item'):
            raise HTTPException(status_code=404, detail="도서 정보를 찾을 수 없습니다.")

        item = aladin_data['item'][0]
        google_item = google_data.get('items', [{}])[0].get('volumeInfo', {})

        # 상용 서비스 boookntalk를 위한 통합 데이터 구조
        return {
            "title": item.get('title'),
            "author": item.get('author'),
            "publisher": item.get('publisher'),
            "pubDate": item.get('pubDate'),
            "description": item.get('description'),
            "isbn": item.get('isbn13'),
            "cover": item.get('cover'), # 고해상도 표지
            "pageCount": item.get('subInfo', {}).get('itemPage'), # 페이지 정보 (알라딘 특화)
            "previewLink": google_item.get('previewLink'), # 책 내용 미리보기 (구글 특화)
            "categories": google_item.get('categories', []),
        }