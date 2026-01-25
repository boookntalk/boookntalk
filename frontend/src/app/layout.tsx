// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";

// 컴포넌트 임포트
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthContext from "@/components/AuthContext";
import ClientLayout from '@/components/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

// 상용 서비스 SEO를 위한 메타데이터
export const metadata: Metadata = {
  title: "boookntalk",
  description: "책과 대화가 머무는 시간",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {/* NextAuth 세션을 위한 컨텍스트 (클라이언트 컴포넌트) */}
        <AuthContext>
          {/* 공통 헤더 */}
          <Header />
          
          {/* FAB와 Modal 상태를 관리하는 클라이언트 래퍼 */}
          <ClientLayout>
            {children}
          </ClientLayout>

          {/* 공통 푸터 */}
          <Footer />
        </AuthContext>
      </body>
    </html>
  );
}