//frontend/src/components/common/BookRecordCard.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { Star, BookOpen } from 'lucide-react';
import { formatCardAuthor } from '@/utils/formatters';
import { FloatingCover } from '@/components/common/FloatingCover';

interface BookRecordCardProps {
    id: string | number;
    onClick: () => void;
    book_cover?: string;
    book_title: string;
    book_author: string;
    rating?: number;
    children: React.ReactNode; 
    footerLeft?: React.ReactNode; 
    footerRight?: React.ReactNode; 
}

export function BookRecordCard({
    onClick, book_cover, book_title, book_author, rating, children, footerLeft, footerRight
}: BookRecordCardProps) {
    
    // 테두리를 그리는 애니메이션 공통 클래스
    const lineBase = "absolute bg-[#0066cc] transition-all ease-linear";

    return (
        <div 
            onClick={onClick}
            // 카드 본체: 움직이지 않고 제자리에 고정, overflow-hidden으로 선이 넘치지 않게 제어
            className="group bg-white rounded-sm shadow-sm border border-gray-100 flex flex-col h-full relative cursor-pointer overflow-hidden transition-colors duration-300"
        >
            {/* ▼ 테두리 드로잉 애니메이션 레이어 (순차적으로 그려짐) ▼ */}
            {/* 1. 위쪽 선 (0ms) */}
            <span className={`${lineBase} top-0 left-0 h-[2px] w-0 group-hover:w-full duration-150`} />
            {/* 2. 오른쪽 선 (150ms 대기) */}
            <span className={`${lineBase} top-0 right-0 w-[2px] h-0 group-hover:h-full duration-150 delay-150`} />
            {/* 3. 아래쪽 선 (300ms 대기) */}
            <span className={`${lineBase} bottom-0 right-0 h-[2px] w-0 group-hover:w-full duration-150 delay-300`} />
            {/* 4. 왼쪽 선 (450ms 대기) */}
            <span 
                className={`${lineBase} bottom-0 left-0 w-[2px] h-0 group-hover:h-full duration-150`} 
                style={{ transitionDelay: '450ms' }} 
            />
            
            {/* ▼ 카드 내부 컨텐츠 (p-4) ▼ */}
            <div className="p-4 flex flex-col h-full relative z-10">
                <div className="flex items-start gap-4 mb-4 pb-4 border-b border-gray-50">
                    {/* 책 커버: 호버 시 위로 살짝 올라가는 애니메이션 */}
                    <FloatingCover src={book_cover} className="w-12 h-16 shrink-0" iconSize={20} />
                    <div className="flex flex-col justify-center flex-1 min-w-0 pt-1">
                        <h3 className="font-bold text-[#1d1d1f] text-[14px] leading-snug line-clamp-1 group-hover:text-[#0066cc] transition-colors">{book_title}</h3>
                        <span className="text-[11px] font-medium text-gray-400 line-clamp-1 mt-1">{formatCardAuthor(book_author)}</span>
                        
                        {/* 별점이 있을 경우만 렌더링 */}
                        {rating !== undefined && (
                            <div className="flex items-center gap-0.5 mt-auto pt-2">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} fill={s <= rating ? "#FFCC00" : "#E5E7EB"} className={s <= rating ? "text-[#FFCC00]" : "text-gray-200"} />)}
                                <span className="text-[10px] font-bold text-[#1d1d1f] ml-1.5">{rating}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 중앙 텍스트 영역 (SmartTruncatedText) */}
                <div className="flex-1 flex flex-col">
                    {children}
                </div>

                {/* 하단 푸터 영역 */}
                <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50">
                    <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">{footerLeft}</div>
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 rounded-full z-20">{footerRight}</div>
                </div>
            </div>
        </div>
    );
}