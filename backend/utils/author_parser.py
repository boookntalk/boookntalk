# 파일 경로: backend/utils/author_parser.py
# 역할 및 기능: 외부 API에서 전달받은 비구조적인 작가/참여자 문자열을 정규표현식을 통해 이름, 원어 이름, 역할(Role)로 완벽하게 분리하여 구조화된 데이터(List[dict])로 반환하는 파싱 엔진입니다.

import re

def parse_author_string(author_str: str):
    """
    입력: "J. R. R. 톨킨^Tolkien (지은이), 피터 잭슨 (각색)"
    출력: [
        {'name': 'J.R.R. 톨킨', 'original_name': 'Tolkien', 'role': 'Author'},
        {'name': '피터 잭슨', 'original_name': None, 'role': 'Adapter'}
    ]
    """
    if not author_str:
        return []

    contributors = []
    # 1. 콤마(,)뿐만 아니라 세미콜론(;)으로도 완벽하게 쪼갭니다.
    parts = [p.strip() for p in re.split(r'[,;]', author_str) if p.strip()]
    
    temp_names = [] 
    
    # ▼▼▼ 이름 정규화(Normalization) 다리미 엔진 ▼▼▼
    def normalize_name(raw_name):
        orig_name = None
        # 1. NLK 특유의 '^' 기호를 기준으로 한글 이름과 원어 이름 분리
        if '^' in raw_name:
            splits = raw_name.split('^', 1)
            raw_name = splits[0].strip()
            orig_name = splits[1].strip()
        
        # 2. 이니셜 띄어쓰기 압축 (예: "J. R. R. 톨킨" -> "J.R.R. 톨킨")
        raw_name = re.sub(r'([A-Za-z])\.\s+(?=[A-Z]\.)', r'\1.', raw_name)
        
        if orig_name:
            orig_name = re.sub(r'([A-Za-z])\.\s+(?=[A-Z]\.)', r'\1.', orig_name)
            
        return raw_name, orig_name
    # ▲▲▲ 엔진 끝 ▲▲▲

    for part in parts:
        role = "Unknown"
        name = part
        
        # 💡 [핵심 업그레이드] 출판계의 모든 역할(각색, 감수, 기획 등)을 완벽하게 포용하는 정규식
        nlk_match = re.search(r"^(지은이|저자|글|원작|원저|옮긴이|역자|번역|각색|그림|사진|일러스트|삽화|만화|감수|편집|기획|엮은이|편저자)\s*[:|：]\s*(.+)$", part)
        aladin_match = re.search(r"(.+?)\s*\((.+?)\)$", part)
        
        if nlk_match:
            role_kr = nlk_match.group(1).strip()
            name = nlk_match.group(2).strip() 
            
            # 국립중앙도서관 포맷 역할 맵핑
            if role_kr in ['지은이', '저자', '글', '원작', '원저']: role = "Author"
            elif role_kr in ['옮긴이', '역자', '번역']: role = "Translator"
            elif role_kr in ['각색']: role = "Adapter"  # 💡 [NEW] 각색 역할 부여
            elif role_kr in ['그림', '사진', '일러스트', '삽화', '만화']: role = "Illustrator"
            elif role_kr in ['감수', '편집', '기획', '엮은이', '편저자']: role = "Editor"
            
            clean_n, orig_n = normalize_name(name)
            contributors.append({'name': clean_n, 'original_name': orig_n, 'role': role})
            
        elif aladin_match:
            name = aladin_match.group(1).strip() 
            role_kr = aladin_match.group(2).strip()
            
            # 알라딘/네이버 괄호 포맷 역할 맵핑
            if any(x in role_kr for x in ['지은이', '저자', '글', '원작', '원저']): role = "Author"
            elif any(x in role_kr for x in ['옮긴이', '역자', '번역']): role = "Translator"
            elif any(x in role_kr for x in ['각색']): role = "Adapter" # 💡 [NEW] 각색 역할 부여
            elif any(x in role_kr for x in ['그림', '삽화', '일러스트', '만화', '사진']): role = "Illustrator"
            elif any(x in role_kr for x in ['감수', '편집', '기획', '엮은이', '편저자']): role = "Editor"
            else: role = "Author"
            
            clean_n, orig_n = normalize_name(name)
            temp_names.append((clean_n, orig_n))
            
            # "A, B (지은이)" 처럼 앞에 누적된 이름들이 있다면 괄호 안의 역할을 일괄 부여
            for t_n, t_orig in temp_names:
                contributors.append({'name': t_n, 'original_name': t_orig, 'role': role})
            temp_names = []
            
        else:
            # 접미사 포맷 (예: "홍길동 지음", "이순신 각색")
            if part.endswith('지음') or part.endswith('저') or part.endswith('글'):
                name = re.sub(r'(지음|저|글)$', '', part).strip()
                clean_n, orig_n = normalize_name(name)
                contributors.append({'name': clean_n, 'original_name': orig_n, 'role': 'Author'})
            elif part.endswith('옮김') or part.endswith('역'):
                name = re.sub(r'(옮김|역)$', '', part).strip()
                clean_n, orig_n = normalize_name(name)
                contributors.append({'name': clean_n, 'original_name': orig_n, 'role': 'Translator'})
            elif part.endswith('각색'): # 💡 [NEW] 각색 접미사 처리
                name = re.sub(r'각색$', '', part).strip()
                clean_n, orig_n = normalize_name(name)
                contributors.append({'name': clean_n, 'original_name': orig_n, 'role': 'Adapter'})
            elif part.endswith('그림'):
                name = re.sub(r'그림$', '', part).strip()
                clean_n, orig_n = normalize_name(name)
                contributors.append({'name': clean_n, 'original_name': orig_n, 'role': 'Illustrator'})
            else:
                clean_n, orig_n = normalize_name(part)
                temp_names.append((clean_n, orig_n))
                
    # 끝까지 역할이 명시되지 않고 덩그러니 남은 이름들은 기본값인 Author 처리
    for t_n, t_orig in temp_names:
        contributors.append({'name': t_n, 'original_name': t_orig, 'role': 'Author'})
        
    return contributors


def cleanse_author_name(raw_name: str) -> str:
    """
    함수 기능: 작가 이름에서 불필요한 노이즈 단어들을 1차적으로 걷어내는 클렌징 기능입니다.
    """
    if not raw_name:
        return ""
    # 💡 [NEW] '각색' 노이즈 단어 풀에 추가 완료
    stopwords = [r'장편소설', r'소설', r'지음', r'저', r'옮김', r'번역', r'그림', r'엮음', r'지은이', r'글', r'각색']
    cleaned = raw_name
    for word in stopwords:
        cleaned = re.sub(rf'\s*{word}\s*', '', cleaned)
    return cleaned.strip()


def get_merge_mapping():
    """
    함수 기능: 파편화된 작가 이름들을 수동으로 병합하기 위한 하드코딩 매핑 테이블입니다.
    """
    return {
        "J.R.R. Tolkien": "J.R.R. 톨킨",
        "J. R. R. 톨킨": "J.R.R. 톨킨",
    }