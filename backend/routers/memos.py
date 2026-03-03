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
    # 실제로는 ISBN으로 조회하고, 없으면 알라딘 API 등을 통해 DB에 자동 등록하는 로직이 권장됨
    # 여기서는 DB에 이미 책 정보가 있다고 가정
    edition = db.query(models.Edition).filter(models.Edition.isbn == memo_in.isbn).first()
    
    # [방어 로직] 책이 DB에 없으면 임시 에러 (실제 서비스에선 자동 생성 필요)
    if not edition:
        # (선택) 여기서 자동으로 책을 생성해 줄 수도 있습니다.
        raise HTTPException(status_code=404, detail="Book info not found. Please add the book first.")

    # 3. 서재(Record) 확인 및 자동 추가
    record = db.query(models.Record).filter(
        models.Record.user_id == user.id,
        models.Record.edition_id == edition.id
    ).first()

    if not record:
        # 서재에 없으면 '읽는 중' 상태로 자동 추가 (센스 있는 UX!)
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