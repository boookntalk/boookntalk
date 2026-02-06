// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google'; // 폰트는 선택사항
// import Providers from '@/components/providers'; // [확인] 경로가 정확한지 확인
import Providers from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BoooknTalk',
  description: '사색을 위한 독서 기록 서비스',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {/* Providers로 감싸주어야 하위 컴포넌트에서 useSession을 쓸 수 있습니다 */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}