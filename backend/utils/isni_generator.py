# 파일 경로: backend/utils/isni_generator.py
# 역할 및 기능: ISNI가 없는 작가를 식별하기 위해 BoooknTalk 전용 임시 ISNI 코드를 생성합니다.

import uuid
from datetime import datetime

# 함수 기능: 'BKT-TEMP-연월일시-UUID' 형태의 절대 중복되지 않는 임시 ISNI 코드를 반환합니다.
def generate_temp_isni() -> str:
    """
    예시 출력: BKT-TEMP-20260325-a1b2c3d4
    """
    # 날짜를 넣어두면 이 임시 코드가 언제 발급되었는지 추적하기 쉽습니다.
    date_str = datetime.now().strftime("%Y%m%d")
    # UUID 앞 8자리만 잘라서 써도 충돌 확률은 0에 가깝습니다.
    short_uuid = str(uuid.uuid4()).split('-')[0]
    
    return f"BKT-TEMP-{date_str}-{short_uuid}"