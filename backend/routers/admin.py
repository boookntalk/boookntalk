# 파일 경로: backend/routers/admin.py
# 역할 및 기능: 관리자(ADMIN) 전용 API 라우터입니다. 데이터 클렌징, 작가 병합, 장르 오답 노트 수집 등의 시스템 핵심 관리 기능을 담당합니다.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models
from database import get_db
from services.admin_service import run_cleansing_and_merge

import os
import subprocess
from utils.genre_parser import reload_ai_model

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ==========================================
# [기존 1] 오염 데이터 딥 클렌징 및 병합
# ==========================================
@router.post("/cleanse-authors")
async def cleanse_authors_api(db: Session = Depends(get_db)):
    """
    기능: 오염된 작가 꼬리표를 제거하고, 파편화된 작가 데이터를 하나로 강제 병합하는 딥 클렌징 수술을 실행합니다.
    """
    return await run_cleansing_and_merge(db)


# ==========================================
# ▼▼▼ [NEW 2] 장르 오답 노트 수집 및 업데이트 (Upsert) ▼▼▼
# ==========================================

# 클라이언트로부터 받을 장르 교정 데이터 스키마
class GenreCorrectionRequest(BaseModel):
    raw_keyword: str
    standard_genre: str

@router.post("/genre-correction")
async def save_genre_correction(req: GenreCorrectionRequest, db: Session = Depends(get_db)):
    """
    기능: 전달받은 외부 원본 장르 텍스트와 관리자가 수동 교정한 BoooknTalk 8대 표준 장르를 DB(genre_training_data)에 저장합니다. 동일한 원본 텍스트가 이미 존재할 경우, 새로운 정답 장르로 덮어씌우는 Upsert 처리를 수행합니다.
    """
    # 1. DB에 해당 원본 텍스트(raw_keyword)가 이미 존재하는지 검색
    existing_data = db.query(models.GenreTrainingData).filter(
        models.GenreTrainingData.raw_keyword == req.raw_keyword
    ).first()

    if existing_data:
        # 2. 이미 존재하는 데이터라면 새로운 표준 장르로 업데이트 (Update)
        existing_data.standard_genre = req.standard_genre
        db.commit()
        return {
            "status": "success", 
            "message": f"기존 오답 노트가 업데이트되었습니다: '{req.raw_keyword}' ➡️ '{req.standard_genre}'"
        }
    else:
        # 3. 처음 보는 텍스트라면 오답 노트에 새롭게 추가 (Insert)
        new_correction = models.GenreTrainingData(
            raw_keyword=req.raw_keyword,
            standard_genre=req.standard_genre
        )
        db.add(new_correction)
        db.commit()
        return {
            "status": "success", 
            "message": f"새로운 오답 데이터가 저장되었습니다: '{req.raw_keyword}' ➡️ '{req.standard_genre}'"
        }
        
@router.post("/retrain-ai")
async def trigger_retrain_ai(user_email: str):
    """
    기능: 마이페이지의 시스템 관리자 패널(AdminPanel)에서 호출 시, 백그라운드에서 train_model.py를 실행하여 AI를 재학습시키고 메모리에 즉각 반영합니다.
    """
    try:
        # 1. 파이썬 스크립트의 절대 경로를 안전하게 추적
        current_dir = os.path.dirname(os.path.abspath(__file__))
        script_path = os.path.join(current_dir, "..", "utils", "train_model.py")
        
        # 2. 서브프로세스로 학습 스크립트 자동 실행 (터미널에서 엔터 치는 것과 동일한 효과)
        subprocess.run(["python", script_path], check=True)
        
        # 3. 새로 구워진 뇌로 무중단 교체 (Hot Reload)
        reload_ai_model()
        
        return {
            "status": "success", 
            "message": "BoooknTalk AI 엔진이 누적된 오답 노트를 바탕으로 새롭게 진화했습니다! 🚀"
        }
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"AI 학습 스크립트 실행 실패: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 재학습 중 알 수 없는 오류 발생: {str(e)}")