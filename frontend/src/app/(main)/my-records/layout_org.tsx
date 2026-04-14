'use client';

import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { LibrarySidebar } from '@/components/library/LibrarySidebar';
import Footer from '@/components/layout/Footer';

export default function MyRecordsLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex w-full h-full bg-[#F5F5F7] overflow-hidden">
                {/* 좌측: 고정된 공통 LNB */}
                <aside className="hidden md:block w-64 flex-none border-r border-gray-300 bg-white h-full">
                    <LibrarySidebar />
                </aside>
                
                {/* 우측: 나의 기록 컨텐츠 및 푸터 */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
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