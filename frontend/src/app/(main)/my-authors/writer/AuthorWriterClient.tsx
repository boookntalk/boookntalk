// 파일 경로: src/app/(main)/my-authors/writer/AuthorWriterClient.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, ChevronRight, Users, Search, BookOpen, ExternalLink, X, Plus, Minus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import MasterDetailLayout from '@/components/layout/MasterDetailLayout';
import { AuthorAvatar } from '@/components/common/AuthorAvatar';

interface AuthorListItem {
    id: number;
    name: string;
    read_count: number;
    profile_image: string | null; // 💡 이 줄을 추가해 주세요!
}

interface BookstoreModalData {
    isOpen: boolean;
    bookTitle: string;
    isbn: string;
}

export default function AuthorWriterClient() {
    const [authors, setAuthors] = useState<AuthorListItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
    const [timelineData, setTimelineData] = useState<any[]>([]);
    const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
    
    const [modalData, setModalData] = useState<BookstoreModalData>({ isOpen: false, bookTitle: '', isbn: '' });
    const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set());
    const [filterMode, setFilterMode] = useState<'ALL' | 'MY_BOOKS'>('ALL');

    const toggleYear = (year: string) => {
        setCollapsedYears(prev => {
            const next = new Set(prev);
            if (next.has(year)) next.delete(year);
            else next.add(year);
            return next;
        });
    };

    useEffect(() => {
        const fetchAuthors = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/authors/writer/list?user_id=1');
                if (response.ok) {
                    const data = await response.json();
                    setAuthors(data);
                }
            } catch (error) {
                console.error("작가 목록 로딩 실패:", error);
            }
        };
        fetchAuthors();
    }, []);

    useEffect(() => {
        if (!selectedAuthor) return;

        window.scrollTo({ top: 0, behavior: 'smooth' });

        const fetchTimeline = async () => {
            setIsLoadingTimeline(true);
            setTimelineData([]); 
            setCollapsedYears(new Set()); 
            setFilterMode('ALL'); 

            try {
                const response = await fetch(`http://localhost:8000/api/authors/writer/${encodeURIComponent(selectedAuthor)}/timeline`);
                if (response.ok) {
                    const data = await response.json();
                    setTimelineData(data);
                } else {
                    setTimelineData([]);
                }
            } catch (error) {
                console.error("타임라인 로딩 실패:", error);
                setTimelineData([]);
            } finally {
                setIsLoadingTimeline(false);
            }
        };
        fetchTimeline();
    }, [selectedAuthor]);

    const filteredAuthors = authors.filter(author => author.name.includes(searchTerm));

    const handleBookClick = (book: any) => {
        if (book.is_in_square) {
            alert(`내부 도서 상세 페이지로 이동: ${book.title}`);
        } else {
            setModalData({ isOpen: true, bookTitle: book.title, isbn: book.isbn });
        }
    };

    return (
        <>
            <MasterDetailLayout
                // 1. 좌측 (Master) 영역 설정
                masterTitle={
                    <div className="flex items-center gap-2">
                        <Users size={20} className="text-[#0066cc]" />
                        <h2 className="text-[18px] font-black text-[#1d1d1f]">나의 작가들</h2>
                    </div>
                }
                masterSearch={
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <Input 
                            placeholder="작가 이름 검색" 
                            className="pl-9 h-9 text-[13px] bg-gray-50 border-transparent focus-visible:bg-white focus-visible:ring-[#0066cc]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                }
                masterList={
                    filteredAuthors.map((author) => (
                        <button
                            key={author.id}
                            onClick={() => setSelectedAuthor(author.name)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group
                                ${selectedAuthor === author.name 
                                    ? 'bg-[#0066cc] text-white shadow-md' 
                                    : 'hover:bg-gray-50 text-[#1d1d1f]'}`}
                        >
                            <div className="flex items-center gap-3">
                                
                                {/* ▼▼▼ 이 부분을 AuthorAvatar로 완벽 교체! ▼▼▼ */}
                                <div className={`rounded-full ring-2 transition-all ${selectedAuthor === author.name ? 'ring-white/30' : 'ring-transparent'}`}>
                                    <AuthorAvatar 
                                        authorId={author.id} 
                                        src={author.profile_image} 
                                        alt={author.name} 
                                        size={40} 
                                        fallbackType="user" 
                                    />
                                </div>
                                {/* ▲▲▲ 교체 완료 ▲▲▲ */}

                                <span className={`text-[15px] font-bold ${selectedAuthor === author.name ? 'text-white' : 'text-[#1d1d1f]'}`}>
                                    {author.name}
                                </span>
                            </div>
                            <Badge variant="secondary" className={`text-[11px] font-bold px-2 py-0.5 
                                ${selectedAuthor === author.name ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {author.read_count}권
                            </Badge>
                        </button>
                    ))
                }

                // 2. 우측 (Detail) 상태 및 헤더 설정
                hasSelection={!!selectedAuthor}
                emptyState={
                    // 💡 [영점 조절] justify-center를 justify-start로 변경하고 pt-32(위에서부터의 여백)를 주어 시선에 딱 맞게 끌어올렸습니다!
                    <div className="flex-1 flex flex-col items-center justify-start text-center h-full pt-32 md:pt-40">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <Users size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-[18px] font-black text-[#1d1d1f] mb-2">작가를 선택해주세요</h3>
                        <p className="text-[14px] text-gray-400 font-medium">왼쪽 목록에서 작가를 선택하면 발자취를 볼 수 있습니다.</p>
                    </div>
                }
                breadcrumb={
                    <>
                        <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                            <Home size={15} /> <span>홈</span>
                        </Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-gray-400">나의 작가</span>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-[#1d1d1f] font-bold">{selectedAuthor}</span>
                    </>
                }
                detailTitle={`${selectedAuthor || ''} 작가의 발자취`}
                detailBadge={
                    !isLoadingTimeline && timelineData.length > 0 ? (
                        <Badge variant="secondary" className="bg-white border border-gray-200 text-[#0066cc] text-[12px] font-bold px-2 py-0.5">
                            총 {timelineData.reduce((acc, year) => acc + year.books.length, 0)}권 출간
                        </Badge>
                    ) : null
                }
                detailActions={
                    !isLoadingTimeline && timelineData.length > 0 ? (
                        <div className="flex bg-gray-200/50 p-1 rounded-xl">
                            <button onClick={() => setFilterMode('ALL')} className={`px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all ${filterMode === 'ALL' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-gray-500 hover:text-[#1d1d1f]'}`}>
                                전체 도서
                            </button>
                            <button onClick={() => setFilterMode('MY_BOOKS')} className={`px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all ${filterMode === 'MY_BOOKS' ? 'bg-[#0066cc] text-white shadow-sm' : 'text-gray-500 hover:text-[#1d1d1f]'}`}>
                                내 서재만
                            </button>
                        </div>
                    ) : null
                }
            >
                {/* 3. 우측 (Detail) 실제 콘텐츠(타임라인) 영역 */}
                {isLoadingTimeline ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-5">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <p className="text-[13px] font-bold text-gray-400 animate-pulse">발자취를 따라가고 있습니다...</p>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl pb-20"> 
                        <div className="relative border-l-2 border-[#0066cc]/20 ml-3 md:ml-6 space-y-12">
                            {timelineData
                                .map(yearData => {
                                    if (filterMode === 'ALL') return yearData;
                                    return { ...yearData, books: yearData.books.filter((book: any) => book.is_in_square) };
                                })
                                .filter(yearData => yearData.books.length > 0)
                                .map((yearData, index) => {
                                    const isCollapsed = collapsedYears.has(yearData.year);
                                    return (
                                        <div key={index} className="relative pl-8 md:pl-12">
                                            <div 
                                                onClick={() => toggleYear(yearData.year)}
                                                className={`absolute flex items-center justify-center w-7 h-7 rounded-full -left-[15px] top-0 shadow-sm z-10 cursor-pointer transition-all duration-200 hover:scale-110 ${isCollapsed ? 'bg-white border-[3px] border-gray-300 text-gray-400 hover:border-[#0066cc] hover:text-[#0066cc]' : 'bg-[#0066cc] border-[3px] border-[#0066cc] text-white shadow-md'}`}
                                            >
                                                {isCollapsed ? <Plus size={14} strokeWidth={3} /> : <Minus size={14} strokeWidth={3} />}
                                            </div>
                                            
                                            <div className="flex items-center gap-3 mb-6 -mt-1 w-fit select-none">
                                                <h2 className="text-[28px] font-black text-[#1d1d1f] leading-none tracking-tight">
                                                    {yearData.year}
                                                </h2>
                                                <Badge variant="outline" className="text-[12px] font-bold text-gray-400 border-gray-200 px-2 py-0.5">
                                                    {yearData.books.length}권
                                                </Badge>
                                            </div>
                                            
                                            <div className={`flex flex-col gap-4 transition-all duration-300 origin-top ${isCollapsed ? 'hidden' : 'block'}`}>
                                                {yearData.books.map((book: any) => (
                                                    <div key={book.id} onClick={() => handleBookClick(book)} className={`group p-5 rounded-xl shadow-sm border transition-all cursor-pointer flex items-center justify-between hover:shadow-md ${book.is_in_square ? 'bg-[#e6f0fa]/50 border-[#0066cc]/10 hover:border-[#0066cc]/30' : 'bg-white border-gray-100 hover:border-[#0066cc]/30'}`}>
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-[16px] font-bold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors line-clamp-1">{book.title}</h3>
                                                                {!book.is_in_square && <Badge variant="outline" className="bg-gray-50 text-gray-400 border-gray-200 text-[10px] px-1.5 py-0">미등록</Badge>}
                                                            </div>
                                                            <p className="text-[14px] font-medium text-gray-400 flex items-center gap-1.5"><BookOpen size={12} /> 출간일: {book.publish_date}</p>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#e6f0fa] transition-colors shrink-0">
                                                            {book.is_in_square ? <ChevronRight size={16} className="text-gray-400 group-hover:text-[#0066cc]" /> : <ExternalLink size={14} className="text-gray-400 group-hover:text-[#0066cc]" />}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </MasterDetailLayout>

            {/* 외부 서점 모달 영역 */}
            {modalData.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1d1f]/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white w-[400px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-[18px] font-black text-[#1d1d1f] mb-1">외부 서점에서 보기</h3>
                                <p className="text-[14px] font-bold text-gray-400 line-clamp-1">"{modalData.bookTitle}"</p>
                            </div>
                            <button onClick={() => setModalData(prev => ({ ...prev, isOpen: false }))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-3 bg-gray-50/50">
                            <a href={`https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=All&SearchWord=${modalData.isbn}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-[#0066cc] hover:shadow-sm transition-all group">
                                <span className="text-[15px] font-bold text-[#1d1d1f] group-hover:text-[#0066cc]">알라딘에서 보기</span>
                                <ExternalLink size={16} className="text-gray-400 group-hover:text-[#0066cc]" />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}