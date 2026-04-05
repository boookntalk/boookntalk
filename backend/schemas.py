# 경로: backend/schemas.py
# 역할 및 기능: FastAPI에서 프론트엔드와 통신할 때 사용하는 API 데이터의 구조 검증 및 필터링(Pydantic 모델)을 담당합니다.

from typing import Optional
from pydantic import BaseModel

# 기능: 프론트엔드 메인 페이지의 '사색을 유발한 작가들' 영역에 전달할 작가 정보 규격을 정의합니다.
class TrendingAuthorResponse(BaseModel):
    contributor_id: int
    author_name: str
    author_profile_image: Optional[str] = None
    top_keyword: Optional[str] = None 
    mention_count: int = 0

    class Config:
        # SQLAlchemy 모델(DB 객체)을 Pydantic 모델(JSON)로 자동 변환하도록 허용합니다.
        from_attributes = True