// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google'; // 폰트는 선택사항
import Providers from '@/components/providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BoooknTalk',
  description: '사색을 위한 독서 기록 서비스',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {/* Providers로 감싸주어야 하위 컴포넌트에서 useSession을 쓸 수 있습니다 */}
        <Providers>
          {children}
          {/* ▼▼▼ [추가] 토스트 메시지를 띄워줄 컨테이너입니다 ▼▼▼ */}
          {/* position: 위치 (중앙 상단), richColors: 예쁜 색상 적용, closeButton: 닫기 버튼 표시 */}
          <Toaster position="top-center" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}

