// src/app/(main)/layout.tsx
import React from 'react';
import Header from '@/components/layout/Header'; // 경로 확인해 주세요
import Footer from '@/components/layout/Footer'; // Footer 컴포넌트 경로 확인 (없으면 지우세요)

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    // [핵심 수정] 
    // 1. min-h-screen: 최소 높이를 화면 전체로 잡아서 내용이 적어도 Footer가 바닥에 붙게 함
    // 2. flex flex-col: 세로 배치 모드 (헤더-본문-푸터)
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col"> 
      
      {/* 상단 헤더 (고정) */}
      <Header />
      
      {/* 중앙 본문 (가변)
         - flex-1: 남은 공간을 다 차지함 (Footer를 아래로 밀어냄)
         - pt-16: 고정 헤더에 가려지지 않게 여백 (Header 높이에 맞춰 조절하세요)
         - w-full: 가로 꽉 채움
      */}
      <main className="flex-1 w-full pt-10 flex flex-col">
        {children}
      </main>

      {/* 하단 푸터 */}
      <Footer />
      
    </div>
  );
}