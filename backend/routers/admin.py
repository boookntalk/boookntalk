# 파일 경로: backend/routers/admin.py
# 역할 및 기능: 관리자(ADMIN) 전용 API 라우터입니다. 데이터 클렌징, 작가 병합, 장르 오답 노트 수집 및 기여자 프로필 사진 관리를 담당합니다.

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, File, UploadFile, Body, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel
from database import get_db, SessionLocal
from services.admin_service import run_cleansing_and_merge
from utils.genre_parser import reload_ai_model

# 외부 의존성 함수 임포트
from utils import download_and_update_cover
from utils.genre_parser import map_to_standard_genre
from utils.author_parser import parse_author_string
from services.trending_service import update_global_trending_authors
from services.external_api_service import update_external_book_cache

import os, httpx, subprocess, uuid, shutil, models, requests

# 💡 [핵심] 여기서 prefix를 "/api/admin"으로 고정해두면, 아래 API들에는 안 써도 자동으로 붙습니다!
router = APIRouter()

UPLOAD_DIR = "static/uploads/authors"

# ==========================================
# [스키마 정의]
# ==========================================
class MergeWorksRequest(BaseModel):
    target_work_id: int
    source_work_ids: list[int]

class UpdateBioRequest(BaseModel):
    user_email: str
    bio: str

def get_local_path(filename: str):
    """함수 기능: 기여자 프로필 저장용 로컬 물리 경로를 반환합니다."""
    return os.path.join(UPLOAD_DIR, filename)

@router.get("/health")
def admin_health_check():
    """관리자 라우터 연결 상태를 확인하는 헬스 체크 함수입니다."""
    return {"status": "ok", "message": "Admin router is fully functional"}


# ==========================================
# [1] 작품 데이터 대통합 스캐너 및 병합 API
# ==========================================
@router.get("/duplicate-works")
async def get_duplicate_works(db: Session = Depends(get_db)):
    duplicates = db.query(
        func.replace(models.Work.title, ' ', '').label('norm_title'),
        func.count(models.Work.id).label('cnt')
    ).group_by('norm_title').having(func.count(models.Work.id) > 1).all()

    duplicate_titles = [d.norm_title for d in duplicates]
    if not duplicate_titles: return []

    works = db.query(models.Work).filter(
        func.replace(models.Work.title, ' ', '').in_(duplicate_titles)
    ).order_by(models.Work.title).all()

    result_map = {}
    for w in works:
        norm_t = w.title.replace(' ', '')
        if norm_t not in result_map: result_map[norm_t] = []
        edition_count = db.query(models.Edition).filter(models.Edition.work_id == w.id).count()
        result_map[norm_t].append({
            "work_id": w.id, "title": w.title, "author": w.author, "edition_count": edition_count
        })

    return [{"normalized_title": k, "works": v} for k, v in result_map.items() if len(v) > 1]


@router.post("/merge-works")
async def merge_specific_works(req: MergeWorksRequest, db: Session = Depends(get_db)):
    try:
        target_id = req.target_work_id
        source_ids = [sid for sid in req.source_work_ids if sid != target_id]

        if not source_ids: raise HTTPException(status_code=400, detail="병합할 대상이 없습니다.")

        target_work = db.query(models.Work).filter(models.Work.id == target_id).first()
        if not target_work: raise HTTPException(status_code=404, detail="타겟 작품을 찾을 수 없습니다.")

        for source_id in source_ids:
            db.query(models.Edition).filter(models.Edition.work_id == source_id).update({"work_id": target_id})
            db.query(models.LongReview).filter(models.LongReview.work_id == source_id).update({"work_id": target_id})

            source_links = db.query(models.WorkContributor).filter(models.WorkContributor.work_id == source_id).all()
            for link in source_links:
                exists = db.query(models.WorkContributor).filter(
                    models.WorkContributor.work_id == target_id,
                    models.WorkContributor.contributor_id == link.contributor_id,
                    models.WorkContributor.role == link.role
                ).first()
                if exists: 
                    db.delete(link)
                else: 
                    link.work_id = target_id

            db.flush()
            db.query(models.Work).filter(models.Work.id == source_id).delete()

        db.commit()
        return {"status": "success", "message": f"작품 대통합 완료! ({target_id}번 작품으로 흡수되었습니다)"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"작품 병합 중 오류 발생: {str(e)}")


