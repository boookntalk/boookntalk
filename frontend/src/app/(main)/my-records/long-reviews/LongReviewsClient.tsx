// 경로: frontend/src/app/(main)/my-records/long-reviews/LongReviewsClient.tsx
// 역할 및 기능: BoooknTalk 긴줄평 목록을 렌더링하는 클라이언트 컴포넌트. 
// 업데이트: SubPageLayout을 적용하여 1cm 영점 조절 룰을 준수하고, 기획자님 요청에 따라 본문 폰트를 14px(text-[14px])로 최적화했습니다.

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Home, ChevronRight, PenTool, Globe, Lock, Calendar, AlertTriangle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

import { BookRecordCard } from '@/components/common/BookRecordCard';

// 💡 공통 레이아웃 컴포넌트 임포트
import StandardContainer from '@/components/layout/StandardContainer';
import SubPageLayout from '@/components/layout/SubPageLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LongReviewsClient() {
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
            fetchLongReviews(session.user.email);
        }
    }, [session, status, router]);

    /**
     * 기능: 사용자의 긴줄평 목록을 서버에서 불러옵니다.
     */
    const fetchLongReviews = async (email: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/users/${email}/long-reviews`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch (error) {
            console.error("긴줄평 데이터 로딩 실패:", error);
            toast.error("데이터를 불러오는 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 기능: 긴줄평의 공개/비공개 상태를 전환합니다. (Optimistic UI)
     */
    const togglePublicStatus = async (e: React.MouseEvent, recordId: number, isDraft: boolean) => {
        e.stopPropagation(); 
        const newDraftStatus = !isDraft; 
        
        setReviews(prev => prev.map(r => r.record_id === recordId ? { ...r, is_long_review_draft: newDraftStatus } : r));
        
        try {
            await fetch(`${API_URL}/api/records/${recordId}/long-review`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_long_review_draft: newDraftStatus })
            });
            toast.success(newDraftStatus ? "비공개(임시저장) 상태로 전환되었습니다." : "광장에 전체 공개되었습니다.");
        } catch {
            setReviews(prev => prev.map(r => r.record_id === recordId ? { ...r, is_long_review_draft: isDraft } : r));
            toast.error("상태 변경에 실패했습니다.");
        }
    };

    if (isLoading || status === 'loading') {
        return (
            <StandardContainer size="wide" className="min-h-[60vh] flex flex-col justify-center items-center">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
                    <div className="w-2.5 h-2.5 bg-[#0066cc]/80 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
                    <div className="w-2.5 h-2.5 bg-[#0066cc]/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                </div>
                <p className="text-[13px] font-bold text-gray-400 tracking-wide animate-pulse">
                    긴줄평을 불러오는 중...
                </p>
            </StandardContainer>
        );
    }

    return (
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
                        <PenTool size={14} /> 긴줄평
                    </span>
                </>
            }
            titleOrTabs={
                // 💡 [영점 조절] H1 태그의 기본 여백을 깎아내기 위한 pb-0, leading-none 적용
                <div className="flex items-center gap-3 pb-0 w-full">
                    <h1 className="text-[20px] md:text-[22px] font-black leading-none text-[#1d1d1f] flex items-center gap-2">
                        <PenTool size={22} className="text-[#0066cc] fill-blue-100" /> 
                        나의 긴줄평
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
                        <PenTool size={40} strokeWidth={1.5} className="mb-3 opacity-30 text-[#0066cc]" />
                        <p className="font-bold text-[14px] text-gray-500 mb-1">아직 작성된 긴줄평이 없습니다.</p>
                        <p className="text-[12px] text-gray-400">서재에서 책을 선택해 깊이 있는 사색을 남겨보세요.</p>
                    </div>
                ) : (
                    // 💡 그리드 간격을 gap-4 md:gap-6 로 통일하여 화면 전환 시 어긋남 방지
                    <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {reviews.map((review, index) => {
                            const isDraft = review.is_long_review_draft;
                            const uniqueKey = `review-${review.record_id || 'empty'}-${index}`;
                            
                            return (
                                <BookRecordCard 
                                    key={uniqueKey}
                                    id={review.record_id || index}
                                    onClick={() => router.push(`/library/${review.record_id}`)}
                                    book_cover={review.cover}
                                    book_title={review.title}
                                    book_author={review.author}
                                    children={
                                        <div className="flex flex-col h-full flex-1">
                                            {review.is_spoiler && (
                                                <span className="w-fit mb-2 text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 flex items-center gap-1">
                                                    <AlertTriangle size={10}/> 스포일러 포함
                                                </span>
                                            )}
                                            {/* 긴줄평 제목: 15px 블랙 폰트 유지 */}
                                            <h4 className="font-black text-[#1d1d1f] text-[15px] mb-2 line-clamp-1">{review.long_review_title || '제목 없음'}</h4>
                                            
                                            {/* 💡 기획자님 표준: 본문 폰트 14px 적용(text-[14px]) */}
                                            <p className="text-[14px] text-gray-600 leading-relaxed line-clamp-3 break-keep">
                                                {(review.long_review_content || '')
                                                    .replace(/<[^>]*>?/gm, '') // HTML 태그 제거
                                                    .replace(/&nbsp;/g, ' ')
                                                    .trim()}
                                            </p>
                                        </div>
                                    }
                                    footerLeft={<><Calendar size={12} /> {review.updated_at?.split('T')[0] || review.created_at?.split('T')[0] || '날짜 없음'}</>}
                                    footerRight={
                                        <button 
                                            onClick={(e) => togglePublicStatus(e, review.record_id, isDraft)} 
                                            className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${!isDraft ? 'text-[#0066cc] bg-blue-50 hover:bg-blue-100' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
                                            title="클릭하여 상태 변경"
                                        >
                                            {!isDraft ? <Globe size={11}/> : <Lock size={11}/>}
                                            {!isDraft ? '전체 공개' : '비공개'}
                                        </button>
                                    }
                                />
                            );
                        })}
                    </main>
                )}
            </div>
        </SubPageLayout>
    );
}