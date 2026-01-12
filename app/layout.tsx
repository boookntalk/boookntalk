import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BoooknTalk',
  description: '책을 매개로 한 시간과 기록의 광장',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-white text-gray-900">
        {children}
      </body>
    </html>
  )
}
