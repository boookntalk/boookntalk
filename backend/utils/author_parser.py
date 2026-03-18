import re

def parse_author_string(author_str: str):
    """
    입력: "지은이: J.K. 롤링 ; 옮긴이: 강동혁" (NLK) 
          또는 "잭 손 (지은이), 박아람 (옮긴이)" (알라딘)
    출력: [{'name': 'J.K. 롤링', 'role': 'Author'}, {'name': '강동혁', 'role': 'Translator'}]
    """
    if not author_str:
        return []

    contributors = []
    # 1. 콤마(,)뿐만 아니라 세미콜론(;)으로도 완벽하게 쪼갭니다.
    parts = [p.strip() for p in re.split(r'[,;]', author_str) if p.strip()]
    
    temp_names = [] 
    
    for part in parts:
        role = "Unknown"
        name = part
        
        # A. NLK 스타일: "직함: 이름" (예: "지은이: 무라카미 하루키")
        nlk_match = re.search(r"^(지은이|저자|글|옮긴이|역자|번역|그림|사진|일러스트)\s*[:|：]\s*(.+)$", part)
        
        # B. 알라딘 스타일: "이름 (직함)" (예: "무라카미 하루키 (지은이)")
        aladin_match = re.search(r"(.+?)\s*\((.+?)\)$", part)
        
        if nlk_match:
            role_kr = nlk_match.group(1).strip()
            name = nlk_match.group(2).strip() # 찌꺼기가 제거된 순수 이름!
            
            if role_kr in ['지은이', '저자', '글']: role = "Author"
            elif role_kr in ['옮긴이', '역자', '번역']: role = "Translator"
            elif role_kr in ['그림', '사진', '일러스트']: role = "Illustrator"
            
            contributors.append({'name': name, 'role': role})
            
        elif aladin_match:
            name = aladin_match.group(1).strip() # 찌꺼기가 제거된 순수 이름!
            role_kr = aladin_match.group(2).strip()
            
            if any(x in role_kr for x in ['지은이', '저자', '글', '원작', '원저']): role = "Author"
            elif any(x in role_kr for x in ['옮긴이', '역자', '번역']): role = "Translator"
            elif any(x in role_kr for x in ['그림', '삽화', '일러스트', '만화', '사진']): role = "Illustrator"
            elif any(x in role_kr for x in ['감수', '편집', '기획', '엮은이', '편저자']): role = "Editor"
            else: role = "Author"
            
            # 알라딘 스타일의 공동 작업자 일괄 부여 로직
            temp_names.append(name)
            for t_name in temp_names:
                contributors.append({'name': t_name, 'role': role})
            temp_names = []
            
        else:
            # C. 네이버 스타일: "이름 지음", "이름 옮김"
            if part.endswith('지음') or part.endswith('저'):
                name = re.sub(r'(지음|저)$', '', part).strip()
                contributors.append({'name': name, 'role': 'Author'})
            elif part.endswith('옮김') or part.endswith('역'):
                name = re.sub(r'(옮김|역)$', '', part).strip()
                contributors.append({'name': name, 'role': 'Translator'})
            elif part.endswith('그림'):
                name = re.sub(r'그림$', '', part).strip()
                contributors.append({'name': name, 'role': 'Illustrator'})
            else:
                # 아무 직함이 없는 순수 이름만 들어온 경우 (공동 작업자 대기)
                temp_names.append(part.strip())
                
    # 남은 대기열 처리
    for t_name in temp_names:
        contributors.append({'name': t_name, 'role': 'Author'})
        
    return contributors