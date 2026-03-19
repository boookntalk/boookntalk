from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/memos", tags=["memos"])

# [요청 모델] 프론트엔드에서 보내는 데이터 구조
class MemoCreate(BaseModel):
    isbn: str
    user_email: str
    sentence: str
    thought: Optional[str] = None
    page_number: Optional[int] = None
    is_public: bool = True

@router.post("")
def create_memo(memo_in: MemoCreate, db: Session = Depends(get_db)):
    # 1. 유저 조회
    user = db.query(models.User).filter(models.User.email == memo_in.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. 책 정보 조회 (Edition)
    edition = db.query(models.Edition).filter(models.Edition.isbn == memo_in.isbn).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Book info not found. Please add the book first.")

    # 3. 서재(Record) 확인 및 자동 추가
    record = db.query(models.Record).filter(
        models.Record.user_id == user.id,
        models.Record.edition_id == edition.id
    ).first()

    if not record:
        record = models.Record(
            user_id=user.id,
            edition_id=edition.id,
            status="READING"
        )
        db.add(record)
        db.commit()
        db.refresh(record)

    # 4. 메모(사색) 저장
    new_memo = models.Memo(
        user_id=user.id,
        record_id=record.id,
        work_id=edition.work_id,
        sentence=memo_in.sentence,
        thought=memo_in.thought,
        page_number=memo_in.page_number,
        is_public=memo_in.is_public
    )
    
    db.add(new_memo)
    db.commit()
    db.refresh(new_memo)
    
    return {"status": "success", "memo_id": new_memo.id}

# ▼▼▼ [NEW] 프론트엔드 화면을 위한 '내 기록 모아보기' API 추가 ▼▼▼
@router.get("/user/{email}")
def get_user_memos(email: str, db: Session = Depends(get_db)):
    # 1. 유저 조회
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. 유저의 메모와 관련된 책 정보(Edition, Work)를 한 번에 조인(Join)하여 가져옵니다.
    memos = db.query(
        models.Memo, 
        models.Record, 
        models.Edition, 
        models.Work
    ).join(
        models.Record, models.Memo.record_id == models.Record.id
    ).join(
        models.Edition, models.Record.edition_id == models.Edition.id
    ).join(
        models.Work, models.Edition.work_id == models.Work.id
    ).filter(
        models.Memo.user_id == user.id
    ).order_by(models.Memo.created_at.desc()).all()

    results = []
    for memo, record, edition, work in memos:
        # 프론트엔드 UI에 예쁘게 보이도록 발췌문(sentence)과 사색(thought)을 조합
        content_parts = []
        if memo.sentence:
            content_parts.append(f"❝ {memo.sentence} ❞") # 인용구 스타일 적용
        if memo.thought:
            content_parts.append(memo.thought)
            
        combined_content = "\n\n".join(content_parts)

        # 프론트엔드가 요구하는 JSON 규격에 정확히 맞춤
        results.append({
            "id": memo.id,
            "library_id": record.id,  # 클릭 시 서재 상세 페이지로 이동하기 위한 키
            "book_cover": edition.cover_image,
            "book_title": work.title,
            "book_author": work.author,
            "content": combined_content,
            "tags": [], # 태그 기능 확장을 대비한 빈 배열
            "created_at": memo.created_at.isoformat() if memo.created_at else ""
        })

    return results