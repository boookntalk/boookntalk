// 파일 경로: src/components/book/BookTopInfo.tsx
// 역할 및 기능: 도서 상세 화면의 최상단 영역을 구성하며, 1cm 간격 규격(--spacing-1cm)을 준수하여 도서 표지, 이중 레이어 장르/태그, 메타 정보 및 사용자의 독서 기록(진행률, 별점 등)을 렌더링합니다.

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, BookType, ExternalLink, Edit3, Trash2, Hash, Layers } from 'lucide-react';
import { FloatingCover } from '@/components/common/FloatingCover';

interface BookTopInfoProps {
    record: any;
    edition: any;
    work: any;
    myEditions?: any[];
    onRecordChange?: (recordId: string) => void;
}

const getSafeDateString = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}.`;
};

// 함수 기능: 전달받은 도서(work, edition) 및 독서 기록(record) 데이터를 기반으로 화면 상단의 주요 정보 UI를 구성합니다. KDC/DDC 기반의 계층형 카테고리와 AI 마이크로 태그를 제목 상단에 이중 레이어로 노출합니다.
export default function BookTopInfo({ record, edition, work, myEditions = [], onRecordChange }: BookTopInfoProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    let pubYear = '';
    if (edition?.pubDate) {
        try {
            const d = new Date(edition.pubDate);
            if (!isNaN(d.getTime())) pubYear = d.getFullYear().toString();
        } catch (e) {}
    }

    const getHighResCover = (url: string) => url ? url.replace(/\?type=m\d/g, '?type=w1200') : '';
    const formatAuthor = (authorStr: string) => authorStr ? authorStr.replace(/;/g, ' • ').replace(/\|/g, ' • ').trim() : "저자 미상";
    
    // 네이버 도서 검색 외부 링크
    const externalLink = `https://search.shopping.naver.com/book/search?query=${edition?.isbn}`;
    const displayDesc = (edition?.description || work?.description || "").trim() || "상세 설명이 없습니다.";

    const currentPage = record?.current_page || 0;
    const totalPage = edition?.page_count || 1;
    const progressPercent = Math.min(Math.round((currentPage / totalPage) * 100), 100);
    const currentStatus = (record?.status || '').toLowerCase();
    
    // ▼▼▼ 카테고리 계층 및 마이크로 태그 데이터 전처리 ▼▼▼
    // 임시로 '/' 기준으로 배열화 (추후 백엔드에서 배열로 넘겨주면 바로 대체 가능)
    const categoryHierarchy = work?.category ? work.category.split('/').map((c: string) => c.trim()) : ['문학', '영미문학', '소설'];
    // AI가 추출한 책 고유의 마이크로 태그 (백엔드 연동 전 임시 데이터)
    const displayTags = work?.tags || record?.tags || ['법정스릴러', '로맨스', '범죄'];

    const statusIndex = currentStatus === 'finished' ? 2 : currentStatus === 'reading' ? 1 : 0;

    return (
        <section className="bg-white border-b border-gray-100 relative">
            <div className="max-w-[1200px] mx-auto px-8 pt-4 pb-10">
                <div className="flex flex-col md:flex-row gap-[var(--spacing-1cm,40px)] items-stretch">
                    {/* [1. 좌측 영역]: 도서 표지 */}
                    <div className="flex-shrink-0 mx-auto md:mx-0 w-[200px] md:w-[220px] flex flex-col gap-4">
                        <FloatingCover 
                            src={edition?.cover_image || edition?.cover || work?.cover_image ? getHighResCover(edition.cover_image || edition.cover || work.cover_image) : null}
                            alt={work?.title || 'Cover'}
                            className="w-full aspect-[1/1.45]"
                            iconSize={48}
                        />
                        
                        {/* 외부 링크 버튼 */}
                        <div className="flex w-full mt-auto">
                            <Button 
                                variant="outline" 
                                onClick={() => window.open(externalLink, '_blank')} 
                                className="w-full h-10 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#03C75A] transition-colors text-[13px] font-bold shadow-sm flex items-center justify-center gap-2"
                            >
                                <ExternalLink size={15} className="opacity-70" />
                                네이버 도서 정보
                            </Button>
                        </div>
                    </div>

                    {/* [2. 우측 영역]: 메타 정보 및 대시보드 */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* 도서명 및 에디션 선택기 */}
                        <div className="flex justify-between items-start mb-2 gap-4">
                            <h1 className="text-[28px] md:text-[32px] font-extrabold text-[#1d1d1f] leading-tight tracking-tight break-keep">
                                {work?.title}
                            </h1>
                            {isMounted && myEditions.length > 0 && (
                                <div className="flex items-center bg-gray-50 rounded-lg pr-1 shadow-sm border border-gray-100 flex-shrink-0 mt-1">
                                    <div className="pl-3 pr-2 py-1.5 flex items-center gap-1.5 border-r border-gray-200/60">
                                        <Layers size={14} className="text-gray-400" />
                                        <span className="text-[12px] font-bold text-gray-500 hidden sm:inline-block">판본(에디션)</span>
                                    </div>
                                    <Select onValueChange={onRecordChange} defaultValue={record?.id?.toString()}>
                                        <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0 text-[13px] font-bold text-[#0066cc] w-auto min-w-[120px]">
                                            <SelectValue placeholder="판본 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {myEditions.map((ed: any) => (
                                                <SelectItem key={ed.record_id} value={ed.record_id.toString()}>
                                                    {ed.publisher} {ed.publish_date ? `(${ed.publish_date.substring(0,4)})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* 저자 및 출판사 */}
                        <div className="text-[15px] text-gray-700 font-bold mb-3 flex items-center flex-wrap gap-2">
                            <span>{formatAuthor(work?.author)}</span>
                            <span className="text-gray-300 mx-1">|</span>
                            <span>{edition?.publisher}</span>
                            {pubYear && <span className="text-gray-500 font-medium">({pubYear})</span>}
                        </div>

                        {/* 도서 스펙, 태그, 별점 */}
                        <div className="flex flex-wrap items-center justify-between mb-5 gap-y-3">
                            {/* 좌측: 스펙 및 장르 뼈대 & 태그 (모두 하나의 flex 컨테이너로 묶어서 한 줄 배치 강제) */}
                            <div className="flex items-center flex-wrap gap-2.5">
                                {/* 1. 쪽수 및 ISBN */}
                                <div className="text-[13px] text-gray-500 font-medium flex items-center gap-1.5">
                                    <span>{edition?.page_count ? `${edition.page_count}쪽` : '쪽수 미상'}</span>
                                    <span className="text-gray-300">·</span>
                                    <span className="font-mono">ISBN {edition?.isbn}</span>
                                </div>
                                
                                {/* 2. 카테고리 뼈대 (구분선 + 계층) */}
                                {categoryHierarchy && categoryHierarchy.length > 0 && (
                                    <>
                                        <span className="text-gray-300">|</span>
                                        <div className="flex items-center text-[13px] font-bold text-gray-500 tracking-tight">
                                            {categoryHierarchy.map((cat: string, idx: number) => (
                                                <React.Fragment key={idx}>
                                                    <span className={`cursor-pointer transition-colors ${idx === categoryHierarchy.length - 1 ? 'text-gray-800' : 'hover:text-gray-800'}`}>
                                                        {cat}
                                                    </span>
                                                    {idx < categoryHierarchy.length - 1 && <span className="mx-1.5 text-gray-300">›</span>}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* 3. AI 마이크로 태그 (구분선 + 태그) */}
                                {displayTags && displayTags.length > 0 && (
                                    <>
                                        <span className="text-gray-300">|</span>
                                        <div className="flex items-center gap-1.5">
                                            {displayTags.map((tag: string, idx: number) => (
                                                <span key={idx} className="px-2 py-0.5 bg-blue-50 text-[#0066cc] text-[11px] font-black rounded-md flex items-center shadow-sm">
                                                    <Hash size={10} className="mr-0.5 opacity-70" /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* 우측: 별점 대시보드 */}
                            <div className="flex items-center gap-4 bg-gray-50/50 px-3 py-1.5 rounded-xl border border-gray-100 shrink-0">
                                <div className="flex items-center gap-1.5 pr-3 border-r border-gray-200">
                                    <span className="text-[11px] font-bold text-gray-500">BoooknTalk 평균</span>
                                    <span className="text-[13px] font-black text-[#1d1d1f] flex items-center gap-0.5">
                                        <Star size={12} className="text-[#FFCC00]" fill="currentColor" />
                                        {work?.average_rating || "0.0"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-bold text-gray-500">나의 별점</span>
                                    {currentStatus !== 'wish' ? (
                                        <div className="flex text-[#FFCC00]">
                                            {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={13} fill={s <= (record?.rating || 0) ? "currentColor" : "none"} className={s <= (record?.rating || 0) ? "text-[#FFCC00]" : "text-gray-200"} />)}
                                        </div>
                                    ) : (
                                        <span className="text-[11px] font-medium text-gray-400">평가 전</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 상세 설명 */}
                        {/* 0. 부모 div에 relative를 줘서 툴팁이 이 안에서만 돌게 만듭니다. */}
                        <div className="relative group mb-6">
                            {/* 기존 2줄 줄임 처리된 텍스트 */}
                            <p className="text-[14px] text-gray-600 leading-relaxed font-medium line-clamp-2 break-keep cursor-pointer">
                                {displayDesc}
                            </p>
                            
                            {/* ▼▼▼ [NEW] 마우스 오버 시 나타나는 전체 설명 툴팁 (클린 테마) ▼▼▼ */}
                            {displayDesc && displayDesc !== "상세 설명이 없습니다." && (
                                <div className="absolute z-50 left-0 top-full mt-2 w-full max-w-[500px] p-6 bg-white text-[#1d1d1f] text-[13px] font-medium leading-relaxed rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none break-keep">
                                    {displayDesc}
                                </div>
                            )}
                        </div>

                        {/* 나의 독서 기록 박스 */}
                        <div className="mt-auto bg-white rounded-[20px] p-6 border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-baseline gap-2">
                                    <h3 className="font-bold text-[16px] text-[#1d1d1f]">나의 독서 기록</h3>
                                    <span className="text-[13px] font-medium text-gray-400">
                                        {currentStatus === 'wish' ? '' : (
                                            `(${record?.start_date ? getSafeDateString(record.start_date) : '미정'} ~ ${record?.finish_date ? getSafeDateString(record.finish_date) : (currentStatus === 'reading' ? '현재' : '')})`
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button className="p-1.5 text-gray-400 hover:text-[#0066cc] hover:bg-blue-50 rounded-md transition-colors" title="기록 수정"><Edit3 size={15} /></button>
                                    <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="기록 삭제"><Trash2 size={15} /></button>
                                </div>
                            </div>

                            <div>
                                {currentStatus === 'reading' && (
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-[28px] font-extrabold text-[#0066cc] leading-none">{progressPercent}%</span>
                                        <span className="text-[13px] text-gray-500 font-bold">{currentPage} / {totalPage} 페이지</span>
                                    </div>
                                )}
                                <div className="relative h-2 bg-gray-100 rounded-full flex items-center mt-3 mb-2">
                                    <div className="absolute left-0 h-full bg-[#0066cc] rounded-full transition-all duration-700" style={{ width: currentStatus === 'wish' ? '0%' : currentStatus === 'finished' ? '100%' : `${progressPercent}%` }}></div>
                                    <div className={`absolute left-0 w-3.5 h-3.5 rounded-full border-[3px] bg-white -ml-0.5 ${statusIndex >= 0 ? 'border-[#0066cc]' : 'border-gray-200'}`}></div>
                                    <div className={`absolute left-1/2 w-3.5 h-3.5 rounded-full border-[3px] bg-white -translate-x-1/2 ${statusIndex >= 1 ? 'border-[#0066cc]' : 'border-gray-200'}`}></div>
                                    <div className={`absolute right-0 w-3.5 h-3.5 rounded-full border-[3px] bg-white -mr-0.5 ${statusIndex === 2 ? 'border-[#0066cc]' : 'border-gray-200'}`}></div>
                                </div>
                                <div className="flex justify-between text-[11px] font-bold text-gray-400 relative">
                                    <span className={`absolute left-0 -ml-1 ${statusIndex >= 0 ? 'text-[#0066cc]' : ''}`}>읽고 싶음</span>
                                    <span className={`absolute left-1/2 -translate-x-1/2 ${statusIndex >= 1 ? 'text-[#0066cc]' : ''}`}>읽는 중</span>
                                    <span className={`absolute right-0 -mr-1 ${statusIndex === 2 ? 'text-[#0066cc]' : ''}`}>완독</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}