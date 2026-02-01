import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthContext from "@/components/AuthContext";
import ClientLayout from '@/components/ClientLayout';
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="flex flex-col h-screen overflow-hidden">
        <AuthContext>
          {/* 상단 고정 헤더 */}
          <Header />
          
          {/* pt-[76px]는 헤더(56px) + 여백(20px)입니다. */}
          <main className="flex-1 overflow-y-auto pt-[40px] flex flex-col">
            <div className="flex-1">
              <ClientLayout>
                {children}
              </ClientLayout>
            </div>
            <Footer />
          </main>
        </AuthContext>
      </body>
    </html>
  );
}