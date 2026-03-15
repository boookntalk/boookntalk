'use client';

import React, { useState } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FollowButtonProps {
    targetUserId: number;
    currentUserEmail?: string;
    initialIsFollowing: boolean;
    isFollower?: boolean; // [핵심] 상대방이 나를 팔로우하고 있는지 여부
    onFollowChange?: (isFollowing: boolean, newCount?: number) => void;
    className?: string; // 추가적인 스타일링 여백을 위한 prop
}

export default function FollowButton({ 
    targetUserId, 
    currentUserEmail, 
    initialIsFollowing, 
    isFollower = false, 
    onFollowChange,
    className = '' 
}: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isLoading, setIsLoading] = useState(false);

    // 버튼 클릭 시 백엔드 API 호출 (팔로우/언팔로우 토글)
    const handleToggleFollow = async () => {
        if (!currentUserEmail) {
            toast.info('로그인이 필요한 기능입니다.');
            return;
        }

        setIsLoading(true);
        try {
            // (이 API는 다음 스텝에서 바로 만들 예정입니다!)
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/${targetUserId}/follow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_email: currentUserEmail })
            });

            if (res.ok) {
                const data = await res.json();
                setIsFollowing(data.is_following); // 백엔드에서 변경된 상태를 받아옴
                
                if (onFollowChange) {
                    onFollowChange(data.is_following, data.follower_count); // 부모(예: 타인의 서재 헤더)에게 숫자 변경 알림
                }
                
                toast.success(data.is_following ? '팔로우했습니다.' : '팔로우를 취소했습니다.');
            } else {
                toast.error('처리 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error("Follow error:", error);
            toast.error('서버와의 통신에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            
            {/* ▼▼▼ [옵션 A 적용] 상대방이 나를 팔로우 중일 때 보여주는 프리미엄 뱃지 ▼▼▼ */}
            {isFollower && (
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-sm">
                    나를 팔로우함
                </span>
            )}

            {/* 실제 팔로우 버튼 */}
            <button 
                onClick={handleToggleFollow}
                disabled={isLoading}
                className={`
                    flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all duration-300
                    ${isFollowing 
                        ? 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200' // 팔로잉 상태 (마우스 올리면 붉은색 언팔 경고)
                        : 'bg-[#1d1d1f] text-white hover:bg-[#0066cc] shadow-sm hover:shadow-md' // 팔로우 안 한 상태 (강조)
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
            >
                {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                ) : isFollowing ? (
                    <>
                        <UserCheck size={14} />
                        <span>팔로잉</span>
                    </>
                ) : (
                    <>
                        <UserPlus size={14} />
                        <span>팔로우</span>
                    </>
                )}
            </button>
        </div>
    );
}