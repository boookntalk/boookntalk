// 경로: frontend/src/app/(main)/layout.tsx
// 역할 및 기능: BoooknTalk 전체 레이아웃을 제어합니다. 
// 홈(/), 광장(/square), 도서 상세(/works), 검색(/search) 등 퍼블릭 탐색 공간에서는 LNB를 숨겨 탁 트인 시야를 제공하고, 내 서재 등 개인 공간에서만 LNB를 표시합니다.

'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar'; 
import { LibrarySidebar } from '@/components/library/LibrarySidebar';
import Header from '@/components/layout/Header'; 
import Footer from '@/components/layout/Footer';
import { usePathname } from 'next/navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 💡 [핵심 수정] LNB를 숨겨야 하는 퍼블릭 경로들을 모두 정의합니다.
  const isHomePage = pathname === '/'; 
  const isSquarePage = pathname?.startsWith('/square'); 
  const isWorkPage = pathname?.startsWith('/works');   // 도서 상세 페이지 (Work Hub)
  const isSearchPage = pathname?.startsWith('/search'); // 검색 페이지

  const isLibrarySidebarGroup = pathname?.startsWith('/library') || 
                                pathname?.startsWith('/my-records') || 
                                pathname?.startsWith('/my-authors');

  // 홈, 광장, 도서 상세, 검색 페이지가 아닐 때만 LNB(사이드바)를 렌더링합니다.
  const showSidebar = isMounted && !isHomePage && !isSquarePage && !isWorkPage && !isSearchPage;

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full bg-[var(--bg-main)]">
        
        {/* 1. 최상단 고정 헤더 영역 (전체 너비) */}
        <div className="sticky top-0 z-[60] w-full flex-none">
          <Header />
        </div>

        {/* 2. 중앙 컨테이너 */}
        <div className="flex flex-1 w-full min-w-0">
          
          {/* 사이드바 영역 (조건에 부합할 때만 렌더링) */}
          {showSidebar && (
            <aside className="w-[var(--sidebar-width)] shrink-0 border-r border-[var(--border-light)] bg-white hidden lg:block z-40 relative">
              {isLibrarySidebarGroup ? <LibrarySidebar /> : <Sidebar />}
            </aside>
          )}

          {/* 우측 영역 (메인 콘텐츠 + 푸터) */}
          <div className="flex flex-col flex-1 min-w-0 relative">
            <main className={`flex-1 w-full flex flex-col ${!showSidebar ? '' : 'py-[var(--spacing-1cm)]'}`}>
              {children}
            </main>
            
            {/* 3. 푸터 영역 */}
            <footer className="w-full flex-none bg-white border-t border-[var(--border-light)] relative z-50">
              <Footer />
            </footer>
          </div>
          
        </div>
      </div>
    </SidebarProvider>
  );
}