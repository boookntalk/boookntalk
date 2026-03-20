'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react'; // ▼ 세션 임포트 추가
import Link from 'next/link';
import { Home, ChevronRight, PenTool, Globe, Lock, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

import { BookRecordCard } from '@/components/common/BookRecordCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LongReviewsClient() {
    const router = useRouter();
    const { data: session, status } = useSession(); // ▼ 로그인 정보 가져오기
    
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // ▼▼▼ [핵심] 실제 긴줄평 데이터 불러오기 로직 ▼▼▼
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/'); 
            return;
        }

        if (session?.user?.email) {
            fetchLongReviews(session.user.email);
        }
    }, [session, status, router]);

    const fetchLongReviews = async (email: string) => {
        setIsLoading(true);
        try {
            // ▼▼▼ [핵심] 엉뚱한 /records 대신, 방금 만든 진짜 API를 호출합니다! ▼▼▼
            const res = await fetch(`${API_URL}/api/users/${email}/long-reviews`);
            if (res.ok) {
                const data = await res.json();
                
                // 백엔드에서 이미 빈 껍데기를 다 걸러서 보내주므로, 
                // 프론트에서는 아무것도 고민할 필요 없이 그대로 세팅만 하면 끝!
                setReviews(data);
            }
        } catch (error) {
            console.error("긴줄평 데이터 로딩 실패:", error);
            toast.error("데이터를 불러오는 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

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

    // ▼▼▼ [적용 완료] 2. 모던 바운싱 도트 (Bouncing Dots) 로딩 화면 ▼▼▼
    if (isLoading || status === 'loading') {
        return (
            <div className="w-full h-[calc(100vh-100px)] bg-[#F5F5F7] flex flex-col justify-center items-center">
                <div className="flex items-center gap-2 mb-4">
                    {/* 첫 번째 점: 가장 먼저 튀어오름 */}
                    <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
                    {/* 두 번째 점: 살짝 늦게 튀어오름 */}
                    <div className="w-2.5 h-2.5 bg-[#0066cc]/80 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
                    {/* 세 번째 점: 마지막에 튀어오름 */}
                    <div className="w-2.5 h-2.5 bg-[#0066cc]/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                </div>
                {/* BoooknTalk 감성에 맞는 로딩 텍스트 */}
                <p className="text-[13px] font-bold text-gray-400 tracking-wide animate-pulse">
                    긴줄평을 불러오는 중...
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-[#F5F5F7]">
            {/* 상단 네비게이션 영역 */}
            <div className="flex-none bg-[#F5F5F7]/90 backdrop-blur-md z-30 pt-4 px-[var(--spacing-1cm,32px)] border-b border-gray-200 sticky top-0 transition-all">
                <div className="flex items-center justify-between mb-4 min-h-[20px]">
                    <div className="flex items-center gap-2 text-[13px] font-bold text-gray-400">
                        <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc]"><Home size={15} /> 홈</Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-gray-400">나의 기록</span>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-[#1d1d1f] flex items-center gap-1"><PenTool size={14} /> 긴줄평</span>
                    </div>
                </div>
                <div className="flex flex-col mb-4 min-h-[32px]">
                    <div className="flex items-center gap-3">
                        <h1 className="text-[22px] font-black text-[#1d1d1f] flex items-center gap-2">
                            <PenTool size={24} className="text-[#0066cc] fill-blue-100" /> 나의 긴줄평
                        </h1>
                        <Badge variant="secondary" className="bg-gray-200/50 text-gray-500 text-[12px] font-bold px-2 py-0.5">
                            {reviews.length}개
                        </Badge>
                    </div>
                </div>
            </div>

            {/* 본문 영역 */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="p-[var(--spacing-1cm,32px)] pt-6 pb-32">
                    {reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400 bg-white rounded-sm p-4 shadow-sm border border-dashed border-gray-200 mt-4">
                            <PenTool size={40} strokeWidth={1.5} className="mb-3 opacity-30 text-[#0066cc]" />
                            <p className="font-bold text-[14px] text-gray-500 mb-1">아직 작성된 긴줄평이 없습니다.</p>
                            <p className="text-[12px] text-gray-400">서재에서 책을 선택해 깊이 있는 사색을 남겨보세요.</p>
                        </div>
                    ) : (
                        <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
                            {/* ▼ map 함수에 index 추가 */}
                            {reviews.map((review, index) => {
                                const isDraft = review.is_long_review_draft;
                                
                                {/* ▼▼▼ [핵심] record_id가 중복되거나 없어도 절대 에러가 나지 않는 완벽한 고유 키 생성 ▼▼▼ */}
                                const uniqueKey = `review-${review.record_id || 'empty'}-${index}`;
                                
                                return (
                                    <BookRecordCard 
                                        key={uniqueKey} // <- 에러를 잠재우는 마법의 Key
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
                                                <h4 className="font-black text-[#1d1d1f] text-[15px] mb-2 line-clamp-1">{review.long_review_title || '제목 없음'}</h4>
                                                
                                                {/* ▼▼▼ [핵심 수정] 툴팁(SmartTruncatedText)을 제거하고, 3줄 말줄임(line-clamp-3) 텍스트로 깔끔하게 교체 ▼▼▼ */}
                                                <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-3 break-keep">
                                                    {(review.long_review_content || '')
                                                        .replace(/<[^>]*>?/gm, '') // HTML 태그 제거
                                                        .replace(/&nbsp;/g, ' ')   // 에디터 공백 제거
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
            </div>
        </div>
    );
}