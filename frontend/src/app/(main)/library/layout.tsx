'use client';

import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LibrarySidebar } from '@/components/library/LibrarySidebar';

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider defaultOpen={true}>
            {/* [핵심 1] h-[calc(100vh-64px)]: 헤더 제외한 높이로 고정 */}
            {/* [핵심 2] overflow-hidden: 전체 화면 스크롤 제거 (내부에서 스크롤 할 것임) */}
            <div className="flex w-full h-[calc(100vh-64px)] bg-[#F5F5F7] overflow-hidden">
                
                <LibrarySidebar />
                
                {/* 메인 영역도 높이 꽉 채우고 스크롤 막음 */}
                <main className="flex-1 flex flex-col w-full relative md:pl-64 h-full overflow-hidden">
                    
                    {/* 모바일 메뉴 버튼 */}
                    <div className="md:hidden flex-none sticky top-0 z-20 bg-[#F5F5F7]/90 backdrop-blur-sm p-4 border-b flex items-center gap-2">
                        <SidebarTrigger className="p-2 hover:bg-gray-200 rounded-md" />
                        <span className="font-bold text-[#1d1d1f]">메뉴</span>
                    </div>

                    {/* 자식 컴포넌트(LibraryClient)가 높이를 100% 쓸 수 있게 함 */}
                    <div className="flex-1 w-full h-full overflow-hidden">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}