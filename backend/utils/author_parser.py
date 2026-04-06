# 경로: backend/utils/author_parser.py
# 역할 및 기능: 이름 앞에 붙는 콜론(:)이나 공백을 완벽하게 제거하고 정확한 작가명만 추출합니다.

import re

def parse_author_string(raw_author: str):
    if not raw_author or str(raw_author).strip() == "" or raw_author == "저자 미상":
        return []

    # 1. 구분자에 콜론(:)을 명시적으로 추가했습니다.
    chunks = re.split(r'[;:,/·|&]', str(raw_author))

    parsed_chunks = []
    ROLE_REGEX = {
        "TRANSLATOR": r'(옮김|번역|옮긴이|역자|편역|공역|우리말|역)',
        "ILLUSTRATOR": r'(그림|그린이|일러스트|일러스트레이터|만화|작화|사진|화보|삽화)',
        "AUTHOR": r'(지음|저자|지은이|글|원작|씀|스토리|극본|각본|원안|기획|저|원저|엮음|편저|엮은이|편저자|편집|편|감수)'
    }

    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk: continue

        chunk = re.sub(r'[\[\]<>]', '', chunk)
        explicit_role = None
        name = chunk

        if re.search(ROLE_REGEX["TRANSLATOR"], chunk):
            explicit_role = "TRANSLATOR"
            name = re.sub(ROLE_REGEX["TRANSLATOR"], '', name)
        elif re.search(ROLE_REGEX["ILLUSTRATOR"], chunk):
            explicit_role = "ILLUSTRATOR"
            name = re.sub(ROLE_REGEX["ILLUSTRATOR"], '', name)
        elif re.search(ROLE_REGEX["AUTHOR"], chunk):
            explicit_role = "AUTHOR"
            name = re.sub(ROLE_REGEX["AUTHOR"], '', name)

        # 2. 이름 앞뒤에 남은 콜론(:)이나 지저분한 기호를 강제로 제거합니다.
        name = re.sub(r'^[:\s]+', '', name) # 시작 부분의 콜론과 공백 제거
        name = re.sub(r'외\s*\d+명?', '', name)
        name = re.sub(r'[\(\)]', '', name) 
        name = name.strip()

        if name:
            parsed_chunks.append({"name": name, "explicit_role": explicit_role})

    results = []
    current_role = "AUTHOR"
    for item in reversed(parsed_chunks):
        if item["explicit_role"]:
            current_role = item["explicit_role"]
        results.insert(0, {"name": item["name"], "role": current_role})

    return results