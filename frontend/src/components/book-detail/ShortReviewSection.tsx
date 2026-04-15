// 파일 경로: src/app/(main)/library/[id]/ShortReviewSection.tsx
// 역할 및 기능: 도서 상세 페이지의 '한줄평' 탭을 담당하며, 독서노트(MemoryLayer)와 동일한 둥근 모서리와 14px 표준 본문 폰트를 적용하여 일관된 UX를 제공합니다.

'use client';

import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, Edit3, Trash2 } from 'lucide-react';
import Link from 'next/link';
import FollowButton from '@/components/common/FollowButton';

interface ShortReviewSectionProps {
    editionId: number;
    onDataLoaded?: (count: number) => void;
    currentUser?: any; 
    onEditClick?: (review: any) => void; 
    onDeleteClick?: (reviewId: number) => void; 
}

export default function ShortReviewSection({ editionId, onDataLoaded, currentUser, onEditClick, onDeleteClick }: ShortReviewSectionProps) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/editions/${editionId}/short-reviews`);
                if (res.ok) {
                    const data = await res.json();
                    setReviews(data);
                    if (onDataLoaded) onDataLoaded(data.length);
                } else {
                    setReviews([]);
                    if (onDataLoaded) onDataLoaded(0);
                }
            } catch (error) {
                console.error("Failed to fetch short reviews", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (editionId) fetchReviews();
    }, [editionId, onDataLoaded]);

    const sortedReviews = React.useMemo(() => {
        if (!currentUser || !currentUser.email) return reviews;
        
        const myReviews = reviews.filter(r => r.user_email === currentUser.email);
        const otherReviews = reviews.filter(r => r.user_email !== currentUser.email);
        
        return [...myReviews, ...otherReviews];
    }, [reviews, currentUser]);

    const renderStars = (rating: number, size: number = 12) => {
        return (
            <div className="flex text-[#FFCC00] gap-0.5" title={`별점 ${rating}점`}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={size} fill={star <= rating ? "currentColor" : "none"} className={star <= rating ? "text-[#FFCC00]" : "text-gray-300"} />
                ))}
            </div>
        );
    };

    if (isLoading) return <div className="py-20 text-center text-gray-400 text-[13px] font-bold animate-pulse">한줄평을 불러오는 중입니다...</div>;

    if (reviews.length === 0) return (
         <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-200 border-dashed">
            <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold text-[14px]">아직 작성된 한줄평이 없습니다.</p>
            <p className="text-[12px] mt-1 text-gray-400">우측 하단의 펜 버튼을 눌러 첫 한줄평을 남겨보세요.</p>
        </div>
    );

    return (
        // 💡 [영점 조절] gap-4를 주어 카드 사이의 여백을 1cm 시스템에 맞게 최적화
        <div className="flex flex-col gap-4 pb-20">
            {sortedReviews.map((review) => {
                const isMine = currentUser && review.user_email && (currentUser.email === review.user_email);

                return (
                // 💡 [수자인 통일] MemoryLayer와 동일하게 rounded-2xl 적용
                <div key={review.id} className={`group px-6 py-5 md:px-8 md:py-6 transition-all flex flex-col md:flex-row md:items-center gap-4 md:gap-6 ${
                    isMine 
                    ? 'bg-white border-2 border-[#1d1d1f] rounded-2xl shadow-md z-10' 
                    : 'bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-gray-300'
                }`}>
                    
                    {/* 1. 좌측: 프로필 및 닉네임 영역 */}
                    <div className="flex items-center gap-2.5 shrink-0 md:w-[140px]">
                        {isMine ? (
                            <div className="flex items-center gap-2.5 group/profile cursor-default">
                                {review.user_image ? (
                                    <img src={review.user_image} alt="profile" className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[11px] text-gray-500 font-bold border border-gray-200">
                                        {review.user_name?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <span className="text-[13px] font-bold text-[#1d1d1f] truncate">
                                    {review.user_name}
                                </span>
                            </div>
                        ) : (
                            <Link href={`/library/user/${review.user_id}`} className="flex items-center gap-2.5 group/profile">
                                {review.user_image ? (
                                    <img src={review.user_image} alt="profile" className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[11px] text-gray-500 font-bold border border-gray-200">
                                        {review.user_name?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <span className="text-[13px] font-bold text-[#1d1d1f] truncate group-hover/profile:underline underline-offset-2 decoration-gray-400">
                                    {review.user_name}
                                </span>
                            </Link>
                        )}
                    </div>

                    {/* 2. 중앙: 한줄평 본문 */}
                    <div className="flex-1 min-w-0">
                        {/* 💡 기획자님 표준: 본문 폰트 14px 적용(text-[14px]) */}
                        <p className="text-[14px] leading-relaxed text-[#1d1d1f] font-medium break-keep cursor-default">
                            "{review.short_review}"
                        </p>
                    </div>

                    {/* 3. 우측: 고정 너비 영역 */}
                    <div className="flex items-center shrink-0 gap-3 md:gap-4 mt-2 md:mt-0 justify-between md:justify-end w-full md:w-auto border-t border-gray-50 pt-3 md:border-none md:pt-0">
                        
                        <div className="flex items-center gap-3">
                            <div className="w-[90px] flex justify-start md:justify-end whitespace-nowrap">
                                {!isMine && currentUser && (
                                    <div className="scale-[0.85] transform origin-left md:origin-right">
                                        <FollowButton 
                                            targetUserId={review.user_id}
                                            currentUserEmail={currentUser.email}
                                            initialIsFollowing={review.is_following || false} 
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="w-auto md:w-[90px] flex items-center justify-center">
                                <span className={`text-[12px] font-bold leading-none ${isMine ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {review.created_at?.split('T')[0]}
                                </span>
                            </div>
                        </div>

                        <div className="w-auto md:w-[80px] flex justify-end">
                            {isMine ? (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => onEditClick?.(review)} className="p-1.5 text-gray-400 hover:text-[#0066cc] hover:bg-blue-50 rounded-lg transition-colors" title="수정">
                                        <Edit3 size={15} />
                                    </button>
                                    <button onClick={() => onDeleteClick?.(review.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="삭제">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 items-center justify-center gap-1.5">
                                    {renderStars(review.rating, 11)}
                                </div>
                            )}
                        </div>
                        
                    </div>
                </div>
            )})}
        </div>
    );
}