//src/components/book-detail/ShortReviewSection.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';

interface ShortReviewSectionProps {
    workId: number;
}

export default function ShortReviewSection({ workId }: ShortReviewSectionProps) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/works/${workId}/short-reviews`);
                if (res.ok) {
                    const data = await res.json();
                    setReviews(data);
                }
            } catch (error) {
                console.error("Failed to fetch short reviews", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (workId) fetchReviews();
    }, [workId]);

    const renderStars = (rating: number) => {
        return (
            <div className="flex text-[#FFCC00]">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star} 
                        size={14} 
                        fill={star <= rating ? "currentColor" : "none"} 
                        className={star <= rating ? "text-[#FFCC00]" : "text-gray-200"}
                    />
                ))}
            </div>
        );
    };

    if (isLoading) {
        return <div className="py-10 text-center text-gray-400 text-sm font-medium animate-pulse">한줄평을 불러오는 중입니다...</div>;
    }

    return (
        // [수정됨] mt-[var(--spacing-1cm,40px)] 제거로 이중 여백 해결
        <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="text-[#0066cc]" size={22} />
                <h3 className="text-lg md:text-xl font-extrabold text-[#1d1d1f]">BoooknTalkers' 한줄평</h3>
                <span className="text-[13px] font-bold text-[#0066cc] bg-blue-50 px-2.5 py-0.5 rounded-full ml-1">
                    {reviews.length}
                </span>
            </div>

            {reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                    아직 공개된 한줄평이 없습니다. 이 책의 첫 번째 한줄평을 남겨보세요!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-gray-50 p-5 rounded-xl flex flex-col gap-3 transition-colors hover:bg-gray-100 border border-gray-100/50">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2.5">
                                    {review.user_image ? (
                                        <img src={review.user_image} alt="profile" className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-sm" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[12px] text-gray-500 font-extrabold shadow-sm">
                                            {review.user_name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-[#1d1d1f]">{review.user_name}</span>
                                        <span className="text-[11px] text-gray-400 font-medium">{review.created_at.split('T')[0]}</span>
                                    </div>
                                </div>
                                <div className="bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                                    {renderStars(review.rating)}
                                </div>
                            </div>
                            <p className="text-[14px] text-gray-700 leading-relaxed font-medium break-keep mt-1">
                                "{review.short_review}"
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}