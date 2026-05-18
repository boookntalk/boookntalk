// 파일 경로: src/components/book-detail/BookTopInfo.tsx
// 역할 및 기능: 관리자 메뉴(수정 버튼) 노출 여부에 따라 도서 상세 설명과 작가 소개의 line-clamp(줄 수 제한)를 3줄 또는 4줄로 동적 변환하여 공간 활용도를 극대화했습니다.

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, ExternalLink, Layers, ArrowRight, Edit3, Trash2, User, Edit2, Loader2, ImagePlus } from 'lucide-react';
import { FloatingCover } from '@/components/common/FloatingCover';
import { useRouter } from 'next/navigation';
import { AuthorAvatar } from '@/components/common/AuthorAvatar';
import { SmartTruncatedText } from '@/components/common/SmartTruncatedText';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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

export default function BookTopInfo({ 
    record, edition, work, myEditions = [], onRecordChange,
    authorInfo, authorOtherBooks = [], currentUser
}: BookTopInfoProps) {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    const [currentBio, setCurrentBio] = useState(authorInfo?.bio || "");
    const [isBioModalOpen, setIsBioModalOpen] = useState(false);
    const [editingBio, setEditingBio] = useState("");
    const [isSavingBio, setIsSavingBio] = useState(false);

    const initialDesc = (edition?.description || work?.description || "").trim() || "상세 설명이 없습니다.";
    const [currentDesc, setCurrentDesc] = useState(initialDesc);
    const [isDescModalOpen, setIsDescModalOpen] = useState(false);
    const [editingDesc, setEditingDesc] = useState("");
    const [isSavingDesc, setIsSavingDesc] = useState(false);

    const [currentCover, setCurrentCover] = useState<string | null>(null);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getHighResCover = (url: string) => url ? url.replace(/\?type=m\d/g, '?type=w1200') : '';

    useEffect(() => { 
        setIsMounted(true); 
        setCurrentBio(authorInfo?.bio || "");
        setCurrentDesc((edition?.description || work?.description || "").trim() || "상세 설명이 없습니다.");
        
        const initialCover = edition?.cover_image || edition?.cover || work?.cover_image;
        setCurrentCover(initialCover ? getHighResCover(initialCover) : null);
    }, [authorInfo, edition, work]);

    let pubYear = '';
    if (edition?.pub_date || edition?.pubDate) {
        try {
            const d = new Date(edition.pub_date || edition.pubDate);
            if (!isNaN(d.getTime())) pubYear = d.getFullYear().toString();
        } catch (e) {}
    }

    const formatAuthor = (authorStr: string) => authorStr ? authorStr.replace(/;/g, ' • ').replace(/\|/g, ' • ').trim() : "저자 미상";
    const externalLink = `https://search.shopping.naver.com/book/search?query=${edition?.isbn}`;

    const rawStatus = (record?.status || '').toLowerCase();
    const currentPage = record?.current_page || 0;
    const dbTotalPage = edition?.page_count || work?.page_count || 0; 

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

    const bookLanguage = edition?.language || work?.language;
    const bookIsbn = edition?.isbn || work?.isbn;
    const bookTargetId = work?.id || edition?.id;

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

    const handleOpenBioModal = () => {
        setEditingBio(currentBio === "등록된 저자 소개가 없습니다." ? "" : currentBio);
        setIsBioModalOpen(true);
    };

    const handleSaveBio = async () => {
        if (!authorInfo?.id) return;
        setIsSavingBio(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/contributors/${authorInfo.id}/bio`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_email: currentUser?.email, bio: editingBio })
            });
            if (res.ok) {
                setCurrentBio(editingBio || "등록된 저자 소개가 없습니다."); 
                setIsBioModalOpen(false);  
            } else { alert("수정에 실패했습니다. 권한을 확인해 주세요."); }
        } catch (error) { alert("서버 통신 중 오류가 발생했습니다."); } finally { setIsSavingBio(false); }
    };

    const handleOpenDescModal = () => {
        setEditingDesc(currentDesc === "상세 설명이 없습니다." ? "" : currentDesc);
        setIsDescModalOpen(true);
    };

    const handleSaveDesc = async () => {
        if (!bookTargetId) return;
        setIsSavingDesc(true);
        try {
            const url = work?.id 
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/works/${work.id}/description`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/editions/${edition.id}/description`;
                
            const res = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_email: currentUser?.email, description: editingDesc })
            });
            if (res.ok) {
                setCurrentDesc(editingDesc || "상세 설명이 없습니다."); 
                setIsDescModalOpen(false);  
            } else { alert("수정에 실패했습니다. 권한을 확인해 주세요."); }
        } catch (error) { alert("서버 통신 중 오류가 발생했습니다."); } finally { setIsSavingDesc(false); }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !bookTargetId) return;

        setIsUploadingCover(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_email", currentUser?.email || "");

        try {
            const previewUrl = URL.createObjectURL(file);
            setCurrentCover(previewUrl);
            
            const url = work?.id 
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/works/${work.id}/cover`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/editions/${edition.id}/cover`;

            const res = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setCurrentCover(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${data.cover_url}`); 
            } else {
                alert("업로드에 실패했습니다. 권한을 확인해 주세요.");
                setCurrentCover(null); 
            }
        } catch (error) {
            alert("서버 통신 중 오류가 발생했습니다.");
            setCurrentCover(null); 
        } finally {
            setIsUploadingCover(false);
            if (fileInputRef.current) fileInputRef.current.value = ""; 
        }
    };

    return (
        <>
            <section className="bg-transparent w-full relative z-[100]">
                <div className="max-w-[1200px] mx-auto px-[var(--spacing-1cm,32px)] pt-4 pb-8">
                    
                    <div className="flex flex-col lg:flex-row gap-[var(--spacing-1cm,32px)] lg:h-[375px]">
                        
                        {/* ━━━━━━━━ 좌측 컬럼 ━━━━━━━━ */}
                        <div className="flex-shrink-0 mx-auto lg:mx-0 w-[200px] lg:w-[220px] flex flex-col h-full pb-8 lg:pb-0">
                            <div 
                                className={`relative w-full aspect-[1/1.45] rounded-lg overflow-hidden transition-all duration-300 ${!currentCover && isAdmin ? 'cursor-pointer ring-2 ring-transparent hover:ring-[#0066cc] group' : ''}`}
                                onClick={() => { if (!currentCover && isAdmin) fileInputRef.current?.click(); }}
                            >
                                <FloatingCover src={currentCover} alt={work?.title || edition?.title || 'Cover'} className={`w-full h-full ${isUploadingCover ? 'opacity-50' : ''}`} iconSize={48} />
                                {!currentCover && isAdmin && (
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <ImagePlus size={28} className="text-white mb-2" />
                                        <span className="text-[12px] font-bold text-white tracking-wider">커버 업로드</span>
                                    </div>
                                )}
                                {isUploadingCover && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="animate-spin text-[#0066cc]" size={32} />
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
                            <div className="w-full mt-auto shrink-0 pt-4">
                                <Button variant="outline" onClick={() => window.open(externalLink, '_blank')} className="w-full h-10 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#03C75A] transition-colors text-[13px] font-bold shadow-sm flex items-center justify-center gap-2">
                                    <ExternalLink size={15} className="opacity-70" /> 네이버 도서 정보
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col min-w-0 h-full">
                            <div className="flex flex-col lg:flex-row gap-8 w-full h-full">
                                
                                {/* ━━━━━━━━ 중앙 컬럼 ━━━━━━━━ */}
                                <div className="w-full lg:w-2/3 flex flex-col min-w-0 lg:border-r lg:border-gray-100 lg:pr-8 h-full pb-8 lg:pb-0">
                                    
                                    <div className="flex flex-col shrink-0">
                                        <div className="flex justify-between items-start mb-2 gap-4">
                                            <h1 className="text-[28px] md:text-[32px] font-extrabold text-[#1d1d1f] leading-tight tracking-tight break-keep">
                                                {work?.title || edition?.title}
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

                                        <div className="flex justify-between items-center gap-4 mb-3">
                                            <div className="text-[15px] text-gray-700 font-bold flex items-center flex-wrap gap-2 flex-1 min-w-0">
                                                <span className="truncate">{formatAuthor(work?.author || edition?.author)}</span>
                                                <span className="text-gray-300 shrink-0">|</span>
                                                <span className="truncate">{edition?.publisher || work?.publisher}</span>
                                                {pubYear && <span className="text-gray-500 font-medium shrink-0">({pubYear})</span>}
                                            </div>
                                            <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold text-gray-500 shrink-0">
                                                <User size={12} className="text-gray-400" />
                                                <span>최초도서등록 : <span className="text-gray-700">{firstDiscoverer}</span></span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 text-[13px] text-gray-500 font-medium overflow-x-auto scrollbar-hide whitespace-nowrap w-full mb-4">
                                            {bookLanguage && (
                                                <><span className="text-[#1d1d1f] font-bold">{bookLanguage}</span><span className="text-gray-300">·</span></>
                                            )}
                                            {dbTotalPage > 0 ? (
                                                <span className="text-[#1d1d1f] font-bold">{dbTotalPage}쪽</span>
                                            ) : canEditBookInfo ? (
                                                <button onClick={handleEditPageCount} className="text-[#0066cc] font-bold border-b border-dashed border-[#0066cc] pb-[1px] hover:text-blue-700 flex items-center gap-1"><Edit2 size={10} /> 쪽수 입력</button>
                                            ) : <span>쪽수 미상</span>}
                                            
                                            <span className="text-gray-300">·</span>
                                            <span className="font-mono">ISBN {bookIsbn || '정보 없음'}</span>
                                            
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
                                                ) : <span className="text-gray-400">평가 전</span>}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col min-h-0 mb-4">
                                        <div className="flex-1 overflow-hidden">
                                            {/* 💡 [조건부 렌더링] 관리자(수정 버튼 노출 대상)일 경우 3줄, 아니면 4줄로 표시합니다. */}
                                            <SmartTruncatedText 
                                                content={currentDesc}
                                                textClassName={`text-[14px] text-gray-600 leading-relaxed font-medium break-keep w-full ${isAdmin && bookTargetId ? 'line-clamp-3' : 'line-clamp-4'}`}
                                            />
                                        </div>
                                        {isAdmin && bookTargetId && (
                                            <div className="shrink-0 flex justify-end w-full pt-1">
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button 
                                                                onClick={handleOpenDescModal}
                                                                className="text-[#0066cc] font-bold border-b border-dashed border-[#0066cc] pb-[1px] hover:text-blue-700 hover:border-blue-700 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                                                            >
                                                                <Edit2 size={10} /> 상세 설명 수정
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="bg-[#1d1d1f] text-white text-[12px] font-bold px-3 py-2 rounded-lg border-none shadow-md z-[100]">
                                                            도서 상세 설명을 직접 수정할 수 있습니다.
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. 하단 독서 기록 영역 (높이 고정 및 상향 조정) */}
                                    <div className="w-full shrink-0">
                                        <div className="bg-[#F5F5F7] rounded-2xl px-5 pt-4 pb-6 border border-gray-200/60 shadow-sm w-full flex flex-col justify-between h-[132px]">
                                            <div className="flex justify-between items-center shrink-0">
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
                                            
                                            <div className="flex-1 flex flex-col justify-end">
                                                {statusIndex === 1 && (
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-[12px] font-extrabold text-[#0066cc]">
                                                            {dbTotalPage > 0 ? `${progressPercent}%` : '읽는 중'}
                                                        </span>
                                                        <span className="text-[12px] text-gray-500 font-bold">
                                                            {dbTotalPage > 0 ? `${currentPage} / ${dbTotalPage} 페이지` : `현재 ${currentPage}쪽`}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="shrink-0 mt-auto">
                                                <div className="relative h-2 bg-gray-200 rounded-full flex items-center mb-2">
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
                                </div>

                                {/* ━━━━━━━━ 우측 컬럼 (작가 정보) ━━━━━━━━ */}
                                <div className="w-full lg:w-1/3 flex flex-col min-w-0 h-full shrink-0">
                                    {authorInfo && (
                                        <>
                                            <div className="shrink-0 flex flex-col mb-4">
                                                <h2 className="text-[12px] font-black tracking-widest text-gray-400 uppercase mb-4">Author</h2>
                                                <div className="flex items-center gap-3">
                                                    <AuthorAvatar authorId={Number(authorInfo.id)} src={authorInfo.photo} alt={authorInfo.name} size={48} fallbackType="user" />
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-[16px] font-extrabold text-[#1d1d1f] truncate">{authorInfo.name}</h3>
                                                        {authorInfo.role && <p className="text-[11px] font-bold text-[#0066cc] mt-0.5 truncate">{authorInfo.role}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 flex flex-col min-h-0 mb-4">
                                                <div className="flex-1 overflow-hidden">
                                                    {/* 💡 [조건부 렌더링] 작가 소개 수정 버튼 유무에 따라 3줄/4줄 동적 변경 */}
                                                    <SmartTruncatedText 
                                                        content={currentBio || "등록된 저자 소개가 없습니다."} 
                                                        textClassName={`text-[14px] leading-relaxed text-gray-600 font-medium break-keep w-full ${isAdmin && authorInfo?.id ? 'line-clamp-3' : 'line-clamp-4'}`} 
                                                    />
                                                </div>
                                                {isAdmin && authorInfo?.id && (
                                                    <div className="shrink-0 flex justify-end w-full pt-1">
                                                        <TooltipProvider delayDuration={200}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button onClick={handleOpenBioModal} className="text-[#0066cc] font-bold border-b border-dashed border-[#0066cc] pb-[1px] hover:text-blue-700 text-[11px] flex items-center gap-1"><Edit2 size={10} /> 작가 소개 수정</button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="bg-[#1d1d1f] text-white text-[12px] font-bold px-3 py-2 rounded-lg border-none shadow-md z-[100]">
                                                                    작가 상세 소개를 직접 수정할 수 있습니다.
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="shrink-0 w-full border-t border-gray-100 pt-4 mt-auto">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-[12px] font-extrabold text-gray-500 uppercase tracking-wide">대표작</h3>
                                                    {authorOtherBooks.length > 1 && (
                                                        <button onClick={() => router.push(`/author/${authorInfo.id}`)} className="text-[11px] font-bold text-[#0066cc] flex items-center gap-1 hover:underline group">
                                                            더 보기 <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                                        </button>
                                                    )}
                                                </div>
                                                {authorOtherBooks.length > 0 ? (
                                                    authorOtherBooks.slice(0, 1).map((book) => (
                                                        <div key={book.id} onClick={() => router.push(`/works/${book.id}`)} className="flex items-center gap-3 cursor-pointer group rounded-xl hover:bg-gray-50 p-2 -ml-2 border border-transparent hover:border-gray-100">
                                                            <FloatingCover src={book.cover} className="w-[44px] shrink-0 aspect-[1/1.45]" iconSize={12} />
                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                <h4 className="text-[14px] font-bold text-[#1d1d1f] line-clamp-2 leading-tight group-hover:text-[#0066cc] mb-1">{book.title}</h4>
                                                                <span className="text-[11px] font-bold text-gray-400">BoooknTalk 광장</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex items-center gap-3 rounded-xl p-2 -ml-2 opacity-60">
                                                        <FloatingCover src={null} className="w-[44px] shrink-0 aspect-[1/1.45] bg-gray-100" iconSize={12} />
                                                        <div className="flex flex-col flex-1 min-w-0"><h4 className="text-[13px] font-bold text-gray-400 line-clamp-2">등록된 대표 도서가 없습니다.</h4></div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* 다이얼로그 모달들 (기존과 동일) */}
            <Dialog open={isBioModalOpen} onOpenChange={setIsBioModalOpen}>
                <DialogContent className="sm:max-w-[600px] bg-white border border-gray-200 rounded-[20px] p-6 shadow-2xl">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-[20px] font-black text-[#1d1d1f]">작가 상세 소개 수정</DialogTitle>
                        <DialogDescription className="text-[13px] text-gray-500 font-medium">
                            {authorInfo?.name} 작가의 소개글을 수정합니다. 관리자 권한으로 즉시 반영됩니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        <textarea 
                            value={editingBio}
                            onChange={(e) => setEditingBio(e.target.value)}
                            placeholder="작가 소개글을 입력해 주세요..."
                            className="w-full h-[240px] p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700 leading-relaxed font-medium resize-none focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] transition-all"
                        />
                    </div>
                    <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
                        <Button variant="outline" onClick={() => setIsBioModalOpen(false)} disabled={isSavingBio} className="rounded-xl border-gray-200 text-gray-600 font-bold">취소</Button>
                        <Button onClick={handleSaveBio} disabled={isSavingBio} className="rounded-xl bg-[#0066cc] text-white font-bold">{isSavingBio ? <><Loader2 className="animate-spin mr-2" size={16} /> 저장 중...</> : '저장하기'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDescModalOpen} onOpenChange={setIsDescModalOpen}>
                <DialogContent className="sm:max-w-[600px] bg-white border border-gray-200 rounded-[20px] p-6 shadow-2xl">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-[20px] font-black text-[#1d1d1f]">도서 상세 설명 수정</DialogTitle>
                        <DialogDescription className="text-[13px] text-gray-500 font-medium">
                            {work?.title || edition?.title}의 상세 설명을 수정합니다. 모든 판본에 공통 적용됩니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        <textarea 
                            value={editingDesc}
                            onChange={(e) => setEditingDesc(e.target.value)}
                            placeholder="도서 상세 설명을 입력해 주세요..."
                            className="w-full h-[240px] p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700 leading-relaxed font-medium resize-none focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] transition-all"
                        />
                    </div>
                    <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
                        <Button variant="outline" onClick={() => setIsDescModalOpen(false)} disabled={isSavingDesc} className="rounded-xl border-gray-200 text-gray-600 font-bold">취소</Button>
                        <Button onClick={handleSaveDesc} disabled={isSavingDesc} className="rounded-xl bg-[#0066cc] text-white font-bold">{isSavingDesc ? <><Loader2 className="animate-spin mr-2" size={16} /> 저장 중...</> : '저장하기'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}