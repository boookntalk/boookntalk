import LibraryClient from './LibraryClient';

// 백엔드 API에서 데이터 호출
async function getLibraryData(email: string) {
    const res = await fetch(`http://localhost:8000/api/my-library/${email}`, {
        cache: 'no-store', // 실시간성 유지
    });
    if (!res.ok) return [];
    return res.json();
}

export default async function LibraryPage() {
    // 실제 서비스에서는 세션에서 email을 가져와야 합니다.
    // 테스트용으로 등록하신 이메일을 사용하세요.
    const userEmail = "boookntalk@gmail.com"; 
    const books = await getLibraryData(userEmail);

    return <LibraryClient initialBooks={books} />;
}