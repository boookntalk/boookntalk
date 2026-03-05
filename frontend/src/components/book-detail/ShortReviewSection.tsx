'use client';

import React, { useEffect, useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface ShortReviewSectionProps {
    editionId: number; // Edition 기준
    onDataLoaded?: (count: number) => void;
}

export default function ShortReviewSection({ editionId, onDataLoaded }: ShortReviewSectionProps) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                // [수정] Edition 기준 API 호출
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
            <div className="flex text-[#FFCC00] gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star} 
                        size={size} 
                        fill={star <= rating ? "currentColor" : "none"} 
                        className={star <= rating ? "text-[#FFCC00]" : "text-gray-300"}
                    />
                ))}
            </div>
        );
    };

    // [수정] 용어 변경 (리뷰 -> 한줄평)
    if (isLoading) {
        return <div className="py-20 text-center text-gray-400 text-sm font-medium animate-pulse">한줄평을 불러오는 중입니다...</div>;
    }

    if (reviews.length === 0) {
        return (
             <div className="text-center py-20 text-gray-400 bg-white rounded-md border border-gray-200 border-dashed">
                <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium text-[14px]">아직 작성된 한줄평이 없습니다.</p>
                <p className="text-[13px] mt-1">이 책의 첫 번째 느낌을 남겨보세요.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 pb-20">
            {/* [수정] 상단 헤더(Total/Average) 완전히 제거됨 */}
            
            {/* 한줄평 리스트 (슬림형) */}
            {reviews.map((review) => (
                <div 
                    key={review.id} 
                    className="group bg-white px-5 py-4 rounded-md border border-gray-200 hover:border-gray-400 transition-all shadow-sm hover:shadow-md flex items-center gap-4 md:gap-6"
                >
                    {/* 유저 정보 영역 */}
                    <div className="flex items-center gap-2.5 shrink-0 w-[140px]">
                        {/* ▼ Link로 감싸기 (경로: /library/user/[userId]) */}
                        <Link href={`/library/user/${review.user_id}`} className="flex items-center gap-2.5 group/profile">
                            
                            {/* 프로필 이미지 */}
                            {review.user_image ? (
                                <img src={review.user_image} alt="profile" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-bold border border-gray-200">
                                    {review.user_name?.charAt(0) || 'U'}
                                </div>
                            )}
                            
                            {/* 닉네임 */}
                            <span className="text-[13px] font-bold text-[#1d1d1f] truncate group-hover/profile:underline underline-offset-2 decoration-gray-400">
                                {review.user_name}
                            </span>
                            
                        </Link>
                    </div>

                    {/* 2. 한줄평 내용 */}
                    <div className="flex-1 min-w-0">
                        <p 
                            className="text-[14px] text-[#1d1d1f] font-medium truncate group-hover:text-black transition-colors cursor-default"
                            title={review.short_review} 
                        >
                            "{review.short_review}"
                        </p>
                    </div>

                    {/* 3. 개별 평점 & 날짜 */}
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="hidden md:flex bg-gray-50 px-2 py-1 rounded-[4px] border border-gray-100">
                            {renderStars(review.rating, 11)}
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono hidden md:block">
                            {review.created_at?.split('T')[0]}
                        </span>
                        
                        {/* 모바일 대응 */}
                        <div className="md:hidden flex items-center gap-1 text-[#FFCC00] text-[12px] font-bold">
                            <Star size={12} fill="currentColor" /> {review.rating}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}