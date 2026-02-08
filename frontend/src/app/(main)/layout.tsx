import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getServerSession } from 'next-auth'; 
import GlobalAddBookFAB from '@/components/GlobalAddBookFAB';

// [체크] 경로가 올바른지 다시 한번 확인해주세요. (src/lib/auth.ts)
import { authOptions } from '@/lib/auth';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // 1. 서버 세션 가져오기
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col relative"> 
      {/* 헤더 */}
      <Header />
      
      {/* 본문 영역 */}
      <main className="flex-1 w-full pt-10 flex flex-col">
        {children}
      </main>

      {/* 푸터 */}
      <Footer />
      
      {/* [타입 안전성 보강] 
        session.user.email은 string | null 일 수 있는데, 
        컴포넌트가 undefined를 원할 경우를 대비해 (|| undefined)를 추가합니다.
      */}
      <GlobalAddBookFAB userEmail={session?.user?.email || undefined} />
    </div>
  );
}