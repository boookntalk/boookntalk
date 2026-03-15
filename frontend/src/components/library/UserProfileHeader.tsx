'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { User, BookOpen } from 'lucide-react';
import FollowButton from '@/components/common/FollowButton'; // 방금 만든 버튼 경로에 맞게 수정해주세요!

interface UserProfileHeaderProps {
    targetUser: {
        id: number;
        nickname: string;
        bio: string | null;
        profile_image: string | null;
        follower_count: number;
        following_count: number;
        library_book_count?: number; // 서재에 담긴 책 권수 (선택)
    };
    currentUserEmail?: string;
    initialIsFollowing: boolean;
}

export default function UserProfileHeader({ 
    targetUser, 
    currentUserEmail, 
    initialIsFollowing 
}: UserProfileHeaderProps) {
    // 팔로우 버튼 클릭 시 즉각적인 UI 업데이트를 위한 로컬 상태 관리
    const [followerCount, setFollowerCount] = useState(targetUser.follower_count || 0);

    // FollowButton에서 상태가 변할 때 호출되는 콜백 함수
    const handleFollowChange = (isFollowing: boolean, newCount?: number) => {
        if (newCount !== undefined) {
            setFollowerCount(newCount); // 백엔드에서 정확한 숫자를 보내줬다면 그것으로 덮어쓰기
        } else {
            // 응답에 숫자가 없다면 프론트엔드에서 자체적으로 +1, -1 계산
            setFollowerCount(prev => isFollowing ? prev + 1 : Math.max(0, prev - 1));
        }
    };

    return (
        <div className="bg-white border-b border-gray-100 relative">
            {/* 배경 데코레이션 (은은한 패턴이나 그라데이션) */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#F5F5F7] to-white/0 pointer-events-none" />

            <div className="relative pt-8 pb-8 px-[var(--spacing-1cm,32px)] max-w-[1200px] mx-auto flex flex-col md:flex-row items-center md:items-start gap-6">
                
                {/* 1. 프로필 이미지 (원형) */}
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full shadow-sm border-4 border-white overflow-hidden bg-gray-50 flex-shrink-0">
                    {targetUser.profile_image ? (
                        <Image 
                            src={targetUser.profile_image} 
                            alt={`${targetUser.nickname}의 프로필`} 
                            fill 
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <User size={40} />
                        </div>
                    )}
                </div>

                {/* 2. 유저 정보 영역 */}
                <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left mt-2 md:mt-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-2">
                        <h1 className="text-[24px] font-black text-[#1d1d1f]">
                            {targetUser.nickname || '익명의 기록자'}
                        </h1>
                        
                        {/* ▼▼▼ [핵심] 만능 팔로우 버튼 장착! ▼▼▼ */}
                        <div className="flex justify-center md:justify-start">
                            <FollowButton 
                                targetUserId={targetUser.id}
                                currentUserEmail={currentUserEmail}
                                initialIsFollowing={initialIsFollowing}
                                onFollowChange={handleFollowChange}
                            />
                        </div>
                    </div>

                    <p className="text-[14px] text-gray-500 font-medium mb-4 max-w-lg break-keep leading-relaxed">
                        {targetUser.bio || '아직 소개글을 작성하지 않았습니다.'}
                    </p>

                    {/* 3. 소셜 메타 정보 (팔로워, 팔로잉, 서재 권수) */}
                    <div className="flex items-center gap-6 text-[13px] font-bold">
                        <div className="flex flex-col md:flex-row md:items-center gap-1">
                            <span className="text-gray-400 font-medium">팔로워</span>
                            <span className="text-[#1d1d1f] text-[15px]">{followerCount}</span>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-1">
                            <span className="text-gray-400 font-medium">팔로잉</span>
                            <span className="text-[#1d1d1f] text-[15px]">{targetUser.following_count || 0}</span>
                        </div>
                        {targetUser.library_book_count !== undefined && (
                            <div className="flex flex-col md:flex-row md:items-center gap-1 before:content-[''] before:w-px before:h-3 before:bg-gray-200 before:hidden md:before:block before:mr-4">
                                <BookOpen size={14} className="text-gray-400 hidden md:block" />
                                <span className="text-gray-400 font-medium">서재 보관</span>
                                <span className="text-[#0066cc] text-[15px]">{targetUser.library_book_count}</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}