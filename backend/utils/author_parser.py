import re

def parse_author_string(author_str: str):
    """
    입력: "J. R. R. 톨킨^Tolkien (지은이)"
    출력: [{'name': 'J.R.R. 톨킨', 'original_name': 'Tolkien', 'role': 'Author'}]
    """
    if not author_str:
        return []

    contributors = []
    # 1. 콤마(,)뿐만 아니라 세미콜론(;)으로도 완벽하게 쪼갭니다.
    parts = [p.strip() for p in re.split(r'[,;]', author_str) if p.strip()]
    
    temp_names = [] 
    
    # ▼▼▼ [NEW] 이름 정규화(Normalization) 다리미 엔진 ▼▼▼
    def normalize_name(raw_name):
        orig_name = None
        # 1. NLK 특유의 '^' 기호를 기준으로 한글 이름과 원어 이름 분리
        if '^' in raw_name:
            splits = raw_name.split('^', 1)
            raw_name = splits[0].strip()
            orig_name = splits[1].strip()
        
        # 2. 이니셜 띄어쓰기 압축 (예: "J. R. R. 톨킨" -> "J.R.R. 톨킨")
        # 원리: 영문자+마침표 뒤에 띄어쓰기가 있고, 그 다음 글자도 영문자+마침표일 때만 띄어쓰기 제거
        raw_name = re.sub(r'([A-Za-z])\.\s+(?=[A-Z]\.)', r'\1.', raw_name)
        
        if orig_name:
            orig_name = re.sub(r'([A-Za-z])\.\s+(?=[A-Z]\.)', r'\1.', orig_name)
            
        return raw_name, orig_name
    # ▲▲▲ [NEW] 엔진 끝 ▲▲▲

    for part in parts:
        role = "Unknown"
        name = part
        
        nlk_match = re.search(r"^(지은이|저자|글|옮긴이|역자|번역|그림|사진|일러스트)\s*[:|：]\s*(.+)$", part)
        aladin_match = re.search(r"(.+?)\s*\((.+?)\)$", part)
        
        if nlk_match:
            role_kr = nlk_match.group(1).strip()
            name = nlk_match.group(2).strip() 
            
            if role_kr in ['지은이', '저자', '글']: role = "Author"
            elif role_kr in ['옮긴이', '역자', '번역']: role = "Translator"
            elif role_kr in ['그림', '사진', '일러스트']: role = "Illustrator"
            
            clean_n, orig_n = normalize_name(name)
            contributors.append({'name': clean_n, 'original_name': orig_n, 'role': role})
            
        elif aladin_match:
            name = aladin_match.group(1).strip() 
            role_kr = aladin_match.group(2).strip()
            
            if any(x in role_kr for x in ['지은이', '저자', '글', '원작', '원저']): role = "Author"
            elif any(x in role_kr for x in ['옮긴이', '역자', '번역']): role = "Translator"
            elif any(x in role_kr for x in ['그림', '삽화', '일러스트', '만화', '사진']): role = "Illustrator"
            elif any(x in role_kr for x in ['감수', '편집', '기획', '엮은이', '편저자']): role = "Editor"
            else: role = "Author"
            
            clean_n, orig_n = normalize_name(name)
            temp_names.append((clean_n, orig_n))
            for t_n, t_orig in temp_names:
                contributors.append({'name': t_n, 'original_name': t_orig, 'role': role})
            temp_names = []
            
        else:
            if part.endswith('지음') or part.endswith('저'):
                name = re.sub(r'(지음|저)$', '', part).strip()
                clean_n, orig_n = normalize_name(name)
                contributors.append({'name': clean_n, 'original_name': orig_n, 'role': 'Author'})
            elif part.endswith('옮김') or part.endswith('역'):
                name = re.sub(r'(옮김|역)$', '', part).strip()
                clean_n, orig_n = normalize_name(name)
                contributors.append({'name': clean_n, 'original_name': orig_n, 'role': 'Translator'})
            elif part.endswith('그림'):
                name = re.sub(r'그림$', '', part).strip()
                clean_n, orig_n = normalize_name(name)
                contributors.append({'name': clean_n, 'original_name': orig_n, 'role': 'Illustrator'})
            else:
                clean_n, orig_n = normalize_name(part)
                temp_names.append((clean_n, orig_n))
                
    for t_n, t_orig in temp_names:
        contributors.append({'name': t_n, 'original_name': t_orig, 'role': 'Author'})
        
    return contributors

# 파일 경로: backend/utils/author_parser.py
import re

def cleanse_author_name(raw_name: str) -> str:
    if not raw_name:
        return ""
    stopwords = [r'장편소설', r'소설', r'지음', r'저', r'옮김', r'번역', r'그림', r'엮음', r'지은이', r'글']
    cleaned = raw_name
    for word in stopwords:
        cleaned = re.sub(rf'\s*{word}\s*', '', cleaned)
    return cleaned.strip()

def get_merge_mapping():
    return {
        "J.R.R. Tolkien": "J.R.R. 톨킨",
        "J. R. R. 톨킨": "J.R.R. 톨킨",
    }