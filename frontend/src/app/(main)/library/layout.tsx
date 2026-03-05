// src/app/(main)/library/layout.tsx
'use client';
import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { LibrarySidebar } from '@/components/library/LibrarySidebar';
import Footer from '@/components/layout/Footer';

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider defaultOpen={true}>
            {/* 부모 레이아웃이 지정한 영역을 꽉 채움 */}
            <div className="flex w-full h-full bg-[#F5F5F7] overflow-hidden">
                
                {/* [1] 좌측: 사이드바 */}
                <aside className="hidden md:block w-64 flex-none border-r border-gray-300 bg-white h-full">
                    <LibrarySidebar />
                </aside>
                
                {/* [2] 우측 영역: 콘텐츠(위) + 푸터(아래) 스택 */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* 콘텐츠 영역: 독립적인 스크롤 적용  */}
                    <main className="flex-1 overflow-y-auto bg-[#F5F5F7] scrollbar-hide">
                        {children}
                    </main>

                    {/* [3] 푸터 */}
                    <footer className="flex-none bg-white border-t border-gray-200">
                        <Footer />
                    </footer>
                </div>
            </div>
        </SidebarProvider>
    );
}