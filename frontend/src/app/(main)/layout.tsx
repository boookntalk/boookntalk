// src/app/(main)/layout.tsx

import Header from '@/components/layout/Header'; // 경로 확인
import Footer from '@/components/layout/Footer'; // 경로 확인

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen">
            {/* [수정 1] 헤더: sticky, top-0, z-50 (가장 높게 설정) */}
            <div className="sticky top-0 z-50 w-full bg-white border-b">
                <Header />
            </div>

            {/* 메인 콘텐츠 영역 */}
            <main className="flex-1 relative z-0">
                {children}
            </main>

            {/* 풋터 */}
            <Footer />
        </div>
    );
}