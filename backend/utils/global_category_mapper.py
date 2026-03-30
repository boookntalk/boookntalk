# 파일 경로: backend/utils/global_category_mapper.py
# 역할 및 기능: 글로벌 도서관 분류 코드(KDC, DDC)의 절대 좌표(숫자)를 분석하여, BoooknTalk 프론트엔드의 이중 레이어 배지 규격에 맞는 3-Depth 계층형 카테고리(문자열)로 변환합니다.

def get_category_hierarchy(kdc_code: str = None, ddc_code: str = None) -> str:
    """
    함수 기능: 도서관 절대 좌표(KDC/DDC)를 파싱하여 '대분류 / 중분류 / 소분류' 형태의 문자열로 매핑합니다. 프론트엔드에서 '/'를 기준으로 분리(Split)하여 렌더링할 수 있도록 포맷팅합니다.
    """
    # 1. KDC (한국 십진분류) 우선 매핑 (한국 도서 기준)
    if kdc_code:
        code = str(kdc_code).strip()
        # 800번대: 문학
        if code.startswith('8'): 
            if code.startswith('81'): return "문학 / 한국문학 / 소설"
            elif code.startswith('84'): return "문학 / 영미문학 / 소설"
            elif code.startswith('83'): return "문학 / 일본문학 / 소설"
            elif code.startswith('82'): return "문학 / 중국문학 / 소설"
            else: return "문학 / 세계문학 / 단행본"
        
        # 300번대: 사회과학 (경제, 법학 등)
        elif code.startswith('3'): 
            if code.startswith('32'): return "경제·경영 / 경제학 / 일반"
            elif code.startswith('36'): return "사회 / 법학 / 일반"
            else: return "인문·사회 / 사회과학 / 일반"
            
        # 100번대: 철학 / 심리학
        elif code.startswith('1'): 
            if code.startswith('18'): return "인문·사회 / 심리학 / 일반"
            else: return "인문·사회 / 철학 / 일반"
            
        # 000번대: 총류 / 컴퓨터
        elif code.startswith('004') or code.startswith('005'):
            return "과학·IT / 컴퓨터공학 / 프로그래밍"

    # 2. DDC (듀이 십진분류) 매핑 (글로벌/영미권 도서 기준 - KDC가 없을 경우)
    if ddc_code:
        code = str(ddc_code).strip()
        if code.startswith('8'): # 800: Literature
            if code.startswith('81') or code.startswith('82'): return "문학 / 영미문학 / 소설"
            else: return "문학 / 세계문학 / 일반"
        elif code.startswith('3'): # 300: Social sciences
            if code.startswith('33'): return "경제·경영 / 경제학 / 일반"
            else: return "인문·사회 / 사회과학 / 일반"

    # 3. 매핑 실패 또는 코드가 없는 경우 기본값 (추후 AI 장르 세탁기가 보완할 영역)
    return "기타 / 미분류 / 일반"