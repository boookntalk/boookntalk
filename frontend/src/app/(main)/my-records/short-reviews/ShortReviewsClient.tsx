'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ChevronRight, MessageSquareQuote, Star, Globe, Lock, BookType } from 'lucide-react';
import Container from '@/components/layout/Container';
import { toast } from 'sonner';

export default function ShortReviewsClient({ initialReviews, user }: { initialReviews: any[], user: any }) {
    const router = useRouter();
    const [reviews, setReviews] = useState(initialReviews);

    // 공개/비공개 즉시 토글 (낙관적 업데이트 적용)
    const togglePublicStatus = async (recordId: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        
        // UI 즉시 반영 (0.1초 컷)
        setReviews(prev => prev.map(r => r.record_id === recordId ? { ...r, is_short_review_public: newStatus } : r));
        
        try {
            const res = await fetch(`http://localhost:8000/api/my-library/${recordId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_short_review_public: newStatus })
            });
            if (!res.ok) throw new Error("업데이트 실패");
            toast.success(newStatus ? "이 한줄평을 라운지에 공개합니다." : "이 한줄평을 나만 봅니다.");
        } catch (error) {
            // 실패 시 원상복구
            setReviews(prev => prev.map(r => r.record_id === recordId ? { ...r, is_short_review_public: currentStatus } : r));
            toast.error("상태 변경에 실패했습니다.");
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#F5F5F7]">
            {/* 상단 고정 헤더 (유리창 효과 및 수평 정렬) */}
            <div className="flex-none bg-[#F5F5F7]/90 backdrop-blur-md z-30 pt-8 border-b border-gray-200">
                <Container>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 py-2.5 text-[13px] font-bold text-gray-400">
                            <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                                <Home size={15} />
                                <span>홈</span>
                            </Link>
                            <ChevronRight size={14} className="opacity-50" />
                            <span className="text-[#1d1d1f]">나의 기록</span>
                            <ChevronRight size={14} className="opacity-50" />
                            <span className="text-[#1d1d1f]">나의 한줄평</span>
                        </div>
                    </div>
                </Container>
            </div>

            {/* 메인 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                <Container className="pt-8 pb-32">
                    
                    {/* 타이틀 및 카운트 */}
                    <div className="flex items-center gap-3 mb-8">
                        <MessageSquareQuote className="text-[#0066cc]" size={28} />
                        <h2 className="text-2xl font-extrabold text-[#1d1d1f] tracking-tight">나의 한줄평</h2>
                        <span className="text-sm font-bold text-[#0066cc] bg-blue-50 px-3 py-1 rounded-full border border-blue-100/50 shadow-sm">
                            {reviews.length}
                        </span>
                    </div>

                    {reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-[24px] border border-gray-100 shadow-sm">
                            <MessageSquareQuote size={48} className="mb-4 opacity-20" />
                            <p className="font-bold text-[16px] text-gray-500 mb-1">아직 남긴 한줄평이 없습니다.</p>
                            <p className="text-sm">서재에서 책을 완독하고 첫 번째 사색을 기록해보세요.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {reviews.map((review) => (
                                <div key={review.record_id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
                                    
                                    {/* 상단: 도서 정보 영역 */}
                                    <div 
                                        className="flex items-start gap-4 mb-4 pb-4 border-b border-gray-50 cursor-pointer"
                                        onClick={() => router.push(`/library/${review.record_id}`)}
                                    >
                                        <div className="relative w-14 aspect-[1/1.45] rounded-md overflow-hidden bg-gray-50 flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200">
                                            {review.cover ? (
                                                <Image src={review.cover} alt={review.title} fill className="object-cover" unoptimized />
                                            ) : <BookType className="w-full h-full p-3 text-gray-300"/>}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <h3 className="font-bold text-[#1d1d1f] text-[15px] leading-snug line-clamp-2 group-hover:text-[#0066cc] transition-colors">
                                                {review.title}
                                            </h3>
                                            <span className="text-[12px] font-medium text-gray-500 line-clamp-1 mt-1">{review.author}</span>
                                            
                                            <div className="flex items-center gap-0.5 mt-auto pt-2">
                                                {[1,2,3,4,5].map(s => (
                                                    <Star key={s} size={12} fill={s <= review.rating ? "#FFCC00" : "#E5E7EB"} className={s <= review.rating ? "text-[#FFCC00]" : "text-gray-200"} />
                                                ))}
                                                <span className="text-[12px] font-bold text-[#1d1d1f] ml-1.5">{review.rating}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 중단: 한줄평 텍스트 */}
                                    <div className="flex-1 mb-6">
                                        <p className="text-[15px] text-gray-700 leading-relaxed font-medium break-keep">
                                            "{review.short_review}"
                                        </p>
                                    </div>

                                    {/* 하단: 컨트롤 (날짜 & 공개토글) */}
                                    <div className="flex items-center justify-between mt-auto pt-1">
                                        <span className="text-[11px] text-gray-400 font-semibold tracking-wide">
                                            {review.created_at ? review.created_at.split('T')[0] : ''}
                                        </span>
                                        
                                        <button 
                                            onClick={() => togglePublicStatus(review.record_id, review.is_short_review_public)}
                                            className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors ${
                                                review.is_short_review_public 
                                                ? 'text-[#0066cc] bg-blue-50 hover:bg-blue-100' 
                                                : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                                            }`}
                                            title="클릭하여 상태 변경"
                                        >
                                            {review.is_short_review_public ? <Globe size={12}/> : <Lock size={12}/>}
                                            {review.is_short_review_public ? '전체 공개' : '나만 보기'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Container>
            </div>
        </div>
    );
}