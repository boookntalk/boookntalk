// src/components/common/FloatingCover.tsx
import React from 'react';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';

interface FloatingCoverProps {
    src?: string | null;
    alt?: string;
    className?: string; // 부모 컨테이너의 크기를 지정 (예: 'w-12 h-16', 'w-full h-full' 등)
    iconSize?: number;  // 커버 이미지가 없을 때 노출될 기본 아이콘 크기
}

/**
 * [BoooknTalk 프리미엄 공통 컴포넌트]
 * 11시 방향으로 부드럽게 떠오르는 3D 입체 커버 이미지
 */
export function FloatingCover({ src, alt = "도서 커버", className = "w-full h-full", iconSize = 24 }: FloatingCoverProps) {
    return (
        /* 1. 바닥(Base): 표지가 떠올랐을 때 원래 있던 자리를 살짝 어둡게 보여주어 공간감을 형성합니다. */
        <div className={`relative bg-gray-50/80 rounded-sm border border-gray-100 shrink-0 ${className}`}>
            
            {/* 2. 떠오르는 표지(Floating Cover): 11시 방향(-x, -y)으로 이동하며 5시 방향으로 깊은 그림자를 만듭니다. */}
            <div className="absolute inset-0 w-full h-full bg-white rounded-sm border border-gray-200 overflow-hidden transition-all duration-300 ease-out hover:-translate-x-1.5 hover:-translate-y-1.5 hover:shadow-[6px_6px_15px_rgba(0,0,0,0.12)] flex items-center justify-center z-10 cursor-pointer">
                {src ? (
                    <Image 
                        src={src} 
                        alt={alt} 
                        fill 
                        className="object-cover" 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <BookOpen size={iconSize} className="text-gray-300" />
                )}
            </div>
        </div>
    );
}