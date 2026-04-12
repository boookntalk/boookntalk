// 경로: frontend/src/app/(main)/library/layout.tsx
import React from 'react';

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
    // 💡 [핵심] 최상위 글로벌 layout.tsx에서 이미 사이드바와 레이아웃을 잡아주고 있으므로,
    // 이 파일에서는 어떠한 껍데기(div, aside 등)도 추가하지 않고 자식(page.tsx)만 100% 통과시킵니다.
    // 이렇게 하면 사이드바 공간이 이중으로 잡히는 문제가 즉시 사라집니다.
    return (
        <>
            {children}
        </>
    );
}