# 경로: backend/utils/bio_fetcher.py
import os
import re
import httpx
from urllib.parse import quote

NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")

async def fetch_author_bio_multi_tier(author_name: str) -> str:
    """위키피디아(유사도 검색) -> 네이버 지식백과 순으로 작가 소개를 찾습니다."""
    if not author_name or author_name in ["이름 없는 작가", "저자 미상"]:
        return ""

    # 작가명 정제 (예: "유발 하라리 (Yuval Noah Harari)" -> "유발 하라리")
    clean_name = author_name.split('(')[0].split(',')[0].strip()

    # 💡 [핵심 수정] titles= 정확도 매칭에서 gsrsearch= (검색 기반 매칭)으로 변경하여 히트율을 극대화합니다.
    wiki_endpoints = [
        f"https://ko.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch={quote(clean_name)}&gsrlimit=1&prop=extracts&exsentences=4&explaintext=1&format=json",
        f"https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch={quote(clean_name)}&gsrlimit=1&prop=extracts&exsentences=3&explaintext=1&format=json"
    ]

    headers = {
        "User-Agent": "BoooknTalk/1.0 (contact@boookntalk.com) python-httpx"
    }

    async with httpx.AsyncClient() as client:
        # [Tier 1] 위키피디아 검색 (한국어 -> 영어)
        for url in wiki_endpoints:
            try:
                res = await client.get(url, headers=headers, timeout=3.0)
                if res.status_code == 200:
                    data = res.json()
                    pages = data.get("query", {}).get("pages", {})
                    
                    # 검색 결과가 있으면 첫 번째 페이지의 요약본(extract)을 가져옴
                    for page_id, page_info in pages.items():
                        if page_id != "-1" and page_info.get("extract"):
                            extract = page_info["extract"].strip()
                            # '동음이의어' 안내 문서나 너무 짧은 글은 스킵
                            if len(extract) > 30 and "동음이의어" not in extract and "위키백과" not in extract:
                                print(f"📚 [Wiki Bio 획득 성공] {clean_name}")
                                return extract
            except Exception as e:
                print(f"⚠️ 위키피디아 텍스트 수집 에러 ({clean_name}): {e}")

        # [Tier 2] 네이버 지식백과 검색 (위키피디아 실패 시 국내 작가 타겟팅)
        if NAVER_CLIENT_ID and NAVER_CLIENT_SECRET:
            naver_url = f"https://openapi.naver.com/v1/search/encyc.json?query={quote(clean_name)}&display=1"
            naver_headers = {
                "X-Naver-Client-Id": NAVER_CLIENT_ID,
                "X-Naver-Client-Secret": NAVER_CLIENT_SECRET
            }
            try:
                res = await client.get(naver_url, headers=naver_headers, timeout=3.0)
                if res.status_code == 200:
                    items = res.json().get("items", [])
                    if items:
                        raw_desc = items[0].get("description", "")
                        # 네이버 특유의 <b> 강조 태그 제거
                        clean_desc = re.sub(r'<[^>]+>', '', raw_desc).strip()
                        if clean_desc and len(clean_desc) > 20:
                            print(f"📗 [Naver Bio 획득 성공] {clean_name}")
                            return clean_desc
            except Exception as e:
                print(f"⚠️ 네이버 지식백과 텍스트 수집 에러 ({clean_name}): {e}")

    # 모든 탐색 실패 시
    print(f"텅 [Bio 획득 실패] {clean_name}")
    return ""