# ==========================================
# [2] 기존 관리자 시스템 API (정제, 동기화 등)
# ==========================================
@router.get("/sync-covers")
async def sync_existing_covers(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    editions_to_update = db.query(models.Edition).filter(
        models.Edition.cover_image.isnot(None),
        models.Edition.cover_image.like("http%"),
        ~models.Edition.cover_image.like("%localhost%"),
        ~models.Edition.cover_image.like("%/static/covers/%")
    ).all()

    count = 0
    for edition in editions_to_update:
        background_tasks.add_task(download_and_update_cover, edition.id, edition.cover_image, SessionLocal)
        count += 1

    return {"status": "success", "message": f"총 {count}권 다운로드 시작!", "target_editions": [ed.id for ed in editions_to_update]}


@router.get("/sync-authors")
async def sync_existing_authors(db: Session = Depends(get_db)):
    works = db.query(models.Work).all()
    updated_count = 0

    for work in works:
        if not work.author: continue
        db.query(models.WorkContributor).filter(models.WorkContributor.work_id == work.id).delete()
        
        parsed_authors = parse_author_string(work.author)
        for p_auth in parsed_authors:
            contributor = db.query(models.Contributor).filter(models.Contributor.name == p_auth['name']).first()
            if not contributor:
                contributor = models.Contributor(name=p_auth['name'], original_name=p_auth.get('original_name'))
                db.add(contributor)
                db.flush()
            elif p_auth.get('original_name') and not contributor.original_name:
                contributor.original_name = p_auth.get('original_name')
                db.flush()

            link = models.WorkContributor(work_id=work.id, contributor_id=contributor.id, role=p_auth['role'])
            db.add(link)

        updated_count += 1

    try:
        db.commit()
        return {"status": "success", "message": f"총 {updated_count}개 작품 데이터 정제 완료!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"정제 오류: {str(e)}")


@router.get("/cleanup-contributors")
async def cleanup_orphaned_contributors(db: Session = Depends(get_db)):
    active_ids = db.query(models.WorkContributor.contributor_id).distinct()
    deleted_count = db.query(models.Contributor).filter(models.Contributor.id.not_in(active_ids)).delete(synchronize_session=False)
    
    try:
        db.commit()
        return {"status": "success", "message": f"총 {deleted_count}개 찌꺼기 데이터 삭제 완료."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"청소 오류: {str(e)}")


@router.get("/merge-contributors")
async def merge_specific_contributors(target_id: int, source_ids: str, db: Session = Depends(get_db)):
    try:
        source_id_list = [int(x.strip()) for x in source_ids.split(",")]
        for source_id in source_id_list:
            if source_id == target_id: continue
            
            links = db.query(models.WorkContributor).filter(models.WorkContributor.contributor_id == source_id).all()
            for link in links:
                exists = db.query(models.WorkContributor).filter(
                    models.WorkContributor.work_id == link.work_id,
                    models.WorkContributor.contributor_id == target_id,
                    models.WorkContributor.role == link.role
                ).first()

                if exists: db.delete(link)
                else: link.contributor_id = target_id
            
            source_contributor = db.query(models.Contributor).filter(models.Contributor.id == source_id).first()
            if source_contributor: db.delete(source_contributor)

        db.commit()
        return {"status": "success", "message": "작가 병합 완료!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sync-genres")
async def sync_existing_genres(db: Session = Depends(get_db)):
    works = db.query(models.Work).filter(models.Work.category == "기타").all()
    updated_count = 0
    aladin_key = os.getenv("ALADIN_TTB_KEY", "")
    if not aladin_key: return {"status": "error", "message": "API 키 부재."}

    async with httpx.AsyncClient() as client:
        for work in works:
            edition = db.query(models.Edition).filter(models.Edition.work_id == work.id).first()
            if not edition or not edition.isbn: continue
            
            raw_kdc = edition.kdc_code or ""
            new_cat = "기타"
            if raw_kdc: new_cat = map_to_standard_genre(kdc_code=raw_kdc, naver_category="")
            
            if new_cat == "기타":
                clean_isbn = edition.isbn.replace("-", "").strip()
                aladin_url = f"http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey={aladin_key}&itemIdType=ISBN&ItemId={clean_isbn}&output=js&Version=20131101"
                try:
                    res = await client.get(aladin_url, timeout=5.0)
                    if res.status_code == 200:
                        data = res.json()
                        items = data.get("item", [])
                        if items:
                            new_cat = map_to_standard_genre(kdc_code=raw_kdc, naver_category=items[0].get("categoryName", ""))
                except Exception as e:
                    print(f"⚠️ API 에러: {e}")
            
            if new_cat != "기타":
                work.category = new_cat
                updated_count += 1
                db.commit()

    return {"status": "success", "message": f"총 {updated_count}개 작품 장르 복구 완료."}


@router.post("/retrain-ai")
async def retrain_ai_model(user_email: str):
    if not user_email.startswith("boookntalk"):
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    try:
        subprocess.run(["python", "utils/train_model.py"], check=True)
        from utils.genre_parser import reload_ai_model
        reload_ai_model()
        return {"status": "success", "message": "AI 재학습 완료!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/refresh-trending")
async def refresh_trending_authors_manual(db: Session = Depends(get_db)):
    result = update_global_trending_authors(db)
    return result


@router.get("/master-cleanup")
async def execute_master_cleanup(db: Session = Depends(get_db)):
    works = db.query(models.Work).all()
    for work in works:
        if not work.author: continue
        parsed = parse_author_string(work.author)
        if not parsed: continue
        
        main_authors = [p['name'] for p in parsed if p['role'] == 'AUTHOR']
        work.author = ", ".join(main_authors) if main_authors else parsed[0]['name']
        
        db.query(models.WorkContributor).filter(models.WorkContributor.work_id == work.id).delete()
        for p_auth in parsed:
            contributor = db.query(models.Contributor).filter(models.Contributor.name == p_auth['name']).first()
            if not contributor:
                contributor = models.Contributor(name=p_auth['name'], original_name=p_auth.get('original_name'))
                db.add(contributor)
                db.flush()
            
            link = models.WorkContributor(work_id=work.id, contributor_id=contributor.id, role=p_auth['role'])
            db.add(link)
            
    db.commit()
    active_ids = db.query(models.WorkContributor.contributor_id).distinct()
    db.query(models.Contributor).filter(models.Contributor.id.not_in(active_ids)).delete(synchronize_session=False)
    db.commit()
    update_global_trending_authors(db)
    
    return {"status": "success", "message": "마스터 클린업 완료!"}


@router.post("/refresh-discovery")
def refresh_discovery_data(db: Session = Depends(get_db)):
    success = update_external_book_cache(db)
    if success: return {"message": "성공적으로 갱신되었습니다."}
    raise HTTPException(status_code=500, detail="데이터 수집 실패.")


# ==========================================
# 🚀 [3] 기여자(Contributor) 통합 관리 및 상세 페이지 업로드 API (신규 추가)
# ==========================================

# 1. 전체 기여자 조회 및 검색 API (마이페이지 관리자 탭용)
@router.get("/contributors/search")
async def search_contributors(
    db: Session = Depends(get_db),
    q: str = Query(None),
    has_photo: bool = Query(None)
):
    """함수 기능: 기여자 리스트를 검색하며, 로컬/외부 사진 유무에 따른 필터링을 제공합니다."""
    query = db.query(models.Contributor)
    
    if q:
        query = query.filter(or_(
            models.Contributor.name.ilike(f"%{q}%"),
            models.Contributor.original_name.ilike(f"%{q}%")
        ))
    
    if has_photo is not None:
        if has_photo:
            query = query.filter(models.Contributor.profile_image.ilike("/static%"))
        else:
            query = query.filter(or_(
                models.Contributor.profile_image == None,
                models.Contributor.profile_image == "",
                models.Contributor.profile_image.ilike("http%")
            ))

    contributors = query.order_by(models.Contributor.id.desc()).limit(100).all()
    return contributors

# 2. 도서 상세 페이지 사진 클릭 즉시 업로드 API
@router.post("/contributors/{contributor_id}/upload-image")
async def upload_contributor_image(
    contributor_id: int, 
    user_email: str = Form(...), 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    """상세페이지에서 기여자 사진을 직접 업로드 시 로컬에 저장하고 DB를 갱신합니다."""
    if not user_email.startswith("boookntalk"):
        raise HTTPException(status_code=403, detail="최고 관리자 권한이 없습니다.")

    contributor = db.query(models.Contributor).filter(models.Contributor.id == contributor_id).first()
    if not contributor:
        raise HTTPException(status_code=404, detail="기여자를 찾을 수 없습니다.")

    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    file_ext = os.path.splitext(file.filename)[1].lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = get_local_path(unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"/{UPLOAD_DIR}/{unique_filename}"
    contributor.profile_image = image_url
    db.commit()

    return {"status": "success", "url": image_url}

# 3. 외부 URL 로컬 동기화 API (도서 커버 방식과 동일)
@router.post("/contributors/{contributor_id}/sync-external")
async def sync_external_contributor_image(
    contributor_id: int,
    external_url: str = Form(...),
    user_email: str = Form(...),
    db: Session = Depends(get_db)
):
    """함수 기능: 외부 이미지 URL을 로컬 서버로 다운로드하여 영구 저장합니다."""
    if not user_email.startswith("boookntalk"):
        raise HTTPException(status_code=403, detail="최고 관리자 권한이 없습니다.")

    contributor = db.query(models.Contributor).filter(models.Contributor.id == contributor_id).first()
    if not contributor:
        raise HTTPException(status_code=404, detail="기여자를 찾을 수 없습니다.")

    try:
        response = requests.get(external_url, stream=True, timeout=15)
        if response.status_code != 200:
            raise Exception("외부 이미지를 불러올 수 없습니다.")

        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)
            
        ext = external_url.split('.')[-1].split('?')[0].lower() or 'jpg'
        filename = f"{uuid.uuid4()}.{ext}"
        file_path = get_local_path(filename)

        with open(file_path, "wb") as f:
            shutil.copyfileobj(response.raw, f)

        local_url = f"/{UPLOAD_DIR}/{filename}"
        contributor.profile_image = local_url
        db.commit()

        return {"status": "success", "url": local_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"동기화 오류: {str(e)}")
    
# ==========================================
# 🚀 [4] 기여자(Contributor) 상세 텍스트(Bio) 수정 API
# ==========================================
@router.patch("/contributors/{contributor_id}/bio")
async def update_contributor_bio(
    contributor_id: int, 
    req: UpdateBioRequest, 
    db: Session = Depends(get_db)
):
    """함수 기능: 관리자가 직접 작성/수정한 작가 상세 소개글을 DB에 업데이트합니다."""
    # 1. 최고 관리자 권한 철저히 검증
    if not req.user_email.startswith("boookntalk"):
        raise HTTPException(status_code=403, detail="최고 관리자 권한이 없습니다.")

    # 2. 타겟 작가 조회
    contributor = db.query(models.Contributor).filter(models.Contributor.id == contributor_id).first()
    if not contributor:
        raise HTTPException(status_code=404, detail="해당 작가를 찾을 수 없습니다.")

    # 3. 텍스트 업데이트 (빈 문자열이 올 경우도 허용)
    contributor.description = req.bio
    db.commit()

    return {"status": "success", "message": "작가 소개가 성공적으로 수정되었습니다."}