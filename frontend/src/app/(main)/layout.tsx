// 경로: src/app/(main)/layout.tsx
// 기능: BoooknTalk 메인 레이아웃으로 헤더를 최상단 전체 너비로 확장하고, 하단에 사이드바 및 컨텐츠를 배치합니다.
'use client';

import { Sidebar, SidebarProvider } from '@/components/ui/sidebar'; 
import { LibrarySidebar } from '@/components/library/LibrarySidebar';
import Header from '@/components/layout/Header'; 
import Footer from '@/components/layout/Footer';
import { usePathname } from 'next/navigation';

/**
 * MainLayout 컴포넌트
 * 전체 화면 너비의 헤더를 최상단에 고정하고, 그 아래에 사이드바와 메인 컨텐츠를 동적으로 렌더링합니다.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isHomePage = pathname === '/'; 
  const isLibraryPage = pathname?.startsWith('/library');

  return (
    <SidebarProvider>
      {/* 💡 전체를 감싸는 컨테이너를 flex-col로 설정하여 헤더가 상단 전체 너비를 차지하게 합니다. */}
      <div className="flex flex-col min-h-screen w-full bg-[var(--bg-main)]">
        
        {/* 1. 최상단 고정 헤더 영역 (전체 너비) */}
        <div className="sticky top-0 z-[60] w-full">
          <Header />
        </div>

        {/* 2. 하단 영역 (사이드바 + 메인 콘텐츠) */}
        <div className="flex flex-1 w-full min-w-0">
          
          {/* 사이드바 영역 */}
          {!isHomePage && (
            <aside className="w-[var(--sidebar-width)] shrink-0 border-r border-[var(--border-light)] bg-white hidden lg:block z-40 relative">
              {isLibraryPage ? <LibrarySidebar /> : <Sidebar />}
            </aside>
          )}

          {/* 메인 콘텐츠 영역 */}
          <div className="flex flex-col flex-1 min-w-0 relative">
            <main className={`flex-1 w-full flex flex-col ${isHomePage ? '' : 'py-[var(--spacing-1cm)]'}`}>
              {children}
            </main>

            <footer className="w-full mt-auto bg-white border-t border-[var(--border-light)]">
              <Footer />
            </footer>
          </div>
          
        </div>
      </div>
    </SidebarProvider>
  );
}