// 파일 경로: src/components/common/InsightCard.tsx
// 역할 및 기능: 서재 인사이트 및 통계 화면에서 공통으로 사용되는 사각형 형태의 UI 카드 컨테이너입니다.

import React from 'react';
import Link from 'next/link';

interface InsightCardProps {
    children: React.ReactNode;
    className?: string;
    href?: string;
}

/**
 * InsightCard 함수
 * 기능: BoooknTalk의 공통 사각형 스타일(rounded-sm)이 적용된 컨테이너를 렌더링하며, href가 전달될 경우 클릭 가능한 링크 카드로 동작합니다.
 */
export function InsightCard({ children, className = '', href }: InsightCardProps) {
    // BoooknTalk의 시그니처 사각형 스타일 (기존 BookRecordCard와 동일한 톤앤매너)
    const baseStyle = `bg-white p-6 rounded-sm border border-gray-200 shadow-sm ${className}`;

    if (href) {
        return (
            <Link href={href} className={`${baseStyle} block group hover:border-[#0066cc] transition-colors`}>
                {children}
            </Link>
        );
    }

    return (
        <div className={baseStyle}>
            {children}
        </div>
    );
}