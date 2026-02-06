from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# 1. 사용자 (Users) - OAuth 및 프로 버전 대응
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True) # OAuth 필수
    nickname = Column(String(255))
    profile_image = Column(String(1024)) # 구글 프로필 이미지 URL 저장 (추가됨)
    
    is_premium = Column(Boolean, default=False) # 프로 버전 멤버십 여부
    subscription_end_date = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 관계 정의
    records = relationship("Record", back_populates="user")
    memos = relationship("Memo", back_populates="user")

# 2. 원천 작품 (Works) - 책의 고유 정보 (작가, 제목 등)
class Work(Base):
    __tablename__ = "works"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(512), index=True) # 스키마엔 없었지만 필수 필드라 추가
    author = Column(String(255), index=True)
    description = Column(Text)
    category = Column(String(100)) # 장르/카테고리
    
    # 관계: 하나의 작품은 여러 판본(Edition)을 가짐
    editions = relationship("Edition", back_populates="work")

# 3. 판본 (Editions) - 출판사별/연도별 구체적인 책
class Edition(Base):
    __tablename__ = "editions"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"))
    
    isbn = Column(String(20), unique=True, index=True)
    publisher = Column(String(255))
    publish_date = Column(DateTime)
    page_count = Column(Integer)
    cover_image = Column(String(1024)) # 표지 이미지
    is_bnt_isbn = Column(Boolean, default=False) # ISBN 없는 독립출판물 등

    work = relationship("Work", back_populates="editions")

# 4. 기록 (Record) - 핵심 기능: 독서 세션 (구 user_library)
class Record(Base):
    __tablename__ = "user_library" # DB 테이블명 유지

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    edition_id = Column(Integer, ForeignKey("editions.id"))

    status = Column(String(50), default="READING") # 읽는 중, 완독, 중단 (추가됨)
    rating = Column(Float, default=0.0)
    short_review = Column(String(200)) # 한줄평
    
    start_date = Column(DateTime, nullable=True)
    finish_date = Column(DateTime, nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    # 관계
    user = relationship("User", back_populates="records")
    edition = relationship("Edition")
    
    # Memo와의 관계 (Record에 종속된 메모들)
    memos = relationship("Memo", back_populates="record")

# 5. 메모 (Memo) - 구 posts (문장 수집 및 생각)
class Memo(Base):
    __tablename__ = "posts" # DB 테이블명 유지

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # 기획 변경 제안: Memo는 Work가 아니라 특정 'Record(독서세션)'에 연결되는 것이 자연스러움
    # 기존: work_id -> 변경: record_id (하위 호환을 위해 둘 다 두거나 record_id 권장)
    record_id = Column(Integer, ForeignKey("user_library.id"), nullable=True) 
    work_id = Column(Integer, ForeignKey("works.id"), nullable=True) # 레거시 지원

    sentence = Column(Text, nullable=False) # 발췌 문장
    thought = Column(Text, nullable=True)   # 내 생각
    page_number = Column(Integer, nullable=True) # 몇 페이지에서? (추가됨)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="memos")
    record = relationship("Record", back_populates="memos")

# 6. [New] 태그 및 감정 (프로 버전을 위한 신규 모델)
class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True)

class RecordTag(Base):
    __tablename__ = "record_tags"
    record_id = Column(Integer, ForeignKey("user_library.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)