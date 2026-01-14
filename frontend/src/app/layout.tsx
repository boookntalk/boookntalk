import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "boookntalk | 시간과 기억의 기록",
  description: "책을 소유가 아닌 시간의 흐름으로 기록하고 대화합니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-white text-slate-900 antialiased font-sans">
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow container mx-auto px-6 py-12 max-w-7xl">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}