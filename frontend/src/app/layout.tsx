//'use client';
// src/app/layout.tsx
import { SessionProvider } from "next-auth/react";
import type { Metadata } from "next";
import "./globals.css"; // 경로 확인: 같은 폴더(app) 내에 있어야 함
import { Inter } from 'next/font/google'
import AuthContext from "@/components/AuthContext"; // 경로 확인


// @/ 대신 상대 경로(../) 사용
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export const metadata: Metadata = {
  title: "boookntalk",
  description: "책과 대화가 머무는 시간",
};

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="ko">
//       <body className="antialiased bg-slate-50">
//         {/* Header와 Footer는 파일을 만든 후 나중에 추가할 예정입니다 */}
//         <main>{children}</main>
//       </body>
//     </html>
//   );
// }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* ✅ 클라이언트 컴포넌트인 AuthContext로 감싸서 Session 기능을 제공합니다. */}
        <AuthContext>
          {children}
        </AuthContext>
      </body>
    </html>
  );
}