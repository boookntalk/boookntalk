# 파일 경로: backend/routers/admin.py
# 역할 및 기능: 관리자(ADMIN) 전용 API 라우터입니다. 데이터 클렌징, 작가 병합, 장르 오답 노트 수집 등의 시스템 핵심 관리 기능을 담당합니다.

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Body
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
import models
from database import get_db
from services.admin_service import run_cleansing_and_merge

import os
import subprocess
import uuid
import shutil
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
    
# ==========================================
# 1. 사진 누락 작가 리스트 조회 API
# ==========================================
@router.get("/authors/no-image")
def get_authors_without_image(db: Session = Depends(get_db)):
    """프로필 사진이 등록되지 않은 작가 리스트를 조회합니다."""
    
    # 💡 [핵심 방어막] 진짜 NULL, 빈 문자열(""), 가짜 "null" 텍스트까지 모조리 필터링
    authors = db.query(models.Contributor).filter(
        or_(
            models.Contributor.profile_image == None, 
            models.Contributor.profile_image == "",
            models.Contributor.profile_image == "null"
        )
    ).order_by(models.Contributor.name.asc()).limit(100).all()
    
    return authors

# ==========================================
# 2. 작가 프로필 사진 수동 업로드 API
# ==========================================
@router.post("/authors/{contributor_id}/upload-image")
def upload_author_image(
    contributor_id: int, 
    user_email: str = Body(...), # 프론트엔드의 FormData에서 이메일 추출
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    """특정 작가의 프로필 이미지를 수동으로 업로드하여 로컬에 저장하고 DB를 갱신합니다."""
    
    # 1. 최고 관리자 권한 검증
    if not user_email.startswith("boookntalk"):
        raise HTTPException(status_code=403, detail="최고 관리자 권한이 없습니다.")

    contributor = db.query(models.Contributor).filter(models.Contributor.id == contributor_id).first()
    if not contributor:
        raise HTTPException(status_code=404, detail="작가를 찾을 수 없습니다.")

    # 2. 로컬 저장소 폴더 확인 및 생성 (서버 루트 기준)
    upload_dir = "static/uploads/authors"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    # 3. 해킹 방지용 난수 파일명(UUID) 생성
    file_ext = os.path.splitext(file.filename)[1].lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    # 4. 물리적 파일 저장
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 5. 마스터 테이블 및 캐시 테이블 동시 업데이트
    # 프론트엔드에서 바로 읽을 수 있는 로컬 URL 생성
    image_url = f"http://localhost:8000/{upload_dir}/{unique_filename}"
    
    # 마스터 테이블 갱신
    contributor.profile_image = image_url
    
    # 사색 작가 랭킹 캐시 테이블 동기화 (화면에 즉시 반영하기 위함)
    db.query(models.GlobalTrendingAuthor).filter(
        models.GlobalTrendingAuthor.contributor_id == contributor_id
    ).update({"author_profile_image": image_url})
    
    db.commit()

    return {"status": "success", "url": image_url}