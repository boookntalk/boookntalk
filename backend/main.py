from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware # 추가
from sqlalchemy.orm import Session
from database import engine
import models
import database

# DB 테이블 생성
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="boookntalk API")

# CORS 설정: 프론트엔드의 접근을 허용합니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/posts")
def get_posts(db: Session = Depends(database.get_db)):
    # DB에서 실제 포스트와 유저, 도서 정보를 가져옵니다.
    return db.query(models.Post).all()

@app.get("/")
def read_root():
    return {"message": "Welcome to boookntalk API"}