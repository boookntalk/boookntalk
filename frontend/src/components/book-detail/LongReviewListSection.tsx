'use client';

import React, { useEffect, useState } from 'react';
import { Star, LayoutList, LayoutGrid, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import FollowButton from '@/components/common/FollowButton';

interface LongReviewListSectionProps {
    workId: number;
    currentUser?: any;
}

type ViewMode = 'feed' | 'grid';

export default function LongReviewListSection({ workId, currentUser }: LongReviewListSectionProps) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('feed'); // 기본값은 블로그 피드형

    useEffect(() => {
        const fetchLongReviews = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/works/${workId}/long-reviews`);
                if (res.ok) {
                    const data = await res.json();
                    setReviews(data);
                }
            } catch (error) {
                console.error("Failed to fetch long reviews", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (workId) fetchLongReviews();
    }, [workId]);

    // 내 글을 맨 위로 올리는 정렬 (한줄평과 동일한 로직)
    const sortedReviews = React.useMemo(() => {
        if (!currentUser || !currentUser.email) return reviews;
        const myReviews = reviews.filter(r => r.user_email === currentUser.email);
        const otherReviews = reviews.filter(r => r.user_email !== currentUser.email);
        return [...myReviews, ...otherReviews];
    }, [reviews, currentUser]);

    const renderStars = (rating: number) => {
        return (
            <div className="flex text-[#FFCC00] gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={12} fill={star <= rating ? "currentColor" : "none"} className={star <= rating ? "text-[#FFCC00]" : "text-gray-300"} />
                ))}
            </div>
        );
    };

    if (isLoading) return <div className="py-20 text-center text-gray-400 animate-pulse">긴줄평을 불러오는 중입니다...</div>;

    if (reviews.length === 0) return (
        <div className="text-center py-20 bg-white rounded-[24px] border border-gray-100 mt-8">
            <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-[14px] text-gray-400">아직 등록된 긴줄평이 없습니다.<br/>첫 번째 사색의 기록을 남겨보세요.</p>
        </div>
    );

    return (
        <div className="mt-[var(--spacing-1cm,32px)]">
            {/* 상단 컨트롤러 (타이틀 & 뷰 토글 버튼) */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-[18px] font-black text-[#1d1d1f]">
                    사색의 기록 <span className="text-[#0066cc] ml-1">{reviews.length}</span>
                </h3>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                    <button 
                        onClick={() => setViewMode('feed')} 
                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'feed' ? 'bg-[#1d1d1f] text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                        title="피드형 보기"
                    >
                        <LayoutList size={16} />
                    </button>
                    <button 
                        onClick={() => setViewMode('grid')} 
                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#1d1d1f] text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                        title="그리드형 보기"
                    >
                        <LayoutGrid size={16} />
                    </button>
                </div>
            </div>

            {/* 리스트 영역 (ViewMode에 따라 레이아웃이 grid 또는 flex-col로 변환됩니다) */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-6'}>
                {sortedReviews.map((review) => {
                    const isMine = currentUser && review.user_email && (currentUser.email === review.user_email);

                    return (
                        <div key={review.id} className={`flex flex-col bg-white rounded-[16px] overflow-hidden transition-all duration-300 ${isMine ? 'border-2 border-[#1d1d1f] shadow-md' : 'border border-gray-200 shadow-sm hover:shadow-md'}`}>
                            
                            {/* 카드 본문 (클릭 시 긴줄평 상세 페이지로 이동하도록 링크 처리 - 추후 상세페이지 라우팅 연결 필요) */}
                            <Link href={`/reviews/${review.id}`} className="flex flex-col flex-1 p-6 cursor-pointer group">
                                <h4 className="text-[18px] font-bold text-[#1d1d1f] mb-3 group-hover:text-[#0066cc] transition-colors line-clamp-2">
                                    {review.title}
                                </h4>
                                <p className="text-[14px] text-gray-500 leading-relaxed line-clamp-3 mb-4 flex-1">
                                    {review.content_preview}
                                </p>
                                <div className="bg-gray-50 px-2 py-1 rounded w-fit">
                                    {renderStars(review.rating)}
                                </div>
                            </Link>

                            {/* 하단 프로필 및 액션 영역 (한줄평에서 완성한 완벽한 레이아웃 적용) */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
                                <div className="flex items-center gap-2.5">
                                    {isMine ? (
                                        <div className="flex items-center gap-2.5 cursor-default">
                                            {review.user_image ? (
                                                <img src={review.user_image} alt="profile" className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] text-gray-500 font-bold border border-gray-200">
                                                    {review.user_name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                            <span className="text-[13px] font-bold text-[#1d1d1f] truncate">{review.user_name}</span>
                                        </div>
                                    ) : (
                                        <Link href={`/library/user/${review.user_id}`} className="flex items-center gap-2.5 group/profile">
                                            {review.user_image ? (
                                                <img src={review.user_image} alt="profile" className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] text-gray-500 font-bold border border-gray-200">
                                                    {review.user_name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                            <span className="text-[13px] font-bold text-[#1d1d1f] group-hover/profile:underline underline-offset-2 decoration-gray-400 truncate">
                                                {review.user_name}
                                            </span>
                                        </Link>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {!isMine && currentUser && (
                                        <div className="scale-90">
                                            <FollowButton 
                                                targetUserId={review.user_id}
                                                currentUserEmail={currentUser.email}
                                                initialIsFollowing={review.is_following || false} 
                                            />
                                        </div>
                                    )}
                                    <span className={`text-[12px] font-mono leading-none ${isMine ? 'text-gray-500 font-bold' : 'text-gray-400'}`}>
                                        {review.created_at?.split('T')[0]}
                                    </span>
                                </div>
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
}