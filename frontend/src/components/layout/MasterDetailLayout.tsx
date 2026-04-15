// 경로: frontend/src/components/layout/MasterDetailLayout.tsx
// 역할 및 기능: BoooknTalk 전용 좌우 분할 레이아웃. 좌측 패널 배경이 푸터와 완벽하게 맞닿도록 무한 스트레치 기법을 적용하고, 내부 콘텐츠만 스크롤을 따라다니도록 고정했습니다.

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
        // 💡 [해결 1] items-start를 제거(기본값 stretch)하고, -mb-[32px]를 추가하여 하단 공백을 완전히 덮어버립니다.
        <div className="flex w-full flex-1 -mt-[var(--spacing-1cm,32px)] -mb-[var(--spacing-1cm,32px)] bg-[#F5F5F7]">
            
            {/* 좌측 패널 (Master Area) */}
            {/* 💡 [해결 2] aside 자체의 높이 제한과 sticky를 풀어서 하얀 배경이 푸터까지 쫙 늘어나게 둡니다. */}
            <aside className="w-[320px] flex-none bg-white border-r border-gray-200 z-10 shadow-sm relative">
                
                {/* 💡 [해결 3] 대신 알맹이(div)에 sticky를 주어 스크롤을 따라오게 만듭니다. (글로벌 헤더와 겹치지 않게 top-[64px]로 띄워줍니다) */}
                <div className="sticky top-[64px] flex flex-col h-[calc(100vh-64px)]">
                    <div className="p-4 border-b border-gray-100 flex-none">
                        {masterTitle}
                        {masterSearch && <div className="mt-4">{masterSearch}</div>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 scrollbar-hide pb-10">
                        {masterList}
                    </div>
                </div>
            </aside>

            {/* 우측 패널 (Detail Area) */}
            <main className="flex-1 flex flex-col relative bg-[#F5F5F7] min-h-screen">
                {!hasSelection ? (
                    emptyState
                ) : (
                    <>
                        {/* 디테일 헤더 */}
                        {/* 우측 헤더 역시 글로벌 헤더 밑에 딱 붙도록 top-[64px] 적용 */}
                        <div className="flex-none bg-[#F5F5F7]/90 backdrop-blur-md z-30 pt-4 px-[var(--spacing-1cm,32px)] sticky top-[64px]">
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
                        <div className="px-[var(--spacing-1cm,32px)] pt-4 pb-40">
                            {children}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}