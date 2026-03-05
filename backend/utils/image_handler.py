# backend/utils/image_handler.py

import os
import uuid
import httpx
from sqlalchemy.orm import Session
from models import Edition  # models.py 위치에 맞춰 수정 (예: from main import Edition)

# 저장할 폴더 경로 (없으면 자동 생성)
UPLOAD_DIR = "static/covers"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

async def download_and_update_cover(edition_id: int, image_url: str, db_session_factory):
    """
    외부 이미지 URL을 다운로드하여 로컬에 저장하고 DB를 업데이트합니다.
    """
    # 1. 유효성 검사: URL이 없거나 이미 로컬 경로인 경우 패스
    if not image_url or "static/covers" in image_url or "localhost" in image_url:
        print(f"⏭️ [Background] Image skipped (Already local or empty): {image_url}")
        return

    print(f"⬇️ [Background] Starting download for Edition {edition_id}: {image_url}")

    try:
        # [핵심 수정] 네이버 등 외부 차단을 피하기 위한 헤더 추가
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(image_url, headers=headers, timeout=10.0)
            
            if response.status_code == 200:
                # 2. 파일명 생성 (확장자 추출 시도, 실패시 jpg)
                ext = "jpg"
                if "." in image_url.split("/")[-1]:
                    possible_ext = image_url.split("/")[-1].split(".")[-1]
                    if len(possible_ext) <= 4: # jpeg, png 등
                        ext = possible_ext
                
                filename = f"{uuid.uuid4()}.{ext}"
                file_path = os.path.join(UPLOAD_DIR, filename)

                # 3. 로컬 저장
                with open(file_path, "wb") as f:
                    f.write(response.content)
                
                print(f"💾 [Background] File saved at: {file_path}")

                # 4. DB 업데이트 (새 세션 사용)
                with db_session_factory() as db:
                    edition = db.query(Edition).filter(Edition.id == edition_id).first()
                    if edition:
                        # 프론트엔드에서 접근 가능한 URL로 변경
                        local_url = f"http://localhost:8000/static/covers/{filename}"
                        edition.cover_image = local_url
                        db.commit()
                        print(f"✅ [Background] DB Updated: {local_url}")
            else:
                print(f"⚠️ [Background] Download failed. Status: {response.status_code}")

    except Exception as e:
        print(f"❌ [Background] Error processing image: {e}")