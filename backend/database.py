from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

import os
import urllib.parse

load_dotenv()

# .strip()을 사용하여 혹시 모를 공백 제거
user_id = os.getenv("user_id").strip()
password = os.getenv("password").strip()
host = os.getenv("host").strip()
port = os.getenv("port", "5432").strip()
db_name = os.getenv("db_name").strip()

# 인코딩 처리
encoded_password = urllib.parse.quote_plus(password)
# 최종 URL 조립
SQLALCHEMY_DATABASE_URL = f"postgresql://{user_id}:{password}@{host}:{port}/{db_name}"

# 상용 서비스의 안정적인 연결을 위한 커넥션 풀 설정
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=10,        # 동시 접속 대응을 위해 조금 늘림
    max_overflow=20,
    pool_recycle=300,    # 연결 유지 시간을 짧게 잡아 끊김 방지
    pool_pre_ping=True   # 연결 전 살아있는지 항상 확인 (핵심 옵션!)
)

# [해결 포인트] 이 부분이 정의되어 있어야 합니다.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()