// frontend/src/app/(main)/library/[recordId]/page.tsx
import React from 'react';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BookDetailClient from '@/components/book-detail/BookDetailClient';
// 이 페이지는 항상 최신 데이터를 보여줘야 하므로 동적 렌더링 설정
export const dynamic = 'force-dynamic';

interface PageProps {
    params: { recordId: string };
}

export default async function BookDetailPage({ params }: PageProps) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/");
    }

    const recordId = params.recordId;
    let initialData = null;

    try {
        // 백엔드 API 호출 (위에서 만든 API)
        // 주의: 실제 배포 시에는 process.env.NEXT_PUBLIC_API_URL 사용 권장
        const res = await fetch(`http://localhost:8000/api/records/${recordId}`, {
            cache: "no-store",
        });

        if (res.ok) {
            initialData = await res.json();
        } else {
            console.error("Failed to fetch record detail");
        }
    } catch (error) {
        console.error("API Connection Error:", error);
    }

    if (!initialData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <p className="text-gray-500 mb-4">도서 정보를 불러올 수 없습니다.</p>
                <a href="/library" className="text-blue-600 hover:underline">서재로 돌아가기</a>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-[#F5F5F7] pb-20">
            {/* 클라이언트 컴포넌트로 데이터 전달 */}
            <BookDetailClient initialData={initialData} user={session.user} />
        </div>
    );
}