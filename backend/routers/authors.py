# 파일 경로: backend/routers/authors.py
# 역할 및 기능: 작가 및 번역가 타임라인 데이터를 프론트엔드로 전달하는 API 엔드포인트입니다. DB 세션을 주입받아 서비스로 넘깁니다.

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db # 친구 프로젝트의 DB 세션 의존성 주입 함수
from services.author_service import get_author_timeline, get_user_contributors

router = APIRouter(prefix="/api/authors", tags=["Authors"])

@router.get("/writer/{author_name}/timeline")
async def get_writer_timeline(author_name: str, db: Session = Depends(get_db)):
    """
    기능: DB와 외부 API를 결합하여 특정 작가의 연도별 출간 도서를 반환합니다.
    """
    data = await get_author_timeline(author_name, role="writer", db=db)
    return data

@router.get("/translator/{translator_name}/timeline")
async def get_translator_timeline(translator_name: str, db: Session = Depends(get_db)):
    """
    기능: DB와 외부 API를 결합하여 특정 번역가의 연도별 출간 도서를 반환합니다.
    """
    data = await get_author_timeline(translator_name, role="translator", db=db)
    return data

# ▼ [NEW] 작가 목록 API
@router.get("/writer/list")
async def get_my_writers(user_id: int = 1, db: Session = Depends(get_db)):
    """기능: 내 서재의 작가 목록을 반환합니다."""
    data = await get_user_contributors(user_id, role="writer", db=db)
    return data

# ▼ [NEW] 번역가 목록 API
@router.get("/translator/list")
async def get_my_translators(user_id: int = 1, db: Session = Depends(get_db)):
    """기능: 내 서재의 번역가 목록을 반환합니다."""
    data = await get_user_contributors(user_id, role="translator", db=db)
    return data