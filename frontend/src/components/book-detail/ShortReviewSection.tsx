// 파일 경로: src/components/book-detail/ShortReviewSection.tsx
// 역할 및 기능: 도서 상세 페이지의 '한줄평' 탭 영역을 담당하며, FAB 버튼을 대체하는 인라인 작성 버튼을 빈 상태와 목록 상단에 배치하여 완벽한 UX를 제공합니다.

'use client';

import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, Edit3, Trash2, PenTool } from 'lucide-react';
import Link from 'next/link';
import FollowButton from '@/components/common/FollowButton';

interface ShortReviewSectionProps {
    editionId: number;
    onDataLoaded?: (count: number) => void;
    currentUser?: any; 
    onEditClick?: (review: any) => void; 
    onDeleteClick?: (reviewId: number) => void;
    onWriteClick?: () => void; // 💡 새 한줄평 작성 버튼 클릭 이벤트 추가 (부모로부터 전달받음)
}

export default function ShortReviewSection({ editionId, onDataLoaded, currentUser, onEditClick, onDeleteClick, onWriteClick }: ShortReviewSectionProps) {
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

    // 💡 현재 사용자가 리뷰를 작성했는지 여부 확인
    const hasMyReview = currentUser && reviews.some(r => r.user_email === currentUser.email);

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

    // 💡 리뷰가 아예 없을 때 (Empty State)
    if (reviews.length === 0) return (
         <div className="w-full bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center py-16 mb-[var(--spacing-1cm,32px)]">
            <div className="mb-4">
                <MessageSquare size={36} className="text-gray-200" strokeWidth={1.5} />
            </div>
            <h3 className="text-[16px] font-bold text-[#1d1d1f] mb-2">아직 작성된 한줄평이 없습니다.</h3>
            <p className="text-[14px] text-gray-400 mb-6">
                첫 번째 한줄평을 남겨 BoooknTalk 광장을 빛내주세요.
            </p>
            {/* 중앙 인라인 버튼 (기존 FAB 동작 수행) */}
            <button
                onClick={onWriteClick}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#1d1d1f] hover:bg-black text-white text-[14px] font-bold shadow-md transition-transform hover:scale-105 active:scale-95"
            >
                <PenTool size={16} />
                한줄평 작성하기
            </button>
        </div>
    );

    return (
        <div className="flex flex-col mb-[var(--spacing-1cm,32px)] pb-10">
            
            {/* 💡 [UX 보완] 다른 사람의 리뷰는 있지만 내 리뷰가 없을 경우, 글을 작성할 수 있도록 리스트 상단에 버튼을 노출합니다. */}
            {!hasMyReview && currentUser && (
                <div className="flex items-center justify-between px-2 mb-5">
                    <span className="text-[14px] font-bold text-gray-500">사색의 흔적을 남겨보세요.</span>
                    <button
                        onClick={onWriteClick}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1d1d1f] hover:bg-black text-white text-[13px] font-bold shadow-sm transition-transform active:scale-95"
                    >
                        <PenTool size={14} />
                        작성하기
                    </button>
                </div>
            )}

            {/* 1cm 표준 여백을 목록 리스트 전체에 적용 */}
            <div className="flex flex-col gap-4">
                {sortedReviews.map((review) => {
                    const isMine = currentUser && review.user_email && (currentUser.email === review.user_email);

                    return (
                    <div key={review.id} className={`group px-6 py-5 md:px-8 md:py-6 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 ${
                        isMine 
                        ? 'bg-white border-2 border-[#1d1d1f] rounded-2xl shadow-md z-10' 
                        : 'bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200'
                    }`}>
                        
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
                                    <span className="text-[13px] font-bold text-[#1d1d1f] truncate group-hover/profile:text-[#0066cc] transition-colors">
                                        {review.user_name}
                                    </span>
                                </Link>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] leading-[1.6] text-[#1d1d1f] font-medium break-keep cursor-default">
                                "{review.short_review}"
                            </p>
                        </div>

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
                                    <span className={`text-[12px] font-medium leading-none ${isMine ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {review.created_at?.split('T')[0]}
                                    </span>
                                </div>
                            </div>

                            <div className="w-auto md:w-[80px] flex justify-end">
                                {isMine ? (
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => onEditClick?.(review)} className="p-2 text-gray-400 hover:text-[#0066cc] hover:bg-blue-50 rounded-lg transition-colors" title="수정">
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => onDeleteClick?.(review.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="삭제">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 items-center justify-center gap-1.5 shadow-inner shadow-gray-200/20">
                                        {renderStars(review.rating, 11)}
                                    </div>
                                )}
                            </div>
                            
                        </div>
                    </div>
                )})}
            </div>
        </div>
    );
}