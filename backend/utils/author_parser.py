import re

def parse_author_string(author_str: str):
    """
    입력: "J.K. 롤링 (지은이), 강동혁 (옮긴이)"
    출력: [{'name': 'J.K. 롤링', 'role': 'Author'}, {'name': '강동혁', 'role': 'Translator'}]
    """
    if not author_str:
        return []

    contributors = []
    parts = author_str.split(',')
    
    for part in parts:
        part = part.strip()
        match = re.match(r"(.+)\s\((.+)\)", part)
        
        if match:
            name = match.group(1).strip()
            role_kr = match.group(2).strip()
            
            role = "Unknown"
            if any(x in role_kr for x in ['지은이', '저자', '글']):
                role = "Author"
            elif any(x in role_kr for x in ['옮긴이', '역자', '번역']):
                role = "Translator"
            elif any(x in role_kr for x in ['그림', '삽화']):
                role = "Illustrator"
            elif any(x in role_kr for x in ['감수', '편집']):
                role = "Editor"
            
            contributors.append({'name': name, 'role': role})
        else:
            if part:
                contributors.append({'name': part, 'role': 'Author'})
                
    return contributors