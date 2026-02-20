// frontend/src/components/book-detail/BookTopInfo.tsx

'use client';

import React, { useState } from 'react';
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
import { Star, Calendar, ChevronDown, ChevronUp, Info, Quote } from 'lucide-react';

interface BookTopInfoProps {
    record: any;
    edition: any;
    work: any;
    myEditions: any[];
    onRecordChange: (recordId: string) => void;
}

export default function BookTopInfo({ 
    record, 
    edition, 
    work, 
    myEditions, 
    onRecordChange 
}: BookTopInfoProps) {
    // [추가] Level 2 상세 정보 노출 상태 관리
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const pubDate = edition.pubDate 
        ? new Date(edition.pubDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' }) 
        : '';

    const renderStars = (rating: number) => {
        return (
            <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star} 
                        size={16} 
                        fill={star <= rating ? "currentColor" : "none"} 
                        className={star <= rating ? "text-yellow-400" : "text-gray-300"}
                    />
                ))}
            </div>
        );
    };

    return (
        /* [수정] bg-white는 유지하되, 헤더와 중복되는 border-b 및 shadow 제거 */
        <section className="bg-white">
            {/* [수정] max-w를 1440px로 확장하고, 상단 padding(pt-4)을 조절하여 내 서재와 높이감 통일 */}
            <div className="max-w-[1440px] mx-auto px-8 pt-4 pb-12">
                <div className="flex flex-col md:flex-row gap-10">
                    
                    {/* [Left] 책 표지 영역 */}
                    <div className="flex-shrink-0 mx-auto md:mx-0 w-[200px] md:w-[220px]">
                        <div className="relative aspect-[1/1.5] shadow-[0_10px_30px_rgba(0,0,0,0.15)] rounded-r-lg group perspective-[1000px]">
                            <div className="relative w-full h-full transition-transform duration-500 transform-style-3d group-hover:rotate-y-[-10deg]">
                                {edition.cover ? (
                                    <Image 
                                        src={edition.cover} 
                                        alt={work.title} 
                                        fill 
                                        className="object-cover rounded-r-lg rounded-l-sm z-10 bg-gray-100"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No Cover</div>
                                )}
                                <div className="absolute left-0 top-0 bottom-0 w-3 bg-gray-800 -translate-x-full origin-right rotate-y-90 opacity-80" />
                            </div>
                        </div>
                        
                        <Button variant="outline" className="w-full mt-6 border-blue-200 text-blue-600 hover:bg-blue-50 h-10 rounded-lg text-sm font-medium">
                            미리보기
                        </Button>
                    </div>

                    {/* [Right] 정보 영역 */}
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            {/* Level 1: 카테고리 & 에디션 스위처 */}
                            <div className="flex justify-between items-start mb-4">
                                <Badge variant="secondary" className="text-gray-500 bg-gray-100 font-normal hover:bg-gray-200 px-2 py-1">
                                    {work.category || "장르 미상"}
                                </Badge>

                                {myEditions && myEditions.length > 1 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 font-medium">내 서재의 다른 에디션</span>
                                        <Select onValueChange={onRecordChange} defaultValue={record.id.toString()}>
                                            <SelectTrigger className="w-[180px] h-8 text-xs bg-white border-gray-300">
                                                <SelectValue placeholder="에디션 선택" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {myEditions.map((ed: any) => (
                                                    <SelectItem key={ed.record_id} value={ed.record_id.toString()}>
                                                        <div className="flex items-center gap-2 w-full">
                                                            <span className={`truncate max-w-[120px] ${ed.is_current ? "font-bold" : ""}`}>
                                                                {ed.publisher} ({ed.publish_date?.substring(0,4)})
                                                            </span>
                                                            {ed.is_current && <span className="text-[10px] text-blue-500">Current</span>}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {/* Level 1: 타이틀 & 저자 정보 */}
                            <h1 className="text-3xl md:text-4xl font-bold text-[#1d1d1f] leading-snug mb-3 tracking-tight break-keep">
                                {work.title}
                            </h1>
                            <p className="text-lg text-gray-700 font-medium mb-4">
                                {work.author} <span className="text-gray-400 text-sm font-normal">지음</span>
                                <span className="mx-2 text-gray-300">|</span>
                                {edition.publisher} <span className="text-gray-400 text-base font-normal">펴냄</span>
                                <span className="ml-2 text-gray-400 text-sm font-normal">({pubDate.substring(0,4)})</span>
                            </p>

                            {/* [Level 2] 요약 서지정보 토글 버튼 */}
                            <button 
                                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                                className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-6"
                            >
                                <Info size={14} />
                                <span>도서 상세 사양</span>
                                {isDetailsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {/* [Level 2] 펼쳐지는 상세 정보 영역 */}
                            {isDetailsOpen && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 text-[13px] text-gray-600 bg-gray-50/50 rounded-xl p-4 border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200 mb-6">
                                    <div><span className="text-gray-400 mr-2">발행일</span> {pubDate}</div>
                                    <div><span className="text-gray-400 mr-2">쪽수</span> {edition.page_count}p</div>
                                    <div><span className="text-gray-400 mr-2">판형</span> {edition.format || "양장본"}</div>
                                    <div><span className="text-gray-400 mr-2">ISBN</span> {edition.isbn}</div>
                                    {work.original_title && (
                                        <div className="col-span-full border-t border-gray-100 pt-2 mt-1">
                                            <span className="text-gray-400 mr-2">원제</span> 
                                            <span className="italic font-serif">{work.original_title}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* [NEW] 150자 제한 및 마우스 호버(Tooltip) 책 소개 영역 */}
                            <div className="mb-6 relative group">
                                <h3 className="font-bold text-[#1d1d1f] mb-2 text-sm">책 소개</h3>
                                
                                {(() => {
                                    const desc = edition.description || "상세 설명이 없습니다.";
                                    const isLong = desc.length > 150;
                                    const displayDesc = isLong ? desc.slice(0, 150) + "..." : desc;

                                    return (
                                        <>
                                            {/* 기본 화면에 보이는 150자 텍스트 */}
                                            <p className="text-[14px] text-gray-600 leading-relaxed font-medium cursor-default">
                                                {displayDesc}
                                            </p>
                                            
                                            {/* 호버 시 나타나는 전체 내용 (Progressive Disclosure) */}
                                            {isLong && (
                                                <div className="absolute left-0 top-[100%] mt-2 w-[calc(100%+2rem)] p-5 bg-[#1d1d1f] text-[#f5f5f7] text-[13px] leading-relaxed rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] shadow-2xl">
                                                    {desc}
                                                    {/* 툴팁 꼬리 */}
                                                    <div className="absolute top-[-6px] left-6 w-3 h-3 bg-[#1d1d1f] rotate-45" />
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* 나의 기록 요약 (기존 유지) */}
                        {/* ▼▼▼ [수정] 나의 독서 기록 요약 (상단 우측 배치) ▼▼▼ */}
                        <div className="mt-[var(--spacing-1cm)] bg-[#fafafa] rounded-2xl p-6 border border-gray-200 flex flex-col gap-4">
                            
                            {/* 1. 상태, 매체, 별점 헤더 */}
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className={`px-3 py-1 rounded-full text-[13px] font-bold border ${
                                        record.status === 'READING' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                        record.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' :
                                        'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                        {record.status === 'READING' ? '읽는 중' : record.status === 'COMPLETED' ? '완독' : '읽고 싶음'}
                                    </div>
                                    {record.reading_format && (
                                        <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">
                                            {record.reading_format === 'PAPER' ? '종이책' : record.reading_format === 'EBOOK' ? '전자책' : '오디오북'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-400">나의 별점</span>
                                    {renderStars(record.rating || 0)}
                                </div>
                            </div>

                            {/* 2. 진행률 바 (읽는 중일 때만 노출) */}
                            {record.status === 'READING' && (
                                <div className="flex flex-col gap-2 py-1">
                                    <div className="flex justify-between items-center text-xs font-semibold">
                                        <span className="text-gray-500">독서 진행률</span>
                                        <span className="text-blue-600">{Math.round(((record.current_page || 0) / (edition.page_count || 1)) * 100)}% ({record.current_page}p / {edition.page_count}p)</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-500 transition-all duration-500" 
                                            style={{ width: `${Math.min(((record.current_page || 0) / (edition.page_count || 1)) * 100, 100)}%` }} 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* 3. 한 줄 평 */}
                            {record.short_review && (
                                <div className="bg-white p-4 rounded-xl border border-gray-100 relative">
                                    <Quote size={16} className="absolute top-4 left-4 text-gray-200" />
                                    <p className="pl-8 text-[14px] text-gray-700 leading-relaxed break-keep font-medium">
                                        {record.short_review}
                                    </p>
                                </div>
                            )}

                            {/* 4. 나의 태그 */}
                            {record.tags && record.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {record.tags.map((tag: string, idx: number) => (
                                        <span key={idx} className="text-xs font-bold text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-md">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}