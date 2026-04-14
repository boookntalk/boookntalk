import React from 'react';
import StandardContainer from '@/components/layout/StandardContainer';

interface HomeLayoutProps {
    heroSection: React.ReactNode; // 전체 너비를 차지하는 상단 영역 (커버플로우 등)
    children: React.ReactNode;    // StandardContainer 안쪽에 들어갈 메인 콘텐츠
}

export default function HomeLayout({ heroSection, children }: HomeLayoutProps) {
    return (
        <div className="w-full flex flex-col font-sans selection:bg-[#1F3A5F] selection:text-white pb-20">
            
            {/* 상단 Full Bleed 영역 (커버플로우) */}
            <section className="w-full pt-8">
                {heroSection}
            </section>

            {/* 하단 메인 콘텐츠 영역 (1cm 룰이 적용된 와이드 컨테이너) */}
            <StandardContainer size="wide" className="mt-4">
                {children}
            </StandardContainer>
            
        </div>
    );
}