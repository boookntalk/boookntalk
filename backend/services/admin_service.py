# 파일 경로: backend/services/admin_service.py
from sqlalchemy.orm import Session
from models import Contributor, WorkContributor

# ▼ [수정] 정규식 대신 정확도 100%의 끝단어(endswith) 매칭 슬라이서로 변경!
def cleanse_author_name(raw_name: str) -> str:
    if not raw_name:
        return ""
    
    cleaned = raw_name
    # 띄어쓰기가 포함된 명확한 꼬리표만 타겟팅하여 '김소설' 같은 정상 이름 파괴 방지
    stopwords_with_space = [' 장편소설', ' 소설', ' 지음', ' 저', ' 옮김', ' 번역', ' 그림', ' 엮음', ' 지은이', ' 글']
    
    for word in stopwords_with_space:
        if cleaned.endswith(word):
            # 꼬리표 길이만큼 정확하게 싹둑 자르기
            cleaned = cleaned[:len(cleaned)-len(word)].strip()
            
    return cleaned

def get_merge_mapping():
    return {
        "J.R.R. Tolkien": "J.R.R. 톨킨",
        "J. R. R. 톨킨": "J.R.R. 톨킨",
    }

async def run_cleansing_and_merge(db: Session):
    try:
        print("🧹 [백엔드 로그] 딥 클렌징 수술을 시작합니다...")
        contributors = db.query(Contributor).all()
        merge_map = get_merge_mapping()
        
        cleansed_count = 0
        merged_count = 0

        for contributor in contributors:
            original_name = contributor.name
            cleaned_name = cleanse_author_name(original_name)
            final_name = merge_map.get(cleaned_name, cleaned_name)

            if original_name != final_name:
                target_contributor = db.query(Contributor).filter(Contributor.name == final_name).first()

                if target_contributor and target_contributor.id != contributor.id:
                    print(f"🔗 [병합] '{original_name}' -> '{final_name}'")
                    work_links = db.query(WorkContributor).filter(WorkContributor.contributor_id == contributor.id).all()
                    for link in work_links:
                        link.contributor_id = target_contributor.id
                    
                    if not target_contributor.original_name and original_name != cleaned_name:
                        target_contributor.original_name = original_name
                    
                    db.delete(contributor)
                    merged_count += 1
                else:
                    print(f"✨ [정제] '{original_name}' -> '{final_name}'")
                    contributor.name = final_name
                    cleansed_count += 1
        
        db.commit()
        print(f"✅ [백엔드 로그] 수술 완료! 정제 {cleansed_count}건, 병합 {merged_count}건")
        return {"status": "success", "message": f"작업 완료! 꼬리표 정제 {cleansed_count}건, 파편화 병합 {merged_count}건 성공!"}

    except Exception as e:
        db.rollback()
        print(f"🔴 [백엔드 에러] {str(e)}")
        return {"status": "error", "message": f"수술 중 에러: {str(e)}"}