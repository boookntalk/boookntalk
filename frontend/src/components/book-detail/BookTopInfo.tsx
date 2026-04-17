// 파일 경로: src/components/book/BookTopInfo.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, ExternalLink, Layers, ArrowRight, Edit3, Trash2 } from 'lucide-react';
import { FloatingCover } from '@/components/common/FloatingCover';
import { useRouter } from 'next/navigation';
import { AuthorAvatar } from '@/components/common/AuthorAvatar';
import { SmartTruncatedText } from '@/components/common/SmartTruncatedText';

interface BookTopInfoProps {
    record: any;
    edition: any;
    work: any;
    myEditions?: any[];
    onRecordChange?: (recordId: string) => void;
    authorInfo?: {
        id: string;
        name: string;
        role?: string;
        photo?: string;
        bio?: string;
    };
    authorOtherBooks?: Array<{
        id: string;
        title: string;
        cover: string;
    }>;
}

const getSafeDateString = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}.`;
};

export default function BookTopInfo({ 
    record, edition, work, myEditions = [], onRecordChange,
    authorInfo, authorOtherBooks = []
}: BookTopInfoProps) {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => { setIsMounted(true); }, []);

    let pubYear = '';
    if (edition?.pub_date || edition?.pubDate) {
        try {
            const d = new Date(edition.pub_date || edition.pubDate);
            if (!isNaN(d.getTime())) pubYear = d.getFullYear().toString();
        } catch (e) {}
    }

    const getHighResCover = (url: string) => url ? url.replace(/\?type=m\d/g, '?type=w1200') : '';
    const formatAuthor = (authorStr: string) => authorStr ? authorStr.replace(/;/g, ' • ').replace(/\|/g, ' • ').trim() : "저자 미상";
    
    const externalLink = `https://search.shopping.naver.com/book/search?query=${edition?.isbn}`;
    const displayDesc = (edition?.description || work?.description || "").trim() || "상세 설명이 없습니다.";

    // =========================================================================
    // 💡 [핵심 수정] 독서 상태 마커(O) 활성화 로직 강화
    // 백엔드의 다양한 상태값(read, completed 등)과 % 진행률을 모두 조합하여 
    // 현재 도달한 단계를 정확하게 계산해 냅니다.
    // =========================================================================
    const currentPage = record?.current_page || 0;
    const totalPage = edition?.page_count || 1;
    const progressPercent = Math.min(Math.round((currentPage / totalPage) * 100), 100);
    
    const rawStatus = (record?.status || '').toLowerCase();
    let statusIndex = 0; // 0: 읽고 싶음 (기본)
    
    if (['reading', 'currently_reading'].includes(rawStatus) || (progressPercent > 0 && progressPercent < 100)) {
        statusIndex = 1; // 1: 읽는 중 단계 도달
    }
    if (['finished', 'read', 'completed', 'done'].includes(rawStatus) || progressPercent >= 100) {
        statusIndex = 2; // 2: 완독 단계 도달
    }

    const currentStatus = statusIndex === 0 ? 'wish' : statusIndex === 1 ? 'reading' : 'finished';
    const barWidth = statusIndex === 2 ? '100%' : statusIndex === 0 ? '0%' : `${progressPercent}%`;
    // =========================================================================

    return (
        <section className="bg-transparent w-full relative z-[100]">
            <div className="max-w-[1200px] mx-auto px-[var(--spacing-1cm,32px)] pt-4 pb-8">
                <div className="flex flex-col md:flex-row gap-[var(--spacing-1cm,32px)] items-stretch">
                    
                    {/* [좌측 영역]: 도서 표지 */}
                    <div className="flex-shrink-0 mx-auto md:mx-0 w-[200px] md:w-[220px] flex flex-col gap-4">
                        <FloatingCover 
                            src={edition?.cover_image || edition?.cover || work?.cover_image ? getHighResCover(edition.cover_image || edition.cover || work.cover_image) : null}
                            alt={work?.title || 'Cover'}
                            className="w-full aspect-[1/1.45]"
                            iconSize={48}
                        />
                        <div className="flex w-full mt-auto">
                            <Button variant="outline" onClick={() => window.open(externalLink, '_blank')} className="w-full h-10 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#03C75A] transition-colors text-[13px] font-bold shadow-sm flex items-center justify-center gap-2">
                                <ExternalLink size={15} className="opacity-70" /> 네이버 도서 정보
                            </Button>
                        </div>
                    </div>

                    {/* [우측 영역]: 2/3 (도서) 와 1/3 (작가) 분할 */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex flex-col lg:flex-row gap-8 w-full">
                            
                            {/* [우측-1] 도서 상세 정보 */}
                            <div className="w-full lg:w-2/3 flex flex-col min-w-0 lg:border-r lg:border-gray-100 lg:pr-8">
                                <div className="flex justify-between items-start mb-2 gap-4">
                                    <h1 className="text-[28px] md:text-[32px] font-extrabold text-[#1d1d1f] leading-tight tracking-tight break-keep">
                                        {work?.title}
                                    </h1>
                                    {isMounted && myEditions.length > 0 && (
                                        <div className="flex items-center bg-gray-50 rounded-lg pr-1 shadow-sm border border-gray-100 flex-shrink-0 mt-1">
                                            <div className="pl-3 pr-2 py-1.5 flex items-center gap-1.5 border-r border-gray-200/60">
                                                <Layers size={14} className="text-gray-400" />
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

                                <div className="text-[15px] text-gray-700 font-bold mb-3 flex items-center flex-wrap gap-2">
                                    <span>{formatAuthor(work?.author)}</span>
                                    <span className="text-gray-300 mx-1">|</span>
                                    <span>{edition?.publisher}</span>
                                    {pubYear && <span className="text-gray-500 font-medium">({pubYear})</span>}
                                </div>

                                <div className="flex flex-wrap items-center justify-between mb-5 gap-y-3">
                                    <div className="flex items-center flex-wrap gap-2.5">
                                        <div className="text-[13px] text-gray-500 font-medium flex items-center gap-1.5 flex-wrap">
                                            {edition?.format && <><span className="text-[#1d1d1f] font-bold">{edition.format}</span><span className="text-gray-300">·</span></>}
                                            {edition?.language && <><span className="text-[#1d1d1f] font-bold">{edition.language}</span><span className="text-gray-300">·</span></>}
                                            <span>{edition?.page_count ? `${edition.page_count}쪽` : '쪽수 미상'}</span>
                                            <span className="text-gray-300">·</span>
                                            <span className="font-mono">ISBN {edition?.isbn}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-gray-50/50 px-3 py-1.5 rounded-xl border border-gray-100 shrink-0">
                                        <div className="flex items-center gap-1.5 pr-3 border-r border-gray-200">
                                            <span className="text-[11px] font-bold text-gray-500">BoooknTalk 평균</span>
                                            <span className="text-[13px] font-black text-[#1d1d1f] flex items-center gap-0.5"><Star size={12} className="text-[#FFCC00]" fill="currentColor" /> {work?.average_rating || "0.0"}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-bold text-gray-500">나의 별점</span>
                                            {currentStatus !== 'wish' ? (
                                                <div className="flex text-[#FFCC00]">{[1, 2, 3, 4, 5].map((s) => <Star key={s} size={13} fill={s <= (record?.rating || 0) ? "currentColor" : "none"} className={s <= (record?.rating || 0) ? "text-[#FFCC00]" : "text-gray-200"} />)}</div>
                                            ) : (
                                                <span className="text-[11px] font-medium text-gray-400">평가 전</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <SmartTruncatedText 
                                        content={displayDesc}
                                        textClassName="text-[14px] text-gray-600 leading-relaxed font-medium break-keep"
                                    />
                                </div>

                                {/* 나의 독서 기록 게이지 바 */}
                                <div className="mt-auto bg-[#F5F5F7] rounded-2xl p-5 border border-gray-200/60 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="font-bold text-[15px] text-[#1d1d1f]">나의 독서 기록</h3>
                                            <span className="text-[12px] font-medium text-gray-500">
                                                {currentStatus === 'wish' ? '' : `(${record?.start_date ? getSafeDateString(record.start_date) : '미정'} ~ ${record?.finish_date ? getSafeDateString(record.finish_date) : (currentStatus === 'reading' ? '현재' : '')})`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button className="p-1.5 text-gray-400 hover:text-[#0066cc] hover:bg-white rounded-md transition-colors" title="기록 수정"><Edit3 size={15} /></button>
                                            <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-md transition-colors" title="기록 삭제"><Trash2 size={15} /></button>
                                        </div>
                                    </div>
                                    <div>
                                        {statusIndex === 1 && (
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-[28px] font-extrabold text-[#0066cc] leading-none">{progressPercent}%</span>
                                                <span className="text-[13px] text-gray-500 font-bold">{currentPage} / {totalPage} 페이지</span>
                                            </div>
                                        )}
                                        <div className="relative h-2 bg-gray-200 rounded-full flex items-center mt-3 mb-2">
                                            {/* 파란색 게이지 라인 */}
                                            <div className="absolute left-0 h-full bg-[#0066cc] rounded-full transition-all duration-700" style={{ width: barWidth }}></div>
                                            
                                            {/* 💡 [적용] 단계 도달 시 테두리 점등 로직 */}
                                            <div className={`absolute left-0 w-3.5 h-3.5 rounded-full border-[3px] bg-white -ml-0.5 transition-colors duration-300 ${statusIndex >= 0 ? 'border-[#0066cc]' : 'border-gray-200'}`}></div>
                                            <div className={`absolute left-1/2 w-3.5 h-3.5 rounded-full border-[3px] bg-white -translate-x-1/2 transition-colors duration-300 ${statusIndex >= 1 ? 'border-[#0066cc]' : 'border-gray-200'}`}></div>
                                            <div className={`absolute right-0 w-3.5 h-3.5 rounded-full border-[3px] bg-white -mr-0.5 transition-colors duration-300 ${statusIndex >= 2 ? 'border-[#0066cc]' : 'border-gray-200'}`}></div>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-bold text-gray-400 relative">
                                            <span className={`absolute left-0 -ml-1 transition-colors duration-300 ${statusIndex >= 0 ? 'text-[#0066cc]' : ''}`}>읽고 싶음</span>
                                            <span className={`absolute left-1/2 -translate-x-1/2 transition-colors duration-300 ${statusIndex >= 1 ? 'text-[#0066cc]' : ''}`}>읽는 중</span>
                                            <span className={`absolute right-0 -mr-1 transition-colors duration-300 ${statusIndex >= 2 ? 'text-[#0066cc]' : ''}`}>완독</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* [우측-2] 작가 정보 영역 */}
                            <div className="w-full lg:w-1/3 flex flex-col min-w-0">
                                {authorInfo && (
                                    <div className="flex flex-col h-full gap-6">
                                        <div className="flex flex-col">
                                            <h2 className="text-[12px] font-black tracking-widest text-gray-400 uppercase mb-4">Author</h2>
                                            <div className="flex items-center gap-3 mb-4">
                                                <AuthorAvatar src={authorInfo.photo} alt={authorInfo.name} size={48} fallbackType="user" />
                                                <div>
                                                    <h3 className="text-[16px] font-extrabold text-[#1d1d1f]">{authorInfo.name}</h3>
                                                    {authorInfo.role && <p className="text-[11px] font-bold text-[#0066cc] mt-0.5">{authorInfo.role}</p>}
                                                </div>
                                            </div>
                                            
                                            <p className="text-[14px] leading-relaxed text-gray-600 font-medium break-keep line-clamp-4 mb-4">
                                                {authorInfo.bio || "등록된 저자 소개가 없습니다."}
                                            </p>
                                        </div>

                                        {authorOtherBooks.length > 0 && (
                                            <div className="pt-6 border-t border-gray-100 mt-auto">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-[12px] font-extrabold text-gray-500 uppercase tracking-wide">대표작</h3>
                                                    {authorOtherBooks.length > 1 && (
                                                        <button onClick={() => router.push(`/author/${authorInfo.id}`)} className="text-[11px] font-bold text-[#0066cc] flex items-center gap-1 hover:underline group">
                                                            더 보기 <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                                        </button>
                                                    )}
                                                </div>
                                                {authorOtherBooks.slice(0, 1).map((book) => (
                                                    <div key={book.id} onClick={() => router.push(`/works/${book.id}`)} className="flex items-center gap-3 cursor-pointer group rounded-xl hover:bg-gray-50 transition-all p-2 -ml-2 border border-transparent hover:border-gray-100">
                                                        <FloatingCover src={book.cover} className="w-[44px] shrink-0 aspect-[1/1.45]" iconSize={12} />
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                            <h4 className="text-[14px] font-bold text-[#1d1d1f] line-clamp-2 leading-tight group-hover:text-[#0066cc] transition-colors mb-1">{book.title}</h4>
                                                            <span className="text-[11px] font-bold text-gray-400">BoooknTalk 광장</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}