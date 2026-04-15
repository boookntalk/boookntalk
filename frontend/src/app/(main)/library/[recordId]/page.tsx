// 경로: src/app/(main)/library/[recordId]/page.tsx
// 역할: 도서 상세 페이지 서버 컴포넌트. 최상위 레이아웃이 주입하는 1cm 상단 여백을 마이너스 마진으로 상쇄하여 글로벌 헤더와 완벽하게 밀착시킵니다.

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
        }
    } catch (error) {
        console.error("API Connection Error (Backend status check needed):", error);
    }

    // 5. 데이터 로딩 실패 시 UI (사용자 경험 고려)
    if (!initialData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-gray-500 font-medium text-[16px]">도서 정보를 불러올 수 없습니다.</p>
                <p className="text-gray-400 text-[14px]">해당 기록이 삭제되었거나 서버 연결에 문제가 있습니다.</p>
                <a href="/library" className="px-6 py-2 bg-[#1d1d1f] text-white font-bold rounded-xl hover:bg-black transition-colors">
                    서재로 돌아가기
                </a>
            </div>
        );
    }

    return (
        // 💡 [핵심 영점 조절] 부모 레이아웃(layout.tsx)이 강제로 밀어낸 1cm(32px)를 
        // 다시 -mt-[var(--spacing-1cm,32px)] 로 끌어올려서 헤더에 틈 없이 자석처럼 붙여버립니다!
        <div className="w-full h-full -mt-[var(--spacing-1cm,32px)] relative z-10">
            {/* 클라이언트 컴포넌트에 세밀한 데이터 전달 */}
            <BookDetailClient initialData={initialData} user={session.user} />
        </div>
    );
}