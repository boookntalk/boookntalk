// 경로: src/components/layout/HeroDetailLayout.tsx
// 역할: 도서 상세 페이지 등 상단에 히어로(Hero) 컨텐츠가 있고, 그 아래에 스티키(Sticky) 탭이 위치하는 특수 구조를 위한 공통 레이아웃.

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
            
            {/* 💡 [핵심 해결 1] 뒤로가기 메뉴와 히어로 영역을 하얀색(bg-white)으로 묶어, 글로벌 헤더와 단절된 회색 공백을 완전히 지웠습니다! */}
            <div className="w-full bg-white">
                {/* 1. 상단 액션 (뒤로가기 등) */}
                <div className="w-full px-[var(--spacing-1cm,32px)] pt-5 pb-2">
                    {breadcrumb}
                </div>

                {/* 2. 히어로 영역 (도서 상세 정보) */}
                <div className="w-full">
                    {heroContent}
                </div>
            </div>

            {/* 3. 스티키 탭 영역 (마찬가지로 흰색 배경으로 통일감 유지) */}
            <div id="review-tabs-area" className="sticky top-[56px] z-30 w-full px-[var(--spacing-1cm,32px)] bg-white border-b border-gray-200">
                {tabs}
            </div>

            {/* 4. 본문 컨텐츠 영역 */}
            <div className="w-full px-[var(--spacing-1cm,32px)] pt-6 pb-32 max-w-[1200px] mx-auto">
                {children}
            </div>
            
        </div>
    );
}