// 파일 경로: src/app/(main)/my-authors/layout.tsx
// 역할 및 기능: BoooknTalk의 '나의 작가' 하위 메뉴들에 공통으로 LNB(사이드바) 레이아웃을 씌워주는 컴포넌트

'use client';

import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { LibrarySidebar } from '@/components/library/LibrarySidebar';
import Footer from '@/components/layout/Footer';

// 함수 기능: 다른 메뉴들과 동일한 Flexbox 규격으로 좌측 LNB와 우측 메인 화면(및 푸터)을 배치합니다.
export default function AuthorsLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex w-full h-full bg-[#F5F5F7] overflow-hidden">
                {/* 좌측: 고정된 공통 LNB */}
                <aside className="hidden md:block w-64 flex-none border-r border-gray-300 bg-white h-full">
                    <LibrarySidebar />
                </aside>
                
                {/* 우측: 나의 작가 컨텐츠 및 푸터 */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* 메인 스크롤 영역 */}
                    <main className="flex-1 overflow-y-auto bg-[#F5F5F7] scrollbar-hide">
                        {children}
                    </main>
                    <footer className="flex-none bg-white border-t border-gray-200">
                        <Footer />
                    </footer>
                </div>
            </div>
        </SidebarProvider>
    );
}