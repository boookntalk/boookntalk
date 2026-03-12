from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# [1] 참여자(작가) 정보 테이블 (NEW)
class Contributor(Base):
    __tablename__ = "contributors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    aladin_author_id = Column(Integer, unique=True, nullable=True) # [추가] 알라딘 작가 고유 ID
    original_name = Column(String, nullable=True)
    description = Column(String, nullable=True)

    work_participations = relationship("WorkContributor", back_populates="contributor")

# [2] 작품-참여자 연결 테이블 (NEW - 다대다 관계)
class WorkContributor(Base):
    __tablename__ = "work_contributors"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"))
    contributor_id = Column(Integer, ForeignKey("contributors.id"))
    
    role = Column(String, nullable=False)  # Author, Translator, Illustrator 등
    
    # 관계 설정
    work = relationship("Work", back_populates="contributors")
    contributor = relationship("Contributor", back_populates="work_participations")


# 1. 사용자 (Users) - OAuth 및 프로 버전 대응
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True) # OAuth 필수
    nickname = Column(String(50), unique=True, index=True, nullable=True) # 닉네임 (중복 불가)
    bio = Column(String(200), nullable=True) # 한 줄 소개
    profile_image = Column(String, nullable=True) # 프로필 이미지 URL
    
    is_premium = Column(Boolean, default=False) # 프로 버전 멤버십 여부
    subscription_end_date = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 관계 정의
    records = relationship("Record", back_populates="user")
    memos = relationship("Memo", back_populates="user")

# [3] Work 테이블 수정 (관계 추가)
class Work(Base):
    __tablename__ = "works"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    author = Column(String) # (원본 문자열 유지)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    
    # [추가] 서지정보 Level 2/3: 원서명 (번역서 식별 및 UI 표기용)
    original_title = Column(String, nullable=True) 
    
    # 참여자 목록 관계
    contributors = relationship("WorkContributor", back_populates="work")
    editions = relationship("Edition", back_populates="work")

# 3. 판본 (Editions) - 출판사별/연도별 구체적인 책
class Edition(Base):
    __tablename__ = "editions"

    id = Column(Integer, primary_key=True, index=True)
    isbn = Column(String, unique=True, index=True)
    isbn10 = Column(String, nullable=True)
    addon_code = Column(String, nullable=True)
    work_id = Column(Integer, ForeignKey("works.id"))
    publisher = Column(String, index=True)
    publish_date = Column(DateTime, nullable=True) 
    cover_image = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    page_count = Column(Integer, nullable=True)
    
    # --- [추가] 서지정보 Level 2 & 3 대응 물리적/메타 데이터 ---
    binding_type = Column(String, nullable=True) # 제본 형태 (예: 양장본, 반양장본, 전자책)
    kdc_code = Column(String, nullable=True)     # 도서 분류 기호 (KDC)
    language = Column(String, default="한국어")  # 출간 언어
    size_mm = Column(String, nullable=True)      # 물리적 크기 (예: 152x223mm)
    price = Column(Integer, nullable=True)       # 정가
    # -----------------------------------------------------------
    
    is_bnt_isbn = Column(Boolean, default=False)
    
    # 관계 설정
    work = relationship("Work", back_populates="editions")
    records = relationship("Record", back_populates="edition")
    
    # ▼▼▼ [NEW] BoooknTalk 최초 발견자(등록자) 기록 ▼▼▼
    # 회원이 탈퇴하더라도 '누군가 등록했다'는 기록이 남도록 SET NULL 처리하거나, nullable=True로 둡니다.
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # User 테이블과의 관계 설정 (작성자 정보를 쉽게 가져오기 위함)
    creator = relationship("User", foreign_keys=[created_by_id])

# 4. 기록 (Record) - 핵심 기능: 독서 세션 (구 user_library)
class Record(Base):
    __tablename__ = "user_library"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    edition_id = Column(Integer, ForeignKey("editions.id"))

    status = Column(String(50), default="READING")
    rating = Column(Float, default=0.0)
    short_review = Column(Text)
    
    start_date = Column(DateTime, nullable=True)
    finish_date = Column(DateTime, nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    current_page = Column(Integer, default=0)
    reading_format = Column(String(50), default="PAPER") 

    # [수정] 한줄평 공개/비공개 토글 전용 플래그
    is_short_review_public = Column(Boolean, default=True)

    is_spoiler = Column(Boolean, default=False, nullable=True)

    user = relationship("User", back_populates="records")
    edition = relationship("Edition")
    memos = relationship("Memo", back_populates="record")
    # ▼▼▼ 관리자 픽 스위치 추가 (기본값은 False) ▼▼▼
    is_editor_pick = Column(Boolean, default=False, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# 5. 메모 (Memo) - 구 posts (문장 수집 및 생각)
class Memo(Base):
    __tablename__ = "posts" 

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    record_id = Column(Integer, ForeignKey("user_library.id"), nullable=True) 
    work_id = Column(Integer, ForeignKey("works.id"), nullable=True)

    sentence = Column(Text, nullable=False) # 발췌 문장
    thought = Column(Text, nullable=True)   # 내 생각
    page_number = Column(Integer, nullable=True) # 페이지 번호
    
    # [추가] 상세 메모 및 발췌문 공개/비공개 토글 플래그
    is_public = Column(Boolean, default=True) 
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

# ▼▼▼ [NEW] 관리자용 닉네임 변경 이력 테이블 ▼▼▼
class NicknameHistory(Base):
    __tablename__ = "nickname_histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    old_nickname = Column(String(50), nullable=True) # 최초 설정 시에는 이전 닉네임이 없을 수 있으므로 True
    new_nickname = Column(String(50), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now()) # 변경된 시간 자동 기록

    # User 모델과 양방향 조회를 위한 관계 설정 (선택 사항이지만 관리자 페이지 만들 때 매우 유용합니다)
    user = relationship("User", backref="nickname_histories")
    
# 7. 긴줄평 (Long Review) - 독립된 테이블
class LongReview(Base):
    __tablename__ = "long_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    record_id = Column(Integer, ForeignKey("user_library.id", ondelete="CASCADE"), nullable=False, unique=True) # 1:1 관계를 위해 unique=True
    work_id = Column(Integer, ForeignKey("works.id", ondelete="SET NULL"), nullable=True) # 작품 단위 조회를 위한 컬럼

    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_draft = Column(Boolean, default=True) # 임시저장 여부

    is_spoiler = Column(Boolean, default=False, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 관계 설정
    user = relationship("User")
    record = relationship("Record", backref="long_review")

# ===================================================================
# 8. [NEW] 소셜 광장 공감(좋아요) 연결 테이블
# ===================================================================

# 8-1. 한줄평(Record) 공감 테이블
class RecordLike(Base):
    __tablename__ = "record_likes"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    record_id = Column(Integer, ForeignKey("user_library.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 8-2. 사색/메모(Memo) 공감 테이블
class MemoLike(Base):
    __tablename__ = "memo_likes"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    memo_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 8-3. 긴줄평(LongReview) 공감 테이블
class LongReviewLike(Base):
    __tablename__ = "long_review_likes"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    long_review_id = Column(Integer, ForeignKey("long_reviews.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ===================================================================
# 9. [NEW] 소셜 광장 팔로우 연결 테이블
# ===================================================================
class Follow(Base):
    __tablename__ = "follows"
    
    # follower_id가 following_id를 팔로우함 (단방향)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())