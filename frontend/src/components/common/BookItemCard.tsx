'use client';

import React from 'react';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { formatCardAuthor } from '@/utils/formatters';

interface BookItemCardProps {
    onClick: () => void;
    cover?: string;
    title: string;
    author: string;
    footerLeft?: React.ReactNode;
    footerRight?: React.ReactNode;
}

// BoooknTalk의 '도서/목록' 화면 전용 공통 카드
// (기획자님 요청 반영: 카드 고정, 테두리 애니메이션 없음, 오직 책 커버만 부드럽게 상승)
export function BookItemCard({ onClick, cover, title, author, footerLeft, footerRight }: BookItemCardProps) {
    
    // ▼ 테두리 드로잉 관련 코드는 처음부터 없었음을 확인했습니다.

    return (
        <div 
            onClick={onClick}
            // ▼▼▼ [변경] 카드 본체는 고정 (움직임/색상변화 없음), shadow만 은은하게 증가하여 클릭 유도 ▼▼▼
            className="group bg-white rounded-sm p-4 shadow-sm border border-gray-100 flex flex-col h-full relative cursor-pointer
                       transition-shadow duration-300 hover:shadow-md" // shadow만 은은하게 증가
        >
            {/* ▼ 카드 내부 컨텐츠 ▼ */}
            <div className="p-4 flex flex-col h-full relative z-10">
                {/* ▼▼▼ [핵심] 카드 호버 시 책 커버 '만' 위로 상승 애니메이션 적용 ▼▼▼ */}
                {/* (기존 이미지 스케일 제거, duration-300으로 부드럽게 통일) */}
                <div className="relative aspect-[1/1.45] w-[80%] mx-auto rounded-sm overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100 mb-4 shadow-sm
                             transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-md">
                    {cover ? (
                        <Image src={cover} alt={title} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover" unoptimized />
                    ) : (
                        <BookOpen className="w-10 h-10 text-gray-300 opacity-50" />
                    )}
                </div>

                {/* 하단 텍스트(도서 정보) 영역 - 중앙 정렬 */}
                <div className="flex flex-col flex-1 text-center px-1">
                    <h3 className="font-bold text-[#1d1d1f] text-[13px] leading-snug line-clamp-1 mb-1 group-hover:text-[#0066cc] transition-colors duration-300">
                        {title}
                    </h3>
                    <span className="text-[11px] font-medium text-gray-400 line-clamp-1">
                        {formatCardAuthor(author)}
                    </span>
                </div>

                {/* 추가 푸터 영역 (위시리스트 등록일 등 확장을 위한 공간 유지) */}
                {(footerLeft || footerRight) && (
                    <div className="mt-4 pt-3 flex items-center justify-between border-t border-gray-50 text-[11px]">
                        <div className="text-gray-400 font-semibold">{footerLeft}</div>
                        <div onClick={(e) => e.stopPropagation()} className="z-10">{footerRight}</div>
                    </div>
                )}
            </div>
        </div>
    );
}