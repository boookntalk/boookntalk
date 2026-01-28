from database import Base
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True) 
    nickname = Column(String)
    profile_image = Column(String)
    
    # 상용 서비스 구독 필드
    is_premium = Column(Boolean, default=False)
    subscription_end_date = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    premium_type = Column(String, default="basic")
    # 관계 설정
    posts = relationship("Post", back_populates="author")

class Work(Base):
    __tablename__ = "works"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    author = Column(String, index=True)
    description = Column(Text)  # 작품의 전체 줄거리/소개
    category = Column(String)   # 장르 (소설, 경제 등)
    original_title = Column(String) # 원제

    editions = relationship("Edition", back_populates="work")
    posts = relationship("Post", back_populates="work")

class Edition(Base):
    __tablename__ = "editions"
    id = Column(Integer, primary_key=True, index=True)
    isbn = Column(String, unique=True, index=True, nullable=False)
    work_id = Column(Integer, ForeignKey("works.id"))
    publisher = Column(String)
    cover_image = Column(String)
    
    # 추가된 상용 서비스용 컬럼들
    page_count = Column(Integer)     # 독서 진행률 계산용
    pub_date = Column(String)        # 출판일
    language = Column(String, default="ko")
    preview_link = Column(Text)      # 구글 미리보기 URL
    
    registrant_id = Column(String, ForeignKey("users.email"))
    is_bnt_isbn = Column(Boolean, default=False)

    work = relationship("Work", back_populates="editions")

# [필수 추가] main.py에서 호출하는데 누락되었던 클래스
class UserLibrary(Base):
    __tablename__ = "user_library"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.email")) # 이메일 기반 연결
    edition_id = Column(Integer, ForeignKey("editions.id"))
    status = Column(String, default="reading")
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    
class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    sentence = Column(Text, nullable=False) # 한 문장
    thought = Column(Text)                  # 생각
    
    user_id = Column(Integer, ForeignKey("users.id"))
    work_id = Column(Integer, ForeignKey("works.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    author = relationship("User", back_populates="posts")
    work = relationship("Work", back_populates="posts")