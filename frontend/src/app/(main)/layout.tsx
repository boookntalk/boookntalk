'use client';

import { Sidebar, SidebarProvider } from '@/components/ui/sidebar'; 
import { LibrarySidebar } from '@/components/library/LibrarySidebar'; // 👈 내 서재 사이드바 추가
import Header from '@/components/layout/Header'; 
import Footer from '@/components/layout/Footer';
import { usePathname } from 'next/navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isHomePage = pathname === '/'; 
  const isLibraryPage = pathname?.startsWith('/library'); // 👈 내 서재 경로 확인

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[var(--bg-main)]">
        
        {/* 1. 사이드바 영역 */}
        {!isHomePage && (
          <aside className="w-[var(--sidebar-width)] shrink-0 border-r border-[var(--border-light)] bg-white hidden lg:block z-50 h-screen sticky top-0">
            {/* 💡 경로에 따라 알맞은 사이드바를 동적으로 불러옵니다! */}
            {isLibraryPage ? <LibrarySidebar /> : <Sidebar />}
          </aside>
        )}

        {/* 2. 메인 콘텐츠 영역 */}
        <div className="flex flex-col flex-1 min-w-0 relative">
          <div className="sticky top-0 z-40 w-full">
            <Header />
          </div>

          <main className={`flex-1 w-full flex flex-col ${isHomePage ? '' : 'py-[var(--spacing-1cm)]'}`}>
            {children}
          </main>

          <footer className="w-full mt-auto bg-white border-t border-[var(--border-light)]">
            <Footer />
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}