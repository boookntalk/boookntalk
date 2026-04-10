// 파일 경로: src/components/common/AuthorAvatar.tsx
// 역할 및 기능: BoooknTalk 서비스 전역에서 사용되는 작가, 번역가 등의 프로필 이미지를 렌더링하는 공통 컴포넌트입니다. 사진 데이터가 없을 경우 일관된 Fallback(대체) 아이콘을 제공합니다.

import React from 'react';
import { PenTool, User } from 'lucide-react';

interface AuthorAvatarProps {
    src?: string | null;
    alt?: string;
    size?: number;         // px 단위 (기본값 36)
    fallbackType?: 'pen' | 'user'; // 대체 아이콘 타입
    className?: string;    // 추가적인 Tailwind 클래스 (hover 효과 등)
}

// 함수 기능: 전달받은 이미지 URL(src)이 유효하면 원형 프로필 사진을 렌더링하고, 데이터가 없으면 fallbackType에 맞춰 펜 또는 유저 아이콘을 일관된 규격으로 출력합니다.
export function AuthorAvatar({ 
    src, 
    alt = "Author Profile", 
    size = 36, 
    fallbackType = 'pen',
    className = "" 
}: AuthorAvatarProps) {
    return (
        <div 
            className={`shrink-0 flex items-center justify-center overflow-hidden bg-[#EEF2F7] border border-[#E7E2D9] rounded-full ${className}`}
            style={{ width: size, height: size }}
        >
            {src ? (
                <img 
                    src={src} 
                    alt={alt} 
                    className="w-full h-full object-cover" 
                />
            ) : (
                fallbackType === 'pen' ? (
                    <PenTool size={size * 0.45} className="text-[#A0AABF]" />
                ) : (
                    <User size={size * 0.45} className="text-[#A0AABF]" />
                )
            )}
        </div>
    );
}