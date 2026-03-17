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
    // 1. Hook 선언부 (최상단 배치)
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/editions/${editionId}/short-reviews`);
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

    // [핵심] useMemo를 모든 조건부 return(if문)보다 위로 안전하게 끌어올렸습니다! 중복 선언도 제거 완료!
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

    // 2. 예외 처리부 (렌더링)
    if (isLoading) return <div className="py-20 text-center text-gray-400 text-sm font-medium animate-pulse">한줄평을 불러오는 중입니다...</div>;

    if (reviews.length === 0) return (
         <div className="text-center py-20 text-gray-400 bg-white rounded-md border border-gray-200 border-dashed">
            <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-[14px]">아직 작성된 한줄평이 없습니다.</p>
        </div>
    );

    // 3. 메인 렌더링부
    return (
        <div className="flex flex-col gap-3 pb-20">
            {sortedReviews.map((review) => {
                const isMine = currentUser && review.user_email && (currentUser.email === review.user_email);

                return (
                // ▼▼▼ [수정 1] 내 글 강조: 배경은 하얗게 빼고, 테두리 두께(border-2)와 그림자(shadow-md)로 입체감을 극대화! ▼▼▼
                <div key={review.id} className={`group px-5 py-4 transition-all flex items-center gap-4 md:gap-6 ${
                    isMine 
                    ? 'bg-white border-2 border-[#1d1d1f] rounded-lg shadow-md z-10' 
                    : 'bg-white border border-gray-200 rounded-md shadow-sm hover:border-gray-400'
                }`}>
                    
                    {/* 1. 좌측: 프로필 및 닉네임 영역 (기존 동일) */}
                    <div className="flex items-center gap-2.5 shrink-0 w-[140px]">
                        {isMine ? (
                            <div className="flex items-center gap-2.5 group/profile cursor-default">
                                {review.user_image ? (
                                    <img src={review.user_image} alt="profile" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-bold border border-gray-200">
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
                                    <img src={review.user_image} alt="profile" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-bold border border-gray-200">
                                        {review.user_name?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <span className="text-[13px] font-bold text-[#1d1d1f] truncate group-hover/profile:underline underline-offset-2 decoration-gray-400">
                                    {review.user_name}
                                </span>
                            </Link>
                        )}
                    </div>

                    {/* 2. 중앙: 한줄평 본문 (기존 동일) */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[14px] text-[#1d1d1f] font-medium truncate group-hover:text-black transition-colors cursor-default" title={review.short_review}>
                            "{review.short_review}"
                        </p>
                    </div>

                    {/* 3. 우측: 고정 너비 영역 */}
                    <div className="flex items-center shrink-0 gap-2 md:gap-4">
                        {/* ▼▼▼ [수정 2] 팔로우 버튼 영역을 70px -> 90px로 넓히고, 줄바꿈 방지(whitespace-nowrap) 추가! ▼▼▼ */}
                        <div className="w-[90px] flex justify-end whitespace-nowrap">
                            {!isMine && currentUser && (
                                <div className="scale-[0.85] transform origin-right">
                                    <FollowButton 
                                        targetUserId={review.user_id}
                                        currentUserEmail={currentUser.email}
                                        initialIsFollowing={review.is_following || false} 
                                    />
                                </div>
                            )}
                        </div>

                        <div className="w-[90px] hidden md:flex items-center justify-center">
                            {/* font-mono를 제거하여 본문과 폰트 스타일을 맞추고, leading-none으로 텍스트 위아래 남는 여백을 깎아냅니다 */}
                            <span className={`text-[14px] leading-none ${isMine ? 'text-gray-500' : 'text-gray-400'}`}>
                                {review.created_at?.split('T')[0]}
                            </span>
                        </div>

                        <div className="w-[80px] flex justify-end">
                            {isMine ? (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => onEditClick?.(review)} className="p-1.5 text-gray-400 hover:text-[#0066cc] hover:bg-blue-50 rounded-md transition-colors" title="수정">
                                        <Edit3 size={15} />
                                    </button>
                                    <button onClick={() => onDeleteClick?.(review.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="삭제">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ) : (
                                <div className="hidden md:flex bg-gray-50 px-2 py-1 rounded-[4px] border border-gray-100 items-center justify-center gap-1.5 w-full">
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