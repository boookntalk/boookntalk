import React from 'react';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BookDetailClient from '@/components/book-detail/BookDetailClient';

// 항상 최신 데이터를 보여주기 위한 설정
export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ recordId: string }>; // Next.js 15 규격: Promise로 정의
}

export default async function BookDetailPage({ params }: PageProps) {
    const session = await getServerSession(authOptions);

    // 1. 세션 체크 (상용 서비스 보안)
    if (!session?.user?.email) {
        redirect("/");
    }

    // 2. Next.js 15 대응: params를 await로 수신
    const resolvedParams = await params;
    const recordId = resolvedParams.recordId;

    if (isNaN(Number(recordId))) {
        console.warn(`[라우팅 방어] 잘못된 recordId 접근 방단: ${recordId}`);
        return null; // Next.js가 올바른 /tags 폴더를 찾도록 렌더링을 조용히 중단합니다.
    }

    // 3. 방어적 코드: recordId가 유효하지 않으면 조기 리턴
    if (!recordId || recordId === 'undefined') {
        console.error("Invalid recordId path:", recordId);
        redirect("/library");
    }

    let initialData = null;

    try {
        // 4. 백엔드 API 호출 
        // 팁: 백엔드 주소가 /api/records 인지 /api/library 인지 확인 필요 (현재 로그는 records)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/records/${recordId}`, {
            cache: "no-store",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (res.ok) {
            initialData = await res.json();
        } else {
            console.error(`Failed to fetch record detail: ${res.status}`);
            // 422 에러가 발생하면 백엔드의 데이터 타입 정의를 확인해야 합니다.
        }
    } catch (error) {
        console.error("API Connection Error (Backend status check needed):", error);
    }

    // 5. 데이터 로딩 실패 시 UI (사용자 경험 고려)
    if (!initialData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-gray-500 font-medium text-lg">도서 정보를 불러올 수 없습니다.</p>
                <p className="text-gray-400 text-sm">해당 기록이 삭제되었거나 서버 연결에 문제가 있습니다.</p>
                <a href="/library" className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
                    서재로 돌아가기
                </a>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-[#F5F5F7] pb-20">
            {/* 클라이언트 컴포넌트에 세밀한 데이터 전달 */}
            <BookDetailClient initialData={initialData} user={session.user} />
        </div>
    );
}