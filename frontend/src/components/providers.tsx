// src/components/providers.tsx
'use client'; // [중요] 이 줄이 없으면 에러가 납니다!

import { SessionProvider } from "next-auth/react";

interface Props {
  children: React.ReactNode;
}

export default function Providers({ children }: Props) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}