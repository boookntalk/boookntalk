// 파일 경로: frontend/src/components/layout/HeroDetailLayout.tsx
import React from 'react';

interface HeroDetailLayoutProps {
    breadcrumb: React.ReactNode;
    heroContent: React.ReactNode;
    tabs: React.ReactNode;
    children: React.ReactNode;
}

export default function HeroDetailLayout({ breadcrumb, heroContent, tabs, children }: HeroDetailLayoutProps) {
    return (
        <div className="flex flex-col w-full min-h-screen -mt-[var(--spacing-1cm,32px)] bg-[#F5F5F7] relative">
            
            {/* 1. 상단 액션 및 히어로 영역 (배경 흰색) */}
            <div className="w-full bg-white border-b border-gray-100">
                {/* 💡 [수정] -mt로 끌어올린 만큼 pt를 동적으로 더해주어 헤더에 가려지지 않게 꺼냅니다. */}
                <div className="w-full max-w-[1440px] mx-auto px-[var(--spacing-1cm,32px)] pt-[calc(var(--spacing-1cm,32px)+16px)] pb-4">
                    {breadcrumb}
                </div>
                {/* 도서 상세 (히어로) */}
                <div className="w-full max-w-[1440px] mx-auto px-[var(--spacing-1cm,32px)]">
                    {heroContent}
                </div>
            </div>

            {/* 2. 스티키 탭 영역 */}
            <div id="review-tabs-area" className="sticky top-[56px] z-30 w-full bg-white border-b border-gray-200 shadow-sm">
                <div className="w-full max-w-[1440px] mx-auto px-[var(--spacing-1cm,32px)]">
                    {tabs}
                </div>
            </div>

            {/* 3. 본문 컨텐츠 영역 */}
            <div className="w-full max-w-[1440px] mx-auto px-[var(--spacing-1cm,32px)] pt-6 pb-32">
                {children}
            </div>
            
        </div>
    );
}