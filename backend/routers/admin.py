# 파일 경로: backend/routers/admin.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from services.admin_service import run_cleansing_and_merge

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.post("/cleanse-authors")
async def cleanse_authors_api(db: Session = Depends(get_db)):
    return await run_cleansing_and_merge(db)