// 경로: frontend/src/app/(main)/my-records/short-reviews/ShortReviewsClient.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Home, ChevronRight, MessageSquareQuote, Globe, Lock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";

import { BookRecordCard } from '@/components/common/BookRecordCard';
import { SmartTruncatedText } from '@/components/common/SmartTruncatedText';

// 💡 공통 레이아웃 컴포넌트 임포트
import StandardContainer from '@/components/layout/StandardContainer';
import SubPageLayout from '@/components/layout/SubPageLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ShortReviewsClient() {
    const router = useRouter();
    const { data: session, status } = useSession();
    
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
            return;
        }

        if (session?.user?.email) {
            fetchShortReviews(session.user.email);
        }
    }, [session, status, router]);

    const fetchShortReviews = async (email: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/users/${email}/short-reviews`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch (error) {
            console.error("한줄평 데이터 로딩 실패:", error);
            toast.error("데이터를 불러오는 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePublicStatus = async (recordId: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        setReviews(prev => prev.map(r => r.record_id === recordId ? { ...r, is_short_review_public: newStatus } : r));
        try {
            await fetch(`${API_URL}/api/my-library/${recordId}`, { 
                method: 'PATCH', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ is_short_review_public: newStatus }) 
            });
            toast.success(newStatus ? "전체 공개되었습니다." : "비공개되었습니다.");
        } catch {
            setReviews(prev => prev.map(r => r.record_id === recordId ? { ...r, is_short_review_public: currentStatus } : r));
            toast.error("상태 변경 실패");
        }
    };

    if (isLoading || status === 'loading') {
        return (
            // 💡 로딩 화면을 StandardContainer 규격에 맞게 수정
            <StandardContainer size="wide" className="min-h-[60vh] flex flex-col justify-center items-center">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
                    <div className="w-2.5 h-2.5 bg-[#0066cc]/80 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
                    <div className="w-2.5 h-2.5 bg-[#0066cc]/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                </div>
                <p className="text-[13px] font-bold text-gray-400 tracking-wide animate-pulse">
                    한줄평을 불러오는 중...
                </p>
            </StandardContainer>
        );
    }

    return (
        // 💡 모든 외부 div를 걷어내고 SubPageLayout으로 교체
        <SubPageLayout
            breadcrumb={
                <>
                    <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                        <Home size={15} /> <span>홈</span>
                    </Link>
                    <ChevronRight size={14} className="opacity-50" />
                    <span className="text-gray-400">나의 기록</span>
                    <ChevronRight size={14} className="opacity-50" />
                    <span className="text-[#1d1d1f] flex items-center gap-1">
                        <MessageSquareQuote size={14} /> 한줄평
                    </span>
                </>
            }
            titleOrTabs={
                // 💡 H1 폰트 공백 무효화(leading-none, pb-0)로 카드 위치 일치
                <div className="flex items-center gap-3 pb-0 w-full">
                    <h1 className="text-[20px] md:text-[22px] font-black leading-none text-[#1d1d1f] flex items-center gap-2">
                        <MessageSquareQuote size={22} className="text-[#0066cc] fill-blue-100" /> 
                        나의 한줄평
                    </h1>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[12px] font-bold px-2 py-0.5 mt-1">
                        {reviews.length}개
                    </Badge>
                </div>
            }
        >
            <div className="flex flex-col gap-10">
                {reviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-gray-400 bg-white rounded-3xl border border-dashed border-[#E7E2D9] mt-4">
                        <MessageSquareQuote size={40} strokeWidth={1.5} className="mb-3 opacity-30 text-[#0066cc]" />
                        <p className="font-bold text-[14px] text-gray-500 mb-1">아직 남긴 한줄평이 없습니다.</p>
                        <p className="text-[12px] text-gray-400">책을 읽고 짧은 감상을 기록해 보세요!</p>
                    </div>
                ) : (
                    // 💡 그리드 간격을 gap-4 md:gap-6 로 통일하여 다른 화면과 정렬
                    <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {reviews.map((review) => (
                            <BookRecordCard 
                                key={review.record_id} id={review.record_id}
                                onClick={() => router.push(`/library/${review.record_id}`)}
                                book_cover={review.cover} book_title={review.title} book_author={review.author}
                                rating={review.rating}
                                children={
                                    // 💡 요청하신 대로 본문 폰트 사이즈를 한 단계 줄이고 줄간격을 조절했습니다 (text-[13px] leading-relaxed)
                                    <SmartTruncatedText 
                                        content={review.short_review} 
                                        wrapQuotes={true} 
                                        textClassName="text-[14px] text-[#1d1d1f] font-medium leading-relaxed" 
                                    />
                                }
                                footerLeft={<><Calendar size={12} /> {review.created_at?.split('T')[0]}</>}
                                footerRight={
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation(); // 카드 클릭 이동 방지
                                            togglePublicStatus(review.record_id, review.is_short_review_public);
                                        }} 
                                        className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${review.is_short_review_public ? 'text-[#0066cc] bg-blue-50 hover:bg-blue-100' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
                                    >
                                        {review.is_short_review_public ? <Globe size={10}/> : <Lock size={10}/>} {review.is_short_review_public ? '전체 공개' : '나만 보기'}
                                    </button>
                                }
                            />
                        ))}
                    </main>
                )}
            </div>
        </SubPageLayout>
    );
}