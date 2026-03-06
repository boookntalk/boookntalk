'use client';

import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, Edit3, Trash2 } from 'lucide-react';
import Link from 'next/link';

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
    }, [editionId]);

    const renderStars = (rating: number, size: number = 12) => {
        return (
            <div className="flex text-[#FFCC00] gap-0.5" title={`별점 ${rating}점`}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={size} fill={star <= rating ? "currentColor" : "none"} className={star <= rating ? "text-[#FFCC00]" : "text-gray-300"} />
                ))}
            </div>
        );
    };

    if (isLoading) return <div className="py-20 text-center text-gray-400 text-sm font-medium animate-pulse">한줄평을 불러오는 중입니다...</div>;

    if (reviews.length === 0) return (
         <div className="text-center py-20 text-gray-400 bg-white rounded-md border border-gray-200 border-dashed">
            <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-[14px]">아직 작성된 한줄평이 없습니다.</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-2 pb-20">
            {reviews.map((review) => {
                // [최종 로직] 백엔드에서 user_email을 내려주면 완벽하게 내 글을 찾아냅니다!
                const isMine = currentUser && review.user_email && (currentUser.email === review.user_email);

                return (
                <div key={review.id} className={`group bg-white px-5 py-4 rounded-md border transition-all shadow-sm flex items-center gap-4 md:gap-6 ${isMine ? 'border-[#1d1d1f]' : 'border-gray-200 hover:border-gray-400'}`}>
                    
                    <div className="flex items-center gap-2.5 shrink-0 w-[140px]">
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
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-[14px] text-[#1d1d1f] font-medium truncate group-hover:text-black transition-colors cursor-default" title={review.short_review}>
                            "{review.short_review}"
                        </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        {/* 1. 공통: 날짜 */}
                        <span className="text-[11px] text-gray-400 font-mono hidden md:block">
                            {review.created_at?.split('T')[0]}
                        </span>
                        
                        {/* ▼▼▼ [핵심] 조작부/별점 영역을 고정 너비(w-[90px]) 박스로 감싸서 날짜 위치를 완벽하게 고정합니다 ▼▼▼ */}
                        <div className="flex items-center justify-end w-[90px]">
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
                                <div className="hidden md:flex bg-gray-50 px-2 py-1 rounded-[4px] border border-gray-100 items-center gap-1.5">
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