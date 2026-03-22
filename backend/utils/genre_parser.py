# 파일 경로: backend/utils/genre_parser.py
# 역할 및 기능: 외부 API(국립중앙도서관 KDC, 네이버 카테고리 등)에서 유입되는 파편화된 장르 데이터를 BoooknTalk만의 8대 표준 장르로 필터링하고 매핑하는 공통 유틸리티입니다.

import re

# ==========================================
# [상수] BoooknTalk 8대 표준 장르 정의
# (오타 방지 및 중앙 관리를 위해 상수로 선언합니다)
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

def map_to_standard_genre(kdc_code: str, naver_category: str = "") -> str:
    """
    기능: KDC 분류 기호나 텍스트 카테고리를 분석하여 BoooknTalk 표준 장르 문자열을 반환합니다.
    """
    kdc_str = str(kdc_code).strip() if kdc_code else ""
    cat_str = str(naver_category).lower() if naver_category else ""

    # 1. KDC 코드가 숫자로 들어온 경우 우선 판별 (가장 정확도가 높음)
    if kdc_str and any(c.isdigit() for c in kdc_str):
        pure_num = "".join(filter(str.isdigit, kdc_str))
        if len(pure_num) >= 1:
            prefix = pure_num[0]
            
            if prefix == '8':
                if pure_num.startswith(('814', '824', '834', '844', '804')):
                    return GENRE_ESSAY
                return GENRE_LITERATURE
            elif prefix in ['1', '2', '9']: return GENRE_HUMANITIES
            elif prefix == '3':
                if pure_num.startswith('32'): return GENRE_BUSINESS
                return GENRE_HUMANITIES
            elif prefix in ['4', '5']: return GENRE_SCIENCE
            elif prefix == '6': return GENRE_PRACTICAL
            elif prefix == '7': return GENRE_ACADEMIC
            elif prefix == '0': return GENRE_ETC

    # 2. 숫자가 없거나 판별 불가할 경우 텍스트 키워드 기반 판별
    if cat_str:
        if any(x in cat_str for x in ['소설', '시', '희곡', '문학']): return GENRE_LITERATURE
        if any(x in cat_str for x in ['에세이', '수필', '산문', '논픽션']): return GENRE_ESSAY
        if any(x in cat_str for x in ['인문', '철학', '역사', '사회', '종교', '정치']): return GENRE_HUMANITIES
        if any(x in cat_str for x in ['경제', '경영', '재테크', '투자', '비즈니스']): return GENRE_BUSINESS
        if any(x in cat_str for x in ['과학', 'it', '컴퓨터', '공학', '의학', '기술']): return GENRE_SCIENCE
        if any(x in cat_str for x in ['실용', '취미', '예술', '여행', '요리', '건강', '자기계발']): return GENRE_PRACTICAL
        if any(x in cat_str for x in ['아동', '유아', '청소년', '그림책', '만화', '웹툰', '그래픽노블']): return GENRE_KIDS_COMIC
        if any(x in cat_str for x in ['학습', '교재', '전공', '수험서', '사전', '어학']): return GENRE_ACADEMIC

    # KDC도 없고 키워드도 안 맞으면 기존 카테고리명 유지 (단, 숫자만 달랑 있으면 '기타' 처리)
    return GENRE_ETC if kdc_str.isdigit() else (cat_str or GENRE_ETC)