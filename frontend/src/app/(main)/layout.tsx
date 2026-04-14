// 경로: src/app/(main)/layout.tsx
// 기능: BoooknTalk 메인 레이아웃으로 헤더와 푸터를 최상/최하단 전체 너비로 확장하고, 중앙에 사이드바 및 컨텐츠를 배치합니다.

'use client';

import { Sidebar, SidebarProvider } from '@/components/ui/sidebar'; 
import { LibrarySidebar } from '@/components/library/LibrarySidebar';
import Header from '@/components/layout/Header'; 
import Footer from '@/components/layout/Footer';
import { usePathname } from 'next/navigation';

/**
 * MainLayout 컴포넌트
 * 전체 화면 너비의 헤더와 푸터를 상하단에 고정하고, 그 사이에 사이드바와 메인 컨텐츠를 동적으로 렌더링합니다.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isHomePage = pathname === '/'; 

  // 💡 내 서재, 나의 기록, 나의 작가 메뉴 그룹 전체를 포괄하는 조건
  const isLibrarySidebarGroup = pathname?.startsWith('/library') || 
                                pathname?.startsWith('/my-records') || 
                                pathname?.startsWith('/my-authors');

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full bg-[var(--bg-main)]">
        
        {/* 1. 최상단 고정 헤더 영역 (전체 너비) */}
        <div className="sticky top-0 z-[60] w-full flex-none">
          <Header />
        </div>

        {/* 2. 중앙 영역 (사이드바 + 메인 콘텐츠) */}
        {/* 💡 flex-1을 주어 남는 공간을 모두 차지하게 밀어냅니다. */}
        <div className="flex flex-1 w-full min-w-0">
          
          {/* 사이드바 영역 */}
          {!isHomePage && (
            <aside className="w-[var(--sidebar-width)] shrink-0 border-r border-[var(--border-light)] bg-white hidden lg:block z-40 relative">
              {isLibrarySidebarGroup ? <LibrarySidebar /> : <Sidebar />}
            </aside>
          )}

          {/* 메인 콘텐츠 영역 */}
          <div className="flex flex-col flex-1 min-w-0 relative">
            <main className={`flex-1 w-full flex flex-col ${isHomePage ? '' : 'py-[var(--spacing-1cm)]'}`}>
              {children}
            </main>
          </div>
          
        </div>

        {/* 3. 최하단 푸터 영역 (전체 너비) */}
        {/* 💡 [핵심 수정] 푸터를 '중앙 영역'의 밖으로 빼내어, 헤더처럼 화면 전체 너비를 차지하도록 독립시켰습니다! */}
        <footer className="w-full flex-none bg-white border-t border-[var(--border-light)] relative z-50">
          <Footer />
        </footer>

      </div>
    </SidebarProvider>
  );
}