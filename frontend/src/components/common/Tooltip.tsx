// 파일 경로: src/components/common/Tooltip.tsx
// 역할 및 기능: BoooknTalk 서비스 전역에서 사용되는 공통 툴팁 컴포넌트입니다. 눈의 피로를 줄이는 다크 테마를 적용하고, 화면 가림 현상을 방지하기 위해 노출 방향(top/bottom)을 제어합니다.

import React, { ReactNode } from 'react';

interface TooltipProps {
    content: ReactNode;
    children: ReactNode;
    position?: 'top' | 'bottom';
}

// 함수 기능: 자식 요소(children)에 마우스 오버 시, 눈이 편안한 색상(bg-slate-800, text-slate-100)의 툴팁 내용을 설정한 방향에 맞게 화면 최상단(z-[9999])에 렌더링합니다.
export function Tooltip({ content, children, position = 'bottom' }: TooltipProps) {
    if (!content) return <>{children}</>;

    // 💡 기획 요건 반영: 하단 메뉴에 가려지지 않도록 위로 열리는(top) 옵션 추가 및 최상위 z-index 적용
    const positionClasses = position === 'top' 
        ? "bottom-full mb-3" 
        : "top-full mt-3";

    return (
        <div className="relative group w-full cursor-pointer">
            {children}
            {/* 💡 기획 요건 반영: 눈이 편안한 다크 그레이 배경(#1e293b)과 부드러운 흰색 텍스트(#f1f5f9) 적용 */}
            <div className={`absolute z-[9999] left-0 ${positionClasses} w-full max-w-[500px] p-6 bg-slate-800 text-slate-100 text-[13px] font-medium leading-relaxed rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none break-keep`}>
                {content}
            </div>
        </div>
    );
}