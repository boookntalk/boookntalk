'use client';

import React from 'react';
import Header from '@/components/layout/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-[#F5F5F7]">
            {/* [복구] 모든 화면에서 글로벌 헤더를 항상 렌더링하여 앱의 일관성 유지 */}
            <header className="flex-none h-14 bg-white border-b border-gray-200 z-50 relative">
                <Header />
            </header>

            {/* 메인 콘텐츠 영역 */}
            <main className="flex-1 flex overflow-hidden relative">
                {children}
            </main>
        </div>
    );
}