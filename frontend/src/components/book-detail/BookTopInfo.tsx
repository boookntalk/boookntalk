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
import { Star, Info, Quote, Layers, BookType, ExternalLink, MessageSquare } from 'lucide-react';

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
    // 1. 날짜 포맷팅
    let pubDate = '';
    let pubYear = '';
    if (edition.pubDate) {
        try {
            const d = new Date(edition.pubDate);
            if (!isNaN(d.getTime())) {
                pubDate = d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' });
                pubYear = d.getFullYear().toString();
            }
        } catch (e) {}
    }

    // 2. 고화질 표지 변환
    const getHighResCover = (url: string) => {
        if (!url) return '';
        if (url.includes('pstatic.net')) {
            return url.replace(/\?type=m\d/g, '?type=w1200');
        }
        return url;
    };

    // 3. 저자명 정돈
    const formatAuthor = (authorStr: string) => {
        if (!authorStr) return "저자 미상";
        return authorStr.replace(/;/g, ' • ').replace(/\|/g, ' • ').trim();
    };

    // 4. 네이버 외부 링크
    const externalLink = `https://search.shopping.naver.com/book/search?query=${edition.isbn}`;

    const renderStars = (rating: number) => {
        return (
            <div className="flex text-[#FFCC00]">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star} 
                        size={16} 
                        fill={star <= rating ? "currentColor" : "none"} 
                        className={star <= rating ? "text-[#FFCC00]" : "text-gray-200"}
                    />
                ))}
            </div>
        );
    };

    const rawDesc = edition.description || work.description || "";
    const displayDesc = rawDesc.trim() || "상세 설명이 없습니다.";

    return (
        <section className="bg-white border-b border-gray-100">
            <div className="max-w-[1440px] mx-auto px-8 pt-8 pb-10">
                {/* 메인 레이아웃: 좌측(표지/버튼) + 우측(정보) 간격 복구 (모바일은 40px, 데스크탑은 48px) */}
                <div className="flex flex-col md:flex-row gap-10 md:gap-12"> 
                    {/* [1. 좌측 영역]: 시각 및 부가 기능 (Visual & Tools) */}
                    <div className="flex-shrink-0 mx-auto md:mx-0 w-[200px] md:w-[220px] flex flex-col gap-4">
                        <div className="relative aspect-[1/1.45] shadow-[0_12px_24px_rgba(0,0,0,0.12)] rounded-r-lg group perspective-[1000px]">
                            <div className="relative w-full h-full transition-transform duration-500 transform-style-3d group-hover:rotate-y-[-5deg]">
                                {edition.cover ? (
                                    <Image 
                                        src={getHighResCover(edition.cover)} 
                                        alt={work.title} 
                                        fill 
                                        className="object-cover rounded-r-lg rounded-l-sm z-10 bg-gray-100 border border-black/5"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-gray-400 border border-gray-200 rounded-r-lg">
                                        <BookType size={32} className="mb-2 opacity-20" />
                                        <span className="text-xs font-semibold">No Cover</span>
                                    </div>
                                )}
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/30 to-transparent -translate-x-full origin-right rotate-y-90 opacity-90 rounded-l-sm" />
                            </div>
                        </div>
                        
                        {/* 가로로 나란히 배치하여 높이 최소화 */}
                        <div className="flex gap-2 w-full">
                            <Button variant="outline" className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 h-10 rounded-xl text-[13px] font-bold shadow-sm">
                                미리보기
                            </Button>
                            <Button 
                                variant="secondary" 
                                onClick={() => window.open(externalLink, '_blank')}
                                className="w-10 h-10 rounded-xl bg-[#03C75A]/10 text-[#03C75A] hover:bg-[#03C75A]/20 p-0 flex-shrink-0"
                                title="네이버 도서에서 보기"
                            >
                                <ExternalLink size={16} />
                            </Button>
                        </div>
                    </div>

                    {/* [2. 우측 영역]: 정보 및 액션 (Info & Actions) */}
                    <div className="flex-1 flex flex-col min-w-0">
                        
                        {/* Group A: 핵심 식별 정보 (Core Identity) */}
                        <div className="flex justify-between items-start mb-1">
                            <h1 className="text-[28px] md:text-[32px] font-extrabold text-[#1d1d1f] leading-tight tracking-tight break-keep pr-4">
                                {work.title}
                            </h1>
                            {/* 내 서재의 다른 에디션 스위처를 상단으로 이동 */}
                            {myEditions && myEditions.length > 1 && (
                                <Select onValueChange={onRecordChange} defaultValue={record.id.toString()}>
                                    <SelectTrigger className="w-[160px] h-8 text-[12px] bg-gray-50 border-transparent rounded-lg focus:ring-[#0066cc]">
                                        <SelectValue placeholder="다른 에디션 보기" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {myEditions.map((ed: any) => (
                                            <SelectItem key={ed.record_id} value={ed.record_id.toString()}>
                                                <span className={`truncate block max-w-[120px] ${ed.is_current ? "font-bold text-[#0066cc]" : ""}`}>
                                                    {ed.publisher} {ed.publish_date ? `(${ed.publish_date.substring(0,4)})` : ''}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* 저자 및 출판 정보를 한 줄로 압축 */}
                        <div className="text-[16px] text-gray-800 font-medium mb-3 flex items-center flex-wrap gap-2">
                            <span className="font-bold">{formatAuthor(work.author)}</span>
                            <span className="text-gray-300 mx-1">|</span>
                            <span>{edition.publisher}</span>
                            {pubYear && <span className="text-gray-500">({pubYear})</span>}
                        </div>

                        {/* Group B: 도서 상세 제원 (Book Specifications) - 인라인 텍스트로 압축 */}
                        <div className="text-[13px] text-gray-500 font-medium flex items-center flex-wrap gap-2 mb-6">
                            <span>{edition.page_count ? `${edition.page_count}쪽` : '쪽수 미상'}</span>
                            <span className="text-gray-300">·</span>
                            <span>{edition.binding_type || edition.size_mm || '형태 미상'}</span>
                            <span className="text-gray-300">·</span>
                            <span className="font-mono">ISBN {edition.isbn}</span>
                            {edition.first_discoverer && (
                                <>
                                    <span className="text-gray-300">·</span>
                                    <span className="text-[#0066cc] bg-blue-50 px-2 py-0.5 rounded-md font-bold">
                                        최초 등록: {edition.first_discoverer}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Group C: 도서 소개 (Description) - 높이 방어 */}
                        <div className="mb-auto relative group">
                            <p className="text-[14px] text-gray-600 leading-relaxed font-medium line-clamp-3 break-keep">
                                {displayDesc}
                            </p>
                            {/* 텍스트가 길 경우 호버 시 전체 내용 표시 */}
                            {displayDesc.length > 150 && (
                                <div className="absolute left-0 top-full mt-2 w-full max-w-[600px] p-5 bg-[#1d1d1f] text-white text-[14px] leading-relaxed rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 shadow-2xl whitespace-pre-wrap">
                                    {displayDesc}
                                </div>
                            )}
                        </div>

                        {/* Group D: 사용자 개인화 액션 (My BoooknTalk Actions) - 얇은 컨트롤 바 형태 */}
                        <div className="mt-8 bg-[#f5f5f7]/80 rounded-2xl p-4 border border-gray-100 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                {/* 상태 뱃지 */}
                                <div className={`px-3 py-1.5 rounded-lg text-[13px] font-extrabold tracking-wide ${
                                    record.status === 'READING' ? 'bg-[#0066cc] text-white' :
                                    record.status === 'COMPLETED' ? 'bg-[#1d1d1f] text-white' :
                                    'bg-white text-gray-600 border border-gray-200'
                                }`}>
                                    {record.status === 'READING' ? '읽는 중' : record.status === 'COMPLETED' ? '완독' : '읽고 싶음'}
                                </div>
                                
                                {/* 매체 뱃지 */}
                                {record.reading_format && (
                                    <span className="text-[12px] font-bold text-gray-500 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200">
                                        {record.reading_format === 'PAPER' ? '종이책' : record.reading_format === 'EBOOK' ? '전자책' : '오디오북'}
                                    </span>
                                )}

                                {/* 태그 인라인 표시 */}
                                {record.tags && record.tags.length > 0 && (
                                    <div className="hidden md:flex gap-1.5 border-l border-gray-300 pl-3 ml-1">
                                        {record.tags.slice(0, 2).map((tag: string, idx: number) => (
                                            <span key={idx} className="text-[12px] font-bold text-[#0066cc] bg-blue-50/50 px-2 py-1 rounded-md">
                                                #{tag}
                                            </span>
                                        ))}
                                        {record.tags.length > 2 && <span className="text-[12px] text-gray-400 font-bold self-center">+{record.tags.length - 2}</span>}
                                    </div>
                                )}
                            </div>

                            {/* 우측: 평점 및 진행률 */}
                            <div className="flex items-center gap-5 ml-auto">
                                {record.status === 'READING' && (
                                    <div className="flex items-center gap-2 w-[120px]">
                                        <span className="text-[11px] font-bold text-gray-400">진행률</span>
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-[#0066cc] transition-all duration-500" 
                                                style={{ width: `${Math.min(((record.current_page || 0) / (edition.page_count || 1)) * 100, 100)}%` }} 
                                            />
                                        </div>
                                        <span className="text-[11px] font-bold text-[#0066cc]">
                                            {Math.round(((record.current_page || 0) / (edition.page_count || 1)) * 100)}%
                                        </span>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                                    <span className="text-[12px] font-bold text-gray-500">나의 평점</span>
                                    {renderStars(record.rating || 0)}
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </section>
    );
}