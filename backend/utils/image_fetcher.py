# 경로: backend/utils/image_fetcher.py
# 역할 및 기능: 상업적 이용이 가능한 위키피디아(Wikimedia) API를 활용하여 작가의 프로필 이미지를 안전하게 검색하고 URL을 반환합니다.

import requests
from urllib.parse import quote

# 기능: 작가 이름을 위키피디아에서 검색하여, 해당 문서에 등록된 메인 이미지(주로 저작권 프리) URL을 가져옵니다.
def fetch_safe_author_image(author_name: str) -> str:
    try:
        # 1. 위키피디아 한국어 페이지에서 작가 검색
        search_url = f"https://ko.wikipedia.org/w/api.php?action=query&titles={quote(author_name)}&prop=pageimages&format=json&pithumbsize=500"
        response = requests.get(search_url, timeout=5)
        data = response.json()
        
        pages = data.get("query", {}).get("pages", {})
        for page_id, page_info in pages.items():
            if page_id != "-1" and "thumbnail" in page_info:
                # 2. 썸네일(이미지) URL이 존재하면 반환
                return page_info["thumbnail"]["source"]
                
    except Exception as e:
        print(f"Failed to fetch image for {author_name}: {e}")
        
    return None