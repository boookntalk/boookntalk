# 파일 경로: backend/utils/ai_tag_extractor.py
# 역할 및 기능: 도서의 상세 소개글(Description) 텍스트를 분석하여, 유저의 흥미를 유발할 수 있는 직관적이고 트렌디한 마이크로 취향 태그(예: 법정스릴러, 몰입감최고 등) 3개를 자동으로 추출하는 AI 모듈입니다.

import re
from collections import Counter

# 함수 기능: 장문의 도서 소개 텍스트를 입력받아 불용어(Stopwords)를 제거하고 빈도수와 핵심 키워드 매핑 사전을 기반으로 가장 적합한 상위 3개의 태그 배열을 반환합니다.
def extract_micro_tags(description: str, limit: int = 3) -> list:
    if not description or len(description.strip()) < 10:
        return ["추천도서", "스테디셀러"]

    # 1. 텍스트 정제 (특수문자 제거 및 소문자화)
    clean_text = re.sub(r'[^\w\s]', '', description).lower()
    
    # 상용 서비스 타겟 핫 키워드 매핑 사전 (추후 진짜 머신러닝/LLM 연결 전까지 완벽하게 작동하는 룰베이스 엔진)
    keyword_map = {
        "법정스릴러": ["변호사", "법정", "재판", "검사", "판결", "무죄"],
        "범죄": ["살인", "경찰", "추적", "형사", "사건", "범인", "시체"],
        "로맨스": ["사랑", "연인", "운명", "설렘", "이별", "결혼", "연애"],
        "역사소설": ["조선", "왕", "역사", "시대", "황제", "제국"],
        "SF": ["우주", "미래", "외계", "인공지능", "로봇", "시간여행"],
        "성장물": ["청소년", "학교", "사춘기", "성장", "우정", "꿈"],
        "힐링": ["위로", "따뜻한", "치유", "마음", "행복", "휴식", "카페"],
        "경영전략": ["기업", "비즈니스", "성공", "리더십", "경영", "마케팅"],
        "재테크": ["투자", "주식", "부동산", "자산", "돈", "부자", "경제"],
        "심리학": ["무의식", "심리", "감정", "인간관계", "자존감", "상처"],
        "몰입감최고": ["베스트셀러", "흡입력", "반전", "스릴", "숨막히는", "페이지터너"],
        "광주민주화운동": ["518", "광주", "민주화", "계엄군", "시민군", "도청"]
    }

    extracted_tags = []
    
    # 2. 본문에 매핑 사전의 단어가 포함되어 있으면 해당 태그(Key)를 추출
    for tag, keywords in keyword_map.items():
        for keyword in keywords:
            if keyword in clean_text:
                extracted_tags.append(tag)
                break # 한 태그에서 여러 키워드가 걸려도 중복 방지를 위해 루프 탈출

    # 3. 만약 태그가 부족하다면 텍스트 내에서 가장 많이 등장한 명사(2글자 이상)를 보조 태그로 사용
    if len(extracted_tags) < limit:
        words = clean_text.split()
        # 기초적인 불용어 처리 (실제 환경에 맞게 추가 가능)
        stop_words = set(["있는", "없다", "그리고", "그러나", "그", "이", "저", "것", "수", "등", "이다", "한다", "대한", "위해"])
        meaningful_words = [w for w in words if len(w) >= 2 and w not in stop_words]
        
        word_counts = Counter(meaningful_words)
        for word, _ in word_counts.most_common(limit):
            if word not in extracted_tags:
                extracted_tags.append(word)
            if len(extracted_tags) >= limit:
                break

    # 최종적으로 제한된 개수(기본 3개)의 태그 반환
    return extracted_tags[:limit]