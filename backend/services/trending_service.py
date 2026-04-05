# 경로: backend/services/trending_service.py
# 역할 및 기능: RecordTag 기준 최상위 태그가 달린 도서의 작가를 추출하고, MAX 5명을 랜덤 로테이션 및 안전한 프로필 이미지를 포함하여 DB를 갱신합니다.

import random
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from models import Contributor, WorkContributor, Work, Record, Edition, GlobalTrendingAuthor, RecordTag, Tag
from utils.image_fetcher import fetch_safe_author_image

# 기능: 최상위 태그에 연결된 도서의 작가 풀을 생성하고, 무작위 5명을 추출해 프로필 이미지와 함께 트렌딩 테이블에 저장합니다.
def update_global_trending_authors(db: Session):
    try:
        # 1. 서재 등록(Record) 기준 최상위 태그 추출 (가장 많이 태깅된 순)
        top_tags = db.query(Tag.id, Tag.name, func.count(RecordTag.tag_id).label('tag_count')) \
            .join(RecordTag, Tag.id == RecordTag.tag_id) \
            .group_by(Tag.id, Tag.name) \
            .order_by(desc('tag_count')) \
            .limit(5).all() # 최상위 태그 풀 확보

        if not top_tags:
            return {"status": "success", "message": "랭킹을 산정할 태그 데이터가 없습니다."}

        # 2. 다이렉트 연결: 태그 -> 도서(Record) -> 판본 -> 작품 -> 작가 추출
        results = db.query(
            Contributor,
            Tag.name.label('tag_name')
        ).select_from(RecordTag) \
         .join(Tag, Tag.id == RecordTag.tag_id) \
         .join(Record, Record.id == RecordTag.record_id) \
         .join(Edition, Edition.id == Record.edition_id) \
         .join(Work, Work.id == Edition.work_id) \
         .join(WorkContributor, WorkContributor.work_id == Work.id) \
         .join(Contributor, Contributor.id == WorkContributor.contributor_id) \
         .filter(WorkContributor.role == 'AUTHOR') \
         .filter(Tag.id.in_([t.id for t in top_tags])) \
         .all()

        # 3. 작가 중복 제거 및 정보 취합 (Pool 생성)
        author_dict = {}
        for row in results:
            contributor = row.Contributor
            c_id = contributor.id

            if c_id not in author_dict:
                author_dict[c_id] = {
                    "id": c_id,
                    "name": contributor.name,
                    "profile_image": getattr(contributor, 'profile_image', None),
                    "keyword": f"#{row.tag_name}", # 해당 작가를 발견한 대표 태그
                    "contributor_obj": contributor # 원본 객체 참조 (업데이트용)
                }

        author_pool = list(author_dict.values())

        # 4. MAX 5명 무작위 로테이션 추출
        selected_authors = random.sample(author_pool, min(5, len(author_pool)))

        # 5. 데이터 정제, 안전한 프로필 이미지 수집 및 DB 갱신
        new_trending_data = []
        for index, author in enumerate(selected_authors): 
            # 작가 마스터(Contributor)에 프로필 사진이 비어있다면, 위키피디아에서 안전하게 수집 시도
            current_profile_img = author["profile_image"]
            if not current_profile_img:
                fetched_img = fetch_safe_author_image(author["name"])
                if fetched_img:
                    current_profile_img = fetched_img
                    # 다음번 갱신을 위해 마스터 테이블에도 저장
                    author["contributor_obj"].profile_image = fetched_img

            new_trending_data.append(
                GlobalTrendingAuthor(
                    rank=index + 1,
                    contributor_id=author["id"],
                    author_name=author["name"],
                    author_profile_image=current_profile_img,
                    top_keyword=author["keyword"],
                    mention_count=0 # 단순 랭킹이 아니므로 기본값 또는 생략 가능
                )
            )

        db.query(GlobalTrendingAuthor).delete()
        db.add_all(new_trending_data)
        db.commit()

        return {"status": "success", "message": f"{len(new_trending_data)}명의 작가가 성공적으로 로테이션되었습니다."}

    except Exception as e:
        db.rollback()
        print(f"Error updating trending authors: {e}")
        return {"status": "error", "message": str(e)}