# 파일 경로: backend/models.py (기존 코드 하단에 추가)
# 역할 및 기능: BoooknTalk 서재 인사이트 화면을 0.1초 만에 렌더링하기 위한 이벤트 기반의 통계 전용(역정규화) 테이블들을 정의합니다.

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# ===================================================================
# [1] 참여자(작가/옮긴이) 정보 마스터 테이블 (수정 완료)
# ===================================================================
class Contributor(Base):
    __tablename__ = "contributors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    
    # [수정] 알라딘에 종속되지 않는 범용 외부 식별자 구조
    external_source = Column(String(50), nullable=True) # 예: 'NAVER', 'ALADIN', 'NLK'(국립중앙도서관)
    external_id = Column(String(100), nullable=True, index=True) 
    
    original_name = Column(String, nullable=True)
    isni = Column(String, unique=True, nullable=True)
    description = Column(String, nullable=True)

    # [수정] 외부 API 연동 시점 기록 (타임라인 캐싱 갱신용)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)

    work_participations = relationship("WorkContributor", back_populates="contributor")

    # 외부 소스와 ID 조합은 고유해야 함
    __table_args__ = (
        UniqueConstraint('external_source', 'external_id', name='uq_external_source_id'),
    )

# ===================================================================
# [2] 작품-참여자 연결 테이블 (다대다 관계 유지)
# ===================================================================
class WorkContributor(Base):
    __tablename__ = "work_contributors"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id", ondelete="CASCADE"))
    contributor_id = Column(Integer, ForeignKey("contributors.id", ondelete="CASCADE"))
    
    role = Column(String(50), nullable=False, index=True)  # 'AUTHOR' 또는 'TRANSLATOR' 등으로 엄격히 관리
    
    work = relationship("Work", back_populates="contributors")
    contributor = relationship("Contributor", back_populates="work_participations")

    # ▼▼▼ [NEW] ISNI 컬럼 추가 ▼▼▼
    # 실제 ISNI는 16자리 숫자(또는 X 포함)지만, 'BKT-TEMP-...' 같은 임시 코드를 넣기 위해 넉넉히 50으로 잡습니다.
    # 동명이인 구별의 핵심 키가 되므로 index=True로 검색 속도를 높이고, 중복을 막기 위해 unique=True를 줍니다.

# 1. 사용자 (Users) - OAuth 및 프로 버전 대응
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True) 
    nickname = Column(String(50), unique=True, index=True, nullable=True) 
    bio = Column(String(200), nullable=True) 
    profile_image = Column(String, nullable=True) 
    
    is_premium = Column(Boolean, default=False) 
    subscription_end_date = Column(DateTime(timezone=True), nullable=True)
    
    # ▼▼▼ [NEW: 프로필 로딩 초고속 최적화 (카운트 캐싱)] ▼▼▼
    follower_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- [관계 정의] ---
    records = relationship("Record", back_populates="user")
    memos = relationship("Memo", back_populates="user")

    # 팔로우/팔로잉 양방향 관계 설정
    followers = relationship(
        "User", 
        secondary="follows",
        primaryjoin="User.id==Follow.following_id",
        secondaryjoin="User.id==Follow.follower_id",
        back_populates="following" # backref 대신 명시적 연결
    )
    
    following = relationship(
        "User", 
        secondary="follows",
        primaryjoin="User.id==Follow.follower_id",
        secondaryjoin="User.id==Follow.following_id",
        back_populates="followers", # 서로 마주보게 연결
        overlaps="followers"        # 겹치는 부분을 SQLAlchemy에게 인지시킴
    )

# ===================================================================
# [3] Work 테이블 (수정 완료)
# ===================================================================
class Work(Base):
    __tablename__ = "works"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    
    # ▼▼▼ [핵심 수정] 에러의 원인이었던 author_display를 author로 완벽히 원복했습니다. ▼▼▼
    author = Column(String) 
    
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    
    # 서지정보 Level 2/3: 원서명 (번역서 식별 및 UI 표기용)
    original_title = Column(String, nullable=True) 
    
    # 참여자 목록 및 판본 관계 설정
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
    
    # follower_id(나)가 following_id(타인)를 팔로우함
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    # ▼▼▼ [NEW: 찐팬 알림 스위치] ▼▼▼
    is_alarm_on = Column(Boolean, default=False) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ===================================================================
