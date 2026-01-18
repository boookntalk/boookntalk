import "./globals.css"; // 경로 확인: 같은 폴더(app) 내에 있어야 함
import { Inter } from 'next/font/google'
import type { Metadata } from "next";

// @/ 대신 상대 경로(../) 사용
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

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
      <body className="antialiased bg-slate-50">
        {/* Header와 Footer는 파일을 만든 후 나중에 추가할 예정입니다 */}
        <main>{children}</main>
      </body>
    </html>
  );
}