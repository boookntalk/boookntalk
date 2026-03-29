# 파일 경로: backend/utils/train_model.py
# 역할 및 기능: 하드코딩된 기초 학습 데이터에 관리자가 DB에 누적한 오답 노트(GenreTrainingData)를 병합하여, 더욱 정교해진 AI 장르 분류 모델을 재학습시키고 파일(.joblib)로 저장합니다.

import os
import sys
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import make_pipeline

# 상위 디렉토리(backend)의 모듈을 임포트하기 위한 경로 설정
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import SessionLocal
from models import GenreTrainingData

# 1. BoooknTalk 표준 장르 8대 분류
CLASSES = [
    "문학 / 소설", "에세이 / 논픽션", "인문 / 사회 / 철학", "경제 / 경영",
    "과학 / IT / 공학", "실용 / 취미 / 예술", "아동 / 만화", "학술 / 전문서", "기타"
]

# 2. 기초 학습 데이터 (Seed Data) - 딕셔너리 형태로 변경하여 업데이트에 용이하게 만듭니다.
SEED_DATA = {
    "국내도서>소설/시/희곡>한국소설": "문학 / 소설",
    "외국도서>Literature & Fiction>Genre Fiction": "문학 / 소설",
    "국내도서>장르소설>추리/미스터리": "문학 / 소설",
    "문학>고전문학": "문학 / 소설",
    
    "국내도서>에세이>한국에세이": "에세이 / 논픽션",
    "국내도서>수필/기행문": "에세이 / 논픽션",
    "산문집": "에세이 / 논픽션",
    "논픽션>르포": "에세이 / 논픽션",
    
    "국내도서>인문학>심리학": "인문 / 사회 / 철학",
    "국내도서>역사/문화>세계사": "인문 / 사회 / 철학",
    "사회과학>정치/외교": "인문 / 사회 / 철학",
    "종교/역학": "인문 / 사회 / 철학",
    
    "국내도서>경제경영>재테크/투자": "경제 / 경영",
    "비즈니스/경제>마케팅": "경제 / 경영",
    "창업/취업/리더십": "경제 / 경영",
    
    "국내도서>컴퓨터/모바일>프로그래밍": "과학 / IT / 공학",
    "국내도서>자연과학>물리학": "과학 / IT / 공학",
    "IT 서적>파이썬 입문": "과학 / IT / 공학",
    "의학/공학": "과학 / IT / 공학",
    
    "국내도서>가정/요리/뷰티": "실용 / 취미 / 예술",
    "국내도서>건강/취미/레저": "실용 / 취미 / 예술",
    "예술/대중문화>미술": "실용 / 취미 / 예술",
    "자기계발>성공학": "실용 / 취미 / 예술",
    
    "국내도서>어린이>초등학습만화": "아동 / 만화",
    "국내도서>만화/라이트노벨": "아동 / 만화",
    "유아>그림책": "아동 / 만화",
    "어린이 역사책": "아동 / 만화",
    
    "국내도서>수험서/자격증>컴퓨터활용능력": "학술 / 전문서",
    "국내도서>대학교재>공학계열": "학술 / 전문서",
    "어학/사전>영어": "학술 / 전문서",
    "IT 자격증 수험서": "학술 / 전문서",
    
    "잡지": "기타",
    "문구/GIFT": "기타",
    "알 수 없음": "기타"
}

def fetch_db_training_data():
    """
    기능: DB(genre_training_data)에서 관리자가 직접 교정하고 누적한 오답 노트 데이터를 모두 가져와 딕셔너리로 반환합니다.
    """
    db = SessionLocal()
    try:
        records = db.query(GenreTrainingData).all()
        # 원본 텍스트를 key로, 관리자가 지정한 표준 장르를 value로 만듭니다.
        return {record.raw_keyword: record.standard_genre for record in records}
    finally:
        db.close()

def train_and_save_model():
    """
    기능: 기초 데이터(Seed)와 DB의 오답 노트 데이터를 병합하여 머신러닝 파이프라인을 학습시키고, 결과를 모델 파일로 덮어씁니다.
    """
    print("🚀 [BoooknTalk AI] 학습 데이터를 수집하고 병합하는 중...")
    
    # 1. 데이터 병합 (딕셔너리 특성상 중복되는 key가 들어오면 나중에 들어온 DB 데이터가 덮어씁니다)
    final_data_dict = SEED_DATA.copy()
    
    db_data = fetch_db_training_data()
    final_data_dict.update(db_data) # DB에 있는 최신 교정 데이터로 무조건 덮어쓰기!
    
    print(f"📊 총 학습 데이터 개수: {len(final_data_dict)}개 (기초 데이터 + DB 누적 데이터)")

    # 2. X(입력)와 y(정답) 리스트로 분리
    X_train = list(final_data_dict.keys())
    y_train = list(final_data_dict.values())

    # 3. TF-IDF 벡터화 및 LinearSVC 파이프라인 구성
    pipeline = make_pipeline(
        TfidfVectorizer(analyzer='char', ngram_range=(2, 4)),
        LinearSVC(C=1.0, class_weight='balanced', random_state=42)
    )

    print("🧠 [BoooknTalk AI] 똑똑해진 뇌로 장르 분류 모델 학습 시작...")
    pipeline.fit(X_train, y_train)

    # 4. 모델 저장 (기존 파일을 새롭고 강력한 모델로 교체)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "genre_classifier.joblib")
    
    joblib.dump(pipeline, model_path)
    print(f"✅ [BoooknTalk AI] 학습 완료! 진화된 모델이 완벽하게 저장되었습니다: {model_path}")

if __name__ == "__main__":
    train_and_save_model()