# [인사이트 및 통계 전용 영역] 실시간 JOIN을 대체하는 역정규화 테이블
# ===================================================================

# 기능: 유저의 '전체 기간(All-time)' 독서 및 기록 요약 데이터를 저장합니다. (섹션 1, 4 대응)
class InsightSummary(Base):
    __tablename__ = "insight_summaries"

    # user_id 자체를 PK로 사용하여 1:1 관계를 강제하고 조회 속도를 극대화합니다.
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    # [섹션 1] 서재의 지형 데이터
    total_read_books = Column(Integer, default=0)    # 완독한 책
    total_reading_books = Column(Integer, default=0) # 읽고 있는 책
    total_wish_books = Column(Integer, default=0)    # 읽고 싶은 책
    
    # [섹션 4] 기록의 무게 데이터
    total_memos = Column(Integer, default=0)         # 독서노트 수
    total_short_reviews = Column(Integer, default=0) # 한줄평 수
    total_long_reviews = Column(Integer, default=0)  # 긴줄평 수

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="insight_summary")


# 기능: 유저의 '연도별/월별' 완독 흐름 데이터를 저장합니다. (섹션 3 대응)
class InsightMonthly(Base):
    __tablename__ = "insight_monthlies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    year = Column(Integer, nullable=False)  # 예: 2026
    month = Column(Integer, nullable=False) # 예: 3 (1~12)
    read_count = Column(Integer, default=0) # 해당 연/월에 완독한 총 권수

    # 동일한 유저가 같은 연도/월에 여러 로우를 생성하지 못하도록 고유 제약조건 설정
    __table_args__ = (
        UniqueConstraint('user_id', 'year', 'month', name='uq_user_year_month'),
    )


# 기능: 유저가 완독한 도서의 '장르(카테고리)' 스펙트럼 데이터를 저장합니다. (섹션 2 - 도넛 차트 대응)
class InsightGenre(Base):
    __tablename__ = "insight_genres"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    genre_name = Column(String(100), nullable=False) # 예: "소설/시/희곡", "인문/철학"
    read_count = Column(Integer, default=0)          # 해당 장르의 완독 권수

    __table_args__ = (
        UniqueConstraint('user_id', 'genre_name', name='uq_user_genre'),
    )


# 기능: 유저가 가장 많이 완독한 '작가 TOP 3' 랭킹을 추출하기 위한 데이터를 저장합니다. (섹션 2 - 랭킹 대응)
class InsightAuthor(Base):
    __tablename__ = "insight_authors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    author_name = Column(String(100), nullable=False) # 작가명
    read_count = Column(Integer, default=0)           # 해당 작가의 책 완독 권수

    __table_args__ = (
        UniqueConstraint('user_id', 'author_name', name='uq_user_author'),
    )

# ===================================================================
# [4] 인사이트 통계: 작가 및 옮긴이 전용 (InsightAuthor 대체)
# ===================================================================
# 기능: 유저가 완독한 도서의 참여자(작가/옮긴이)별 권수 랭킹 데이터를 저장합니다. 동명이인 문제를 완벽 차단합니다.
class InsightContributor(Base):
    __tablename__ = "insight_contributors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # [핵심 수정] 문자열 이름이 아닌 실제 DB의 Contributor ID를 바라보게 설정
    contributor_id = Column(Integer, ForeignKey("contributors.id", ondelete="CASCADE"), nullable=False)
    
    # 통계용 캐싱 이름 (Join 없이 빠른 화면 렌더링용)
    contributor_name = Column(String(100), nullable=False) 
    
    # [핵심 수정] 작가 랭킹과 옮긴이 랭킹을 분리하기 위한 역할 컬럼
    role = Column(String(50), nullable=False) # 'AUTHOR' / 'TRANSLATOR'
    
    read_count = Column(Integer, default=0)

    # 한 유저의 통계 내에서 특정 참여자+역할 데이터는 유일해야 함
    __table_args__ = (
        UniqueConstraint('user_id', 'contributor_id', 'role', name='uq_user_contributor_role'),
    )