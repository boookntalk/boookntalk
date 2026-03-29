# 파일 경로: backend/utils/genre_parser.py
# 역할 및 기능: 외부 API에서 유입되는 파편화된 장르 텍스트를, 사전에 학습된 초경량 머신러닝 모델(scikit-learn)을 활용하여 BoooknTalk만의 8대 표준 장르로 실시간 자동 분류하는 AI 파서입니다.

import re
import os
import joblib

# ==========================================
# [상수] BoooknTalk 8대 표준 장르 정의
# ==========================================
GENRE_LITERATURE = "문학 / 소설"
GENRE_ESSAY = "에세이 / 논픽션"
GENRE_HUMANITIES = "인문 / 사회 / 철학"
GENRE_BUSINESS = "경제 / 경영"
GENRE_SCIENCE = "과학 / IT / 공학"
GENRE_PRACTICAL = "실용 / 취미 / 예술"
GENRE_KIDS_COMIC = "아동 / 만화"
GENRE_ACADEMIC = "학술 / 전문서"
GENRE_ETC = "기타"

# 💡 [핵심] AI 모델 메모리 적재 (서버 가동 시 1회만 로드하여 응답 속도 최적화)
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "genre_classifier.joblib")

ai_classifier = None
if os.path.exists(model_path):
    ai_classifier = joblib.load(model_path)
    print("✅ [BoooknTalk AI] 장르 분류 AI 모델이 성공적으로 로드되었습니다.")
else:
    print("⚠️ [BoooknTalk AI] 모델 파일을 찾을 수 없습니다. train_model.py를 먼저 실행해 주세요.")

def map_to_standard_genre(kdc_code: str, naver_category: str = "") -> str:
    """
    함수 기능: KDC 분류 기호(숫자)를 1차적으로 판별하고, 텍스트 카테고리가 주어질 경우 로컬 AI 모델을 통해 8대 표준 장르 중 하나로 정확하게 추론(Predict)하여 반환합니다.
    """
    kdc_str = str(kdc_code).strip() if kdc_code else ""
    cat_str = str(naver_category).strip() if naver_category else ""

    # 1. KDC 코드가 있는 경우 (전 세계 도서관 표준 숫자 규칙이므로 100% 신뢰하여 최우선 적용)
    if kdc_str and any(c.isdigit() for c in kdc_str):
        pure_num = "".join(filter(str.isdigit, kdc_str))
        if len(pure_num) >= 1:
            prefix = pure_num[0]
            if prefix == '8':
                if len(pure_num) >= 3 and pure_num[2] == '4': 
                    return GENRE_ESSAY
                return GENRE_LITERATURE
            elif prefix in ['1', '2', '9']: return GENRE_HUMANITIES
            elif prefix == '3':
                if pure_num.startswith('32'): return GENRE_BUSINESS
                if pure_num.startswith('37'): return GENRE_ACADEMIC
                return GENRE_HUMANITIES
            elif prefix in ['4', '5']:
                if pure_num.startswith('59'): return GENRE_PRACTICAL
                return GENRE_SCIENCE
            elif prefix == '6': return GENRE_PRACTICAL
            elif prefix == '7': return GENRE_ACADEMIC
            elif prefix == '0': return GENRE_ETC

    # 2. KDC가 없거나 판별 불가 시, 우리의 로컬 AI 모델에게 질의! (알라딘/네이버 텍스트 처리)
    if cat_str and ai_classifier is not None:
        # predict()는 리스트를 받아서 리스트를 반환하므로 첫 번째 결과[0]를 꺼냅니다.
        predicted_genre = ai_classifier.predict([cat_str])[0]
        return predicted_genre

    return GENRE_ETC

def reload_ai_model():
    """
    기능: 관리자의 재학습 요청 시, 새로 구워진 .joblib 모델 파일을 메모리에 즉각 다시 로드하여 서버 재시작 없는 무중단 핫 리로드(Hot Reload)를 수행합니다.
    """
    global ai_classifier
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "genre_classifier.joblib")
    
    if os.path.exists(model_path):
        ai_classifier = joblib.load(model_path)
        print("🔄 [BoooknTalk AI] 장르 분류 모델 무중단 핫 리로드 완료!")
    else:
        print("⚠️ [BoooknTalk AI] 핫 리로드 실패: 모델 파일을 찾을 수 없습니다.")