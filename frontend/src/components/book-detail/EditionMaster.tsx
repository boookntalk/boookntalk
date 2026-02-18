'use client';

import React from 'react';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Share2, BookType, Hash, CalendarDays, Layers } from 'lucide-react';

interface EditionMasterProps {
    edition: any;
    work: any;
    relatedEditions: any[];
    onEditionChange: (editionId: string) => void;
}

export default function EditionMaster({ 
    edition, 
    work, 
    relatedEditions, 
    onEditionChange 
}: EditionMasterProps) {

    // 날짜 포맷팅 안전 장치
    const formattedDate = edition.pubDate 
        ? new Date(edition.pubDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' }) 
        : '출간일 미상';

    return (
        <aside className="flex flex-col gap-8">
            {/* 1. 3D Book Cover Area */}
            <div className="relative w-full flex justify-center py-8 group perspective-[1000px]">
                {/* 배경 블러 효과 */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-transparent opacity-50 rounded-full blur-3xl -z-10 scale-75 translate-y-10" />
                
                {/* 3D 책 표지 컨테이너 */}
                <div className="relative w-[200px] aspect-[1/1.5] transition-all duration-500 ease-out transform-style-3d group-hover:rotate-y-0 rotate-y-[-15deg] shadow-2xl">
                    {/* 앞표지 */}
                    {edition.cover ? (
                        <Image 
                            src={edition.cover} 
                            alt={work.title} 
                            fill 
                            className="object-cover rounded-r-md rounded-l-sm shadow-inner z-10"
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 rounded-r-md">
                            No Cover
                        </div>
                    )}
                    {/* 책등 (Spine) 효과 */}
                    <div className="absolute top-0 bottom-0 left-0 w-[12px] bg-gray-800 transform -translate-x-full origin-right rotate-y-90 rounded-l-sm opacity-90" />
                    {/* 그림자 효과 */}
                    <div className="absolute top-2 left-2 w-full h-full bg-black/20 blur-md -z-10 transform translate-z-[-20px] rounded-md" />
                </div>
            </div>

            {/* 2. Edition Switcher */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-end px-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Layers size={12} /> Edition Select
                    </label>
                    <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        Total {relatedEditions.length}
                    </span>
                </div>

                <Select onValueChange={onEditionChange} defaultValue={edition.id.toString()}>
                    <SelectTrigger className="w-full h-12 bg-white border-gray-200 shadow-sm rounded-xl text-left font-medium text-[#1d1d1f] hover:border-blue-400 transition-colors focus:ring-2 focus:ring-blue-100">
                        <SelectValue placeholder="에디션 선택" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {relatedEditions.map((ed: any) => (
                            <SelectItem key={ed.id} value={ed.id.toString()} className="py-3 cursor-pointer">
                                <div className="flex flex-col gap-0.5 text-left">
                                    <span className="font-semibold text-sm text-[#1d1d1f] truncate w-[220px]">
                                        {ed.publisher} 
                                        {ed.publish_date && <span className="text-gray-400 font-normal ml-1">({ed.publish_date.substring(0,4)})</span>}
                                    </span>
                                    {ed.isbn && (
                                        <span className="text-[10px] text-gray-400 font-mono">ISBN {ed.isbn}</span>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* 3. Core Metadata */}
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] leading-tight mb-2 tracking-tight">
                        {work.title}
                    </h1>
                    <div className="flex flex-col gap-1">
                        <p className="text-lg font-medium text-gray-800">
                            {work.author} <span className="text-gray-400 text-sm font-normal">지음</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 py-5 border-t border-b border-gray-100">
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-400 flex items-center gap-1.5"><BookType size={12} /> 출판사</span>
                        <span className="text-sm font-semibold text-[#1d1d1f]">{edition.publisher}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-400 flex items-center gap-1.5"><CalendarDays size={12} /> 출간일</span>
                        <span className="text-sm font-medium text-[#1d1d1f]">{formattedDate}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-400 flex items-center gap-1.5"><Layers size={12} /> 페이지</span>
                        <span className="text-sm font-medium text-[#1d1d1f]">{edition.page_count}p</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-400 flex items-center gap-1.5"><Hash size={12} /> ISBN</span>
                        <span className="text-sm font-medium text-[#1d1d1f] tracking-tight">{edition.isbn}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">
                        {work.category || "장르 미상"}
                    </Badge>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-600 h-11 rounded-xl">
                        <Share2 size={16} className="mr-2" /> 공유하기
                    </Button>
                    <Button className="flex-1 bg-[#1d1d1f] hover:bg-[#333] text-white h-11 rounded-xl shadow-lg shadow-black/5">
                        기록 수정
                    </Button>
                </div>
            </div>
        </aside>
    );
}