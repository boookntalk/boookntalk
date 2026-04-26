// 파일 경로: src/components/book-detail/BookTopInfo.tsx
// 역할 및 기능: 부모 영역의 하얀 도화지에 녹아들도록 디자인된 도서 상세 상단 정보 컴포넌트.
// 업데이트: 1줄 정렬 UI 유지 및 판본(출판사) 스위칭 메뉴 노출 조건 완벽 조율(2개 이상일 때만 노출), 작가 정보 영역 레이아웃 최적화 및 5줄 노출 처리.

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, ExternalLink, Layers, ArrowRight, Edit3, Trash2, User, Edit2 } from 'lucide-react';
import { FloatingCover } from '@/components/common/FloatingCover';
import { useRouter } from 'next/navigation';
import { AuthorAvatar } from '@/components/common/AuthorAvatar';
import { SmartTruncatedText } from '@/components/common/SmartTruncatedText';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    currentUser?: any; 
}

const getSafeDateString = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}.`;
};

// 함수 기능: 도서 상단 히어로 영역 렌더링. 판본 스위칭, 쪽수 미상 툴팁, 1줄 메타 데이터 등 포함.
export default function BookTopInfo({ 
    record, edition, work, myEditions = [], onRecordChange,
    authorInfo, authorOtherBooks = [], currentUser
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

    const rawStatus = (record?.status || '').toLowerCase();
    const currentPage = record?.current_page || 0;
    const dbTotalPage = edition?.page_count || 0; 

    let statusIndex = 0; 
    
    if (['reading', 'currently_reading'].includes(rawStatus) || (currentPage > 0 && currentPage < (dbTotalPage || Infinity))) {
        statusIndex = 1;
    }
    if (['finished', 'read', 'completed', 'done'].includes(rawStatus) || (dbTotalPage > 0 && currentPage >= dbTotalPage)) {
        statusIndex = 2;
    }

    let progressPercent = 0;
    if (statusIndex === 2) {
        progressPercent = 100; 
    } else if (dbTotalPage > 0) {
        progressPercent = Math.min(Math.round((currentPage / dbTotalPage) * 100), 100);
    }

    const currentStatus = statusIndex === 0 ? 'wish' : statusIndex === 1 ? 'reading' : 'finished';
    const barWidth = statusIndex === 2 ? '100%' : statusIndex === 0 ? '0%' : `${progressPercent}%`;

    const firstDiscoverer = edition?.first_discoverer || "익명의 여행자";
    const isAdmin = currentUser?.email?.startsWith('boookntalk');
    const currentNickname = currentUser?.nickname || currentUser?.email?.split('@')[0];
    const isCreator = currentNickname === firstDiscoverer;
    
    const canEditBookInfo = isAdmin || isCreator;

    const handleEditPageCount = () => {
        const newPageStr = window.prompt("책의 정확한 전체 쪽수를 입력해 주세요:");
        if (newPageStr !== null) {
            const newPageNum = parseInt(newPageStr, 10);
            if (isNaN(newPageNum) || newPageNum <= 0) {
                alert("올바른 숫자를 입력해 주세요.");
                return;
            }
            alert(`쪽수가 ${newPageNum}쪽으로 업데이트 되었습니다! (API 연동 대기중)`);
        }
    };

    return (
        <section className="bg-transparent w-full relative z-[100]">
            <div className="max-w-[1200px] mx-auto px-[var(--spacing-1cm,32px)] pt-4 pb-8">
                <div className="flex flex-col md:flex-row gap-[var(--spacing-1cm,32px)] items-stretch">
                    
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

                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex flex-col lg:flex-row gap-8 w-full">
                            
                            <div className="w-full lg:w-2/3 flex flex-col min-w-0 lg:border-r lg:border-gray-100 lg:pr-8">
                                <div className="flex justify-between items-start mb-2 gap-4">
                                    <h1 className="text-[28px] md:text-[32px] font-extrabold text-[#1d1d1f] leading-tight tracking-tight break-keep">
                                        {work?.title}
                                    </h1>
                                    {isMounted && myEditions.length > 1 && (
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

                                {/* 작가, 출판사 & 최초도서등록 우측 정렬 */}
                                <div className="flex justify-between items-center mb-3 gap-4">
                                    <div className="text-[15px] text-gray-700 font-bold flex items-center flex-wrap gap-2 flex-1 min-w-0">
                                        <span className="truncate">{formatAuthor(work?.author)}</span>
                                        <span className="text-gray-300 shrink-0">|</span>
                                        <span className="truncate">{edition?.publisher}</span>
                                        {pubYear && <span className="text-gray-500 font-medium shrink-0">({pubYear})</span>}
                                    </div>
                                    <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold text-gray-500 shrink-0">
                                        <User size={12} className="text-gray-400" />
                                        <span>최초도서등록 : <span className="text-gray-700">{firstDiscoverer}</span></span>
                                    </div>
                                </div>

                                {/* [완벽 1줄 강제] 언어, 쪽수(툴팁), ISBN, 평균별점, 나의별점 */}
                                <div className="flex items-center gap-2.5 mb-6 text-[13px] text-gray-500 font-medium overflow-x-auto scrollbar-hide whitespace-nowrap w-full">
                                    {edition?.language && (
                                        <><span className="text-[#1d1d1f] font-bold">{edition.language}</span><span className="text-gray-300">·</span></>
                                    )}
                                    
                                    {dbTotalPage > 0 ? (
                                        <span className="text-[#1d1d1f] font-bold">{dbTotalPage}쪽</span>
                                    ) : canEditBookInfo ? (
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button 
                                                        onClick={handleEditPageCount}
                                                        className="text-[#0066cc] font-bold border-b border-dashed border-[#0066cc] pb-[1px] hover:text-blue-700 hover:border-blue-700 transition-colors cursor-pointer flex items-center gap-1"
                                                    >
                                                        <Edit2 size={10} /> 쪽수 미상
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="bg-[#1d1d1f] text-white text-[12px] font-bold px-3 py-2 rounded-lg border-none shadow-md z-[100]">
                                                    쪽수를 입력할 수 있는 메뉴입니다.
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        <span>쪽수 미상</span>
                                    )}
                                    <span className="text-gray-300">·</span>

                                    <span className="font-mono">ISBN {edition?.isbn}</span>
                                    <span className="text-gray-300">·</span>

                                    <span className="flex items-center gap-1">
                                        평균 별점<Star size={12} className="text-[#FFCC00] mb-[2px]" fill="currentColor" />
                                        <span className="text-[#1d1d1f] font-black">{work?.average_rating || "0.0"}</span>
                                    </span>
                                    <span className="text-gray-300">·</span>

                                    <span className="flex items-center gap-1.5">나의 별점
                                        {currentStatus !== 'wish' ? (
                                            <div className="flex text-[#FFCC00] mb-[2px]">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star key={s} size={13} fill={s <= (record?.rating || 0) ? "currentColor" : "none"} className={s <= (record?.rating || 0) ? "text-[#FFCC00]" : "text-gray-200"} />
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">평가 전</span>
                                        )}
                                    </span>
                                </div>

                                <div className="mb-6 w-full">
                                    <SmartTruncatedText 
                                        content={displayDesc}
                                        // 💡 4줄(line-clamp-4)에서 5줄(line-clamp-5)로 변경하고, w-full을 추가하여 가로폭 축소를 방지합니다.
                                        textClassName="text-[14px] text-gray-600 leading-relaxed font-medium break-keep line-clamp-5 w-full"
                                    />
                                </div>

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
                                                <span className="text-[28px] font-extrabold text-[#0066cc] leading-none">
                                                    {dbTotalPage > 0 ? `${progressPercent}%` : '읽는 중'}
                                                </span>
                                                <span className="text-[13px] text-gray-500 font-bold">
                                                    {dbTotalPage > 0 ? `${currentPage} / ${dbTotalPage} 페이지` : `현재 ${currentPage}쪽`}
                                                </span>
                                            </div>
                                        )}
                                        <div className="relative h-2 bg-gray-200 rounded-full flex items-center mt-3 mb-2">
                                            <div className="absolute left-0 h-full bg-[#0066cc] rounded-full transition-all duration-700" style={{ width: barWidth }}></div>
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

                            {/* 우측 1/3: 작가 상세 영역 */}
                            <div className="w-full lg:w-1/3 flex flex-col min-w-0 z-10 shrink-0">
                                {authorInfo && (
                                    <div className="w-full flex flex-col min-w-0 h-[320px]">
                                        <div className="flex flex-col h-full gap-6">
                                            
                                            <div className="flex flex-col min-w-0">
                                                <h2 className="text-[12px] font-black tracking-widest text-gray-400 uppercase mb-4">Author</h2>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <AuthorAvatar 
                                                        authorId={Number(authorInfo.id)} 
                                                        src={authorInfo.photo} 
                                                        alt={authorInfo.name} 
                                                        size={48} 
                                                        fallbackType="user" 
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-[16px] font-extrabold text-[#1d1d1f] truncate">{authorInfo.name}</h3>
                                                        {authorInfo.role && <p className="text-[11px] font-bold text-[#0066cc] mt-0.5 truncate">{authorInfo.role}</p>}
                                                    </div>
                                                </div>
                                                
                                                <div className="mb-4 w-full">
                                                    <SmartTruncatedText 
                                                        content={authorInfo.bio || "등록된 저자 소개가 없습니다."}
                                                        textClassName="text-[14px] leading-relaxed text-gray-600 font-medium break-keep line-clamp-5 w-full"
                                                    />
                                                </div>
                                            </div>

                                            {authorOtherBooks.length > 0 && (
                                                <div className="pt-6 border-t border-gray-100 mt-auto shrink-0">
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