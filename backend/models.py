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
    nickname = Column(String(255))
    profile_image = Column(String(1024)) # 구글 프로필 이미지 URL 저장 (추가됨)
    
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

    # ▼▼▼ [NEW] 독서 진행률 및 매체 기록용 ▼▼▼
    current_page = Column(Integer, default=0)
    reading_format = Column(String(50), default="PAPER") # PAPER(종이책), EBOOK(전자책), AUDIO(오디오북)

    # 관계 (기존 유지)
    user = relationship("User", back_populates="records")
    edition = relationship("Edition")
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