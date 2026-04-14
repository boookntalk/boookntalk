// 경로: frontend/src/components/layout/MasterDetailLayout.tsx

import React from 'react';

interface MasterDetailLayoutProps {
    masterTitle: React.ReactNode;
    masterSearch?: React.ReactNode;
    masterList: React.ReactNode;
    breadcrumb: React.ReactNode;
    detailTitle: React.ReactNode;
    detailBadge?: React.ReactNode;
    detailActions?: React.ReactNode;
    children: React.ReactNode;
    emptyState?: React.ReactNode;
    hasSelection: boolean;
}

export default function MasterDetailLayout({
    masterTitle, masterSearch, masterList,
    breadcrumb, detailTitle, detailBadge, detailActions,
    children, emptyState, hasSelection
}: MasterDetailLayoutProps) {
    return (
        // 💡 [영점 조절 1] 강제 높이 제한(h-full, overflow-hidden)을 모두 풀고, 자연스럽게 푸터까지 닿도록(min-h, flex-1) 변경합니다.
        <div className="flex items-start w-full flex-1 min-h-[calc(100vh-60px)] -mt-[var(--spacing-1cm,32px)] bg-[#F5F5F7]">
            
            {/* 좌측 패널 (Master Area) */}
            {/* 💡 [영점 조절 2] sticky top-0 속성을 부여하여, 우측 화면을 스크롤해도 작가 리스트는 화면에 딱 붙어있게 만듭니다. */}
            <aside className="w-[320px] flex-none bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm sticky top-0 h-[calc(100vh-60px)]">
                <div className="p-4 border-b border-gray-100 flex-none">
                    {masterTitle}
                    {masterSearch && <div className="mt-4">{masterSearch}</div>}
                </div>
                {/* 하단 패딩(pb-10)을 주어 마지막 리스트가 짤리지 않게 보호 */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 scrollbar-hide pb-10">
                    {masterList}
                </div>
            </aside>

            {/* 우측 패널 (Detail Area) */}
            {/* 💡 독립적인 스크롤 대신 브라우저의 기본 스크롤을 활용하여 훨씬 매끄러운 뷰어 경험을 제공합니다. */}
            <main className="flex-1 flex flex-col relative bg-[#F5F5F7]">
                {!hasSelection ? (
                    emptyState
                ) : (
                    <>
                        {/* 디테일 헤더 (Sticky) */}
                        <div className="flex-none bg-[#F5F5F7]/90 backdrop-blur-md z-30 pt-4 px-[var(--spacing-1cm,32px)] sticky top-0">
                            <div className="flex items-center gap-1.5 text-[13px] font-bold text-gray-400 mb-4">
                                {breadcrumb}
                            </div>

                            <div className="flex items-center justify-between pb-4 border-b border-gray-200 w-full">
                                <div className="flex items-center gap-3">
                                    <div className="text-[20px] md:text-[22px] font-black leading-none text-[#1d1d1f]">
                                        {detailTitle}
                                    </div>
                                    {detailBadge && <div className="mt-1">{detailBadge}</div>}
                                </div>
                                {detailActions && (
                                    <div className="flex items-center gap-2">
                                        {detailActions}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 실제 콘텐츠 영역 */}
                        <div className="px-[var(--spacing-1cm,32px)] pt-4 pb-32">
                            {children}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}