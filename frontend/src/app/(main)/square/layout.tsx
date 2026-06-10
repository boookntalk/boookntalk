// 경로: frontend/src/app/(main)/square/layout.tsx
// 역할 및 기능: 광장 메뉴의 독립적인 레이아웃 진입점 역할을 수행하며, 글로벌 레이아웃 구조와 충돌 없이 하위 콘텐츠만 통과시킵니다.

import React from 'react';

export default function SquareLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
        </>
    );
}