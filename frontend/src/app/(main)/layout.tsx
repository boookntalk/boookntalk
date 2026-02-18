// src/app/(main)/layout.tsx
import Header from '@/components/layout/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        /* 전체 화면을 위아래(Header / Main Content)로 나누는 flex-col */
        <div className="flex flex-col h-screen w-full overflow-hidden bg-[#F5F5F7]">
            {/* [1] 헤더: 상단 전체 가로 폭 차지 및 고정  */}
            <header className="flex-none h-14 bg-white border-b border-gray-200 z-50">
                <Header />
            </header>

            {/* [2] 아래 영역: 사이드바와 콘텐츠가 들어갈 공간 [cite: 209] */}
            <main className="flex-1 flex overflow-hidden relative">
                {children}
            </main>
        </div>
    );
}