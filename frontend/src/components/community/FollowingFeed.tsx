'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, BookOpen, Clock, Heart, MessageCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface FollowingFeedProps {
    currentUserEmail?: string;
}

export default function FollowingFeed({ currentUserEmail }: FollowingFeedProps) {
    const router = useRouter();
    const [feedList, setFeedList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentUserEmail) {
            setIsLoading(false);
            return;
        }

        const fetchFeed = async () => {
            setIsLoading(true);
            try {
                // 방금 만든 B루트 백엔드 API 호출!
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/feed/following/long-reviews?user_email=${currentUserEmail}`);
                if (res.ok) {
                    const data = await res.json();
                    setFeedList(data);
                }
            } catch (error) {
                console.error("피드 로딩 에러:", error);
                toast.error("피드를 불러오는 중 오류가 발생했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeed();
    }, [currentUserEmail]);

    // 날짜 포맷팅 함수 (예: '2시간 전', '2026.03.15')
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffHours < 24) return diffHours === 0 ? '방금 전' : `${diffHours}시간 전`;
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    // HTML 태그 제거 함수 (미리보기용)
    const stripHtml = (html: string) => {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    if (isLoading) {
        return (
            <div className="w-full flex justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-[#0066cc] border-t-transparent rounded-full" />
            </div>
        );
    }

    // 팔로우한 사람이 없거나 글이 없을 때 (Empty State)
    if (!feedList || feedList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[24px] border border-gray-100 border-dashed max-w-[800px] mx-auto mt-[var(--spacing-1cm,32px)] shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <User size={28} className="text-gray-300" />
                </div>
                <h3 className="text-[16px] font-bold text-[#1d1d1f] mb-2">아직 피드에 새로운 소식이 없습니다</h3>
                <p className="text-[14px] text-gray-400 mb-6 text-center leading-relaxed">
                    관심 있는 기록자를 팔로우하고<br/>그들의 깊은 사색을 가장 먼저 받아보세요.
                </p>
                <button 
                    onClick={() => router.push('/square?tab=authors')} 
                    className="px-6 py-2.5 rounded-xl bg-[#1d1d1f] text-white text-[14px] font-bold hover:bg-[#0066cc] transition-colors"
                >
                    주목받는 기록자 찾기
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-[800px] mx-auto flex flex-col gap-[var(--spacing-1cm,32px)] py-6 pb-32">
            {feedList.map((feed) => (
                <article key={feed.review_id} className="bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                    
                    {/* 1. 작성자 헤더 영역 */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-50">
                        <div 
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => router.push(`/library/${feed.author.id}`)}
                        >
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 group-hover:border-[#0066cc] transition-colors">
                                {feed.author.profile_image ? (
                                    <Image src={feed.author.profile_image} alt="프로필" fill className="object-cover" />
                                ) : (
                                    <User size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400" />
                                )}
                            </div>
                            <div>
                                <h4 className="text-[15px] font-bold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors">
                                    {feed.author.nickname || '익명'}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[12px] text-gray-400 font-medium mt-0.5">
                                    <Clock size={12} />
                                    <span>{formatTimeAgo(feed.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. 책 정보 & 본문 영역 (클릭 시 상세페이지로 이동) */}
                    <div 
                        className="p-6 cursor-pointer group flex flex-col md:flex-row gap-6"
                        onClick={() => router.push(`/square/long-review/${feed.review_id}`)}
                    >
                        {/* 썸네일 (책 표지 대신) */}
                        <div className="w-24 shrink-0 flex-col items-center hidden sm:flex">
                            <div className="w-full aspect-[1/1.4] bg-gray-50 border border-gray-100 rounded-md shadow-sm flex items-center justify-center text-gray-300 relative overflow-hidden group-hover:shadow-md transition-shadow">
                                <BookOpen size={24} className="opacity-30" />
                                {/* 실제 책 표지 URL이 넘어온다면 여기에 Image 태그 추가 */}
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 mt-2 text-center line-clamp-2 leading-tight">
                                {feed.work.title}
                            </span>
                        </div>

                        {/* 본문 미리보기 */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                {feed.is_spoiler && (
                                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1 shrink-0">
                                        <AlertTriangle size={10} /> 스포일러
                                    </span>
                                )}
                                <h2 className="text-[20px] font-black text-[#1d1d1f] leading-tight line-clamp-1 group-hover:text-[#0066cc] transition-colors">
                                    {feed.title}
                                </h2>
                            </div>
                            <p className="text-[14px] text-gray-500 leading-relaxed line-clamp-3 break-keep">
                                {stripHtml(feed.content_preview)}
                            </p>
                        </div>
                    </div>

                    {/* 3. 반응 액션 영역 (좋아요, 댓글) */}
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex items-center gap-4">
                        <button className="flex items-center gap-1.5 text-[13px] font-bold text-gray-500 hover:text-rose-500 transition-colors group">
                            <Heart size={16} className="group-hover:fill-rose-500" />
                            <span>좋아요</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-[13px] font-bold text-gray-500 hover:text-[#0066cc] transition-colors">
                            <MessageCircle size={16} />
                            <span>댓글 달기</span>
                        </button>
                    </div>
                </article>
            ))}
        </div>
    );
}