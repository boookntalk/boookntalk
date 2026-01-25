from database import Base
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
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
    description = Column(Text)

    # 관계 설정
    editions = relationship("Edition", back_populates="work")
    posts = relationship("Post", back_populates="work")

class Edition(Base):
    __tablename__ = "editions"
    id = Column(Integer, primary_key=True, index=True)
    isbn = Column(String, unique=True, index=True, nullable=False)
    work_id = Column(Integer, ForeignKey("works.id"))
    publisher = Column(String)
    cover_image = Column(String)

# [추가] 최초 등록자 정보 및 자체 ISBN 여부
    registrant_id = Column(Integer, ForeignKey("users.id"))
    is_bnt_isbn = Column(Boolean, default=False)

    registrant = relationship("User") # 등록자 정보 연결
    work = relationship("Work", back_populates="editions")

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