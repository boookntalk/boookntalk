// 경로: frontend/src/components/layout/SubPageLayout.tsx
// 역할 및 기능: BoooknTalk 서브 페이지(내 서재, 광장 등)를 위한 공통 레이아웃 템플릿입니다. 
// 1cm 간격 룰을 내장하여 모든 페이지의 UI 통일성을 보장합니다.

'use client';

import React from 'react';
import StandardContainer from '@/components/layout/StandardContainer';

interface SubPageLayoutProps {
    breadcrumb: React.ReactNode;   // 홈 > 내 서재 같은 경로 영역
    actionArea?: React.ReactNode;  // 우측 검색창이나 버튼 영역
    titleOrTabs?: React.ReactNode; // 탭 메뉴나 페이지 큰 타이틀 영역
    children: React.ReactNode;     // 실제 도서 카드 등 콘텐츠 영역
}

export default function SubPageLayout({ breadcrumb, actionArea, titleOrTabs, children }: SubPageLayoutProps) {
    return (
        // 💡 [레이아웃 룰 1] 이중 패딩 상쇄를 위한 음수 마진(-mt)과 pt-4 상단 여백
        <StandardContainer size="wide" className="relative min-h-screen pb-32 -mt-[var(--spacing-1cm)] pt-4">
            
            {/* 상단 래퍼 */}
            <div className="border-b border-gray-200 transition-all">
                
                {/* 💡 [레이아웃 룰 2] 브레드크럼/액션 하단 여백을 mb-4로 고정 (덜컹거림 방지 min-h-40px 적용) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 min-h-[40px]">
                    
                    {/* 좌측: 브레드크럼 */}
                    <div className="flex items-center gap-2 text-[13px] font-bold text-gray-400">
                        {breadcrumb}
                    </div>

                    {/* 우측: 액션(검색 등) */}
                    {actionArea && (
                        <div className="relative w-full sm:w-[260px] group focus-within:w-[300px] transition-all duration-300">
                            {actionArea}
                        </div>
                    )}
                </div>

                {/* 탭 네비게이션 또는 타이틀 (-mb-[1px] 로직으로 밑줄 밀착) */}
                {titleOrTabs && (
                    <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide -mb-[1px]">
                        {titleOrTabs}
                    </div>
                )}
            </div>

            {/* 💡 [레이아웃 룰 3] 메인 콘텐츠 바디 영역 (pt-4 간격 룰) */}
            <div className="pt-2">
                {children}
            </div>

        </StandardContainer>
    );
}