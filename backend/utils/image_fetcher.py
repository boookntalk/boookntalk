# 경로: backend/utils/image_fetcher.py
# 역할 및 기능: 상업적 이용이 가능한 위키피디아 API를 활용하여 작가의 프로필 이미지를 안전하게 검색합니다.
# 위키미디어재단의 보안 정책을 준수하기 위해 User-Agent 신분증을 부착하여 차단을 방지합니다.

import requests
from urllib.parse import quote

# 기능: 작가 이름을 위키피디아에서 '검색'하여, 연관성 1위 문서의 메인 이미지 URL을 가져옵니다.
def fetch_safe_author_image(author_name: str) -> str:
    if not author_name or author_name in ["이름 없는 작가", "저자 미상"]:
        return None

    endpoints = [
        "https://ko.wikipedia.org/w/api.php",
        "https://en.wikipedia.org/w/api.php"
    ]
    
    # ▼▼▼ [핵심 수술] 위키피디아 서버 보안을 통과하기 위한 명함(User-Agent) 생성 ▼▼▼
    headers = {
        "User-Agent": "BoooknTalk/1.0 (https://github.com/bathespoir/boookntalk; contact@boookntalk.com) python-requests"
    }
    
    for endpoint in endpoints:
        try:
            search_url = f"{endpoint}?action=query&generator=search&gsrsearch={quote(author_name)}&gsrlimit=1&prop=pageimages&format=json&pithumbsize=500"
            
            # headers=headers 를 추가하여 신분증을 함께 제출합니다.
            response = requests.get(search_url, headers=headers, timeout=5)
            
            # 서버가 200(정상)을 주지 않으면, 에러 페이지를 JSON으로 파싱하려다 뻗지 않도록 즉시 건너뜁니다.
            if response.status_code != 200:
                continue
                
            data = response.json()
            
            pages = data.get("query", {}).get("pages", {})
            for page_id, page_info in pages.items():
                if page_id != "-1" and "thumbnail" in page_info:
                    print(f"📸 위키피디아 사진 수집 성공 ({endpoint}): {author_name}")
                    return page_info["thumbnail"]["source"]
                    
        except Exception as e:
            print(f"⚠️ 위키피디아 사진 수집 에러 ({endpoint} - {author_name}): {e}")
            continue
            
    return None