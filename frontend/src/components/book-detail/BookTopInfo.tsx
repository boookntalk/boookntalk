// frontend/src/components/book-detail/BookTopInfo.tsx

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
import { Star, Calendar } from 'lucide-react';

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

                            <h1 className="text-3xl md:text-4xl font-bold text-[#1d1d1f] leading-snug mb-3 tracking-tight break-keep">
                                {work.title}
                            </h1>
                            <p className="text-lg text-gray-700 font-medium mb-6">
                                {work.author} <span className="text-gray-400 text-sm font-normal">지음</span>
                                <span className="mx-2 text-gray-300">|</span>
                                {edition.publisher} <span className="text-gray-400 text-base font-normal">펴냄</span>
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 text-sm text-gray-600 mb-6 border-t border-b border-gray-100 py-4">
                                <div><span className="text-gray-400 mr-2">발행일</span> {pubDate}</div>
                                <div><span className="text-gray-400 mr-2">쪽수</span> {edition.page_count}p</div>
                                <div><span className="text-gray-400 mr-2">판형</span> 양장본</div>
                                <div><span className="text-gray-400 mr-2">ISBN</span> {edition.isbn}</div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-bold text-[#1d1d1f] mb-2 text-sm">책 소개</h3>
                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 md:line-clamp-4">
                                    {edition.description || "상세 설명이 없습니다."}
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                                <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                                    record.status === 'READING' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                    record.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' :
                                    'bg-gray-100 text-gray-600 border-gray-200'
                                }`}>
                                    {record.status === 'READING' ? '읽는 중' : record.status === 'COMPLETED' ? '완독함' : '읽고 싶음'}
                                </div>
                                
                                {record.start_date && (
                                    <div className="text-sm text-gray-500 flex items-center gap-1.5">
                                        <Calendar size={14} />
                                        <span>{record.start_date.split('T')[0]} 시작</span>
                                    </div>
                                )}
                            </div>

                            <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                                <span className="text-sm font-bold text-gray-500">나의 별점</span>
                                {renderStars(record.rating || 0)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}