import asyncio
import httpx
import json

# ▼▼▼ 여기에 발급받은 알라딘 TTBKey를 넣어주세요 ▼▼▼
TTB_KEY = "ttbsppamsspam2112001" 

# 테스트할 책: 해리포터와 마법사의 돌 1 (ISBN: 9788983927620)
TEST_ISBN = "9788983927620"

async def check_author_info():
    # ItemLookUp: ISBN으로 상품 상세 정보를 조회하는 API
    url = f"http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey={TTB_KEY}&itemIdType=ISBN13&ItemId={TEST_ISBN}&Output=js&Version=20131101&OptResult=authors"

    print(f"🚀 요청 URL: {url}")

    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()

        if "item" in data:
            item = data["item"][0]
            print("\n✅ [도서 정보 확인]")
            print(f"제목: {item.get('title')}")
            print(f"작가(문자열): {item.get('author')}")
            
            # 여기가 핵심입니다! (subInfo -> authors)
            if "subInfo" in item and "authors" in item["subInfo"]:
                print("\n🎉 [작가 상세 정보 (ID 포함 여부 확인)]")
                print(json.dumps(item["subInfo"]["authors"], indent=2, ensure_ascii=False))
            else:
                print("\n❌ 작가 상세 정보(subInfo)가 없습니다.")
        else:
            print("\n❌ 검색 결과가 없습니다. TTBKey를 확인해주세요.")

# 실행
if __name__ == "__main__":
    asyncio.run(check_author_info())