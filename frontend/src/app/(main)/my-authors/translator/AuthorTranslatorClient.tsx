// 파일 경로: src/app/(main)/my-authors/translator/AuthorTranslatorClient.tsx
// 역할 및 기능: 화면을 좌우로 분할하여 좌측에는 번역가 목록을, 우측에는 선택된 번역가의 연도별 번역 도서 타임라인을 보여주는 컴포넌트입니다.

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// ▼ [추가] 아코디언 버튼용 Plus, Minus 아이콘 추가
import { Home, ChevronRight, Languages, Search, BookOpen, ExternalLink, X, Plus, Minus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TranslatorListItem {
    id: number;
    name: string;
    read_count: number;
}

interface BookstoreModalData {
    isOpen: boolean;
    bookTitle: string;
    isbn: string;
}

export default function AuthorTranslatorClient() {
    const [translators, setTranslators] = useState<TranslatorListItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [selectedTranslator, setSelectedTranslator] = useState<string | null>(null);
    const [timelineData, setTimelineData] = useState<any[]>([]);
    const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
    
    const [modalData, setModalData] = useState<BookstoreModalData>({ isOpen: false, bookTitle: '', isbn: '' });

    // ▼ [추가 1] 아코디언 닫힘 상태 관리 및 필터 탭 상태
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
        const fetchTranslators = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/authors/translator/list?user_id=1');
                if (response.ok) {
                    const data = await response.json();
                    setTranslators(data);
                }
            } catch (error) {
                console.error("번역가 목록 로딩 실패:", error);
            }
        };
        fetchTranslators();
    }, []);

    useEffect(() => {
        if (!selectedTranslator) return;

        const fetchTimeline = async () => {
            setIsLoadingTimeline(true);
            
            // ▼ [수정 1] 잔상(Flickering) 방지 및 필터/아코디언 상태 초기화
            setTimelineData([]); 
            setCollapsedYears(new Set());
            setFilterMode('ALL');

            try {
                const response = await fetch(`http://localhost:8000/api/authors/translator/${encodeURIComponent(selectedTranslator)}/timeline`);
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
    }, [selectedTranslator]);

    const filteredTranslators = translators.filter(t => t.name.includes(searchTerm));

    const handleBookClick = (book: any) => {
        if (book.is_in_square) {
            alert(`내부 도서 상세 페이지로 이동: ${book.title}`);
        } else {
            setModalData({ isOpen: true, bookTitle: book.title, isbn: book.isbn });
        }
    };

    return (
        <div className="flex w-full h-full overflow-hidden bg-[#F5F5F7]">
            {/* 좌측 패널 (유지) */}
            <div className="w-[320px] flex-none bg-white border-r border-gray-200 flex flex-col h-full z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-5 border-b border-gray-100 flex-none">
                    <div className="flex items-center gap-2 mb-4">
                        <Languages size={20} className="text-[#0066cc]" />
                        <h2 className="text-[18px] font-black text-[#1d1d1f]">나의 번역가들</h2>
                    </div>
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <Input 
                            placeholder="번역가 이름 검색" 
                            className="pl-9 h-9 text-[13px] bg-gray-50 border-transparent focus-visible:bg-white focus-visible:ring-[#0066cc]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 scrollbar-hide">
                    {filteredTranslators.map((translator) => (
                        <button
                            key={translator.id}
                            onClick={() => setSelectedTranslator(translator.name)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group
                                ${selectedTranslator === translator.name 
                                    ? 'bg-[#0066cc] text-white shadow-md' 
                                    : 'hover:bg-gray-50 text-[#1d1d1f]'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors
                                    ${selectedTranslator === translator.name ? 'bg-white/20' : 'bg-[#f0f5fa] group-hover:bg-[#e6f0fa]'}`}>
                                    <Languages size={18} className={selectedTranslator === translator.name ? 'text-white' : 'text-[#0066cc]'} />
                                </div>
                                <span className={`text-[15px] font-bold ${selectedTranslator === translator.name ? 'text-white' : 'text-[#1d1d1f]'}`}>
                                    {translator.name}
                                </span>
                            </div>
                            <Badge variant="secondary" className={`text-[11px] font-bold px-2 py-0.5 
                                ${selectedTranslator === translator.name ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {translator.read_count}권
                            </Badge>
                        </button>
                    ))}
                </div>
            </div>

            {/* 우측 패널 */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
                {!selectedTranslator ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <Languages size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-[18px] font-black text-[#1d1d1f] mb-2">번역가를 선택해주세요</h3>
                        <p className="text-[14px] text-gray-400 font-medium">왼쪽 목록에서 번역가를 선택하면 번역 발자취를 볼 수 있습니다.</p>
                    </div>
                ) : (
                    <div className="w-full flex flex-col pb-20">
                        <div className="flex-none bg-[#F5F5F7]/90 backdrop-blur-md z-30 pt-4 px-[var(--spacing-1cm,32px)] border-b border-gray-200 sticky top-0">
                            <div className="flex items-center gap-2 text-[13px] font-bold text-gray-400 mb-4">
                                <Link href="/" className="hover:text-[#0066cc]"><Home size={15} /></Link>
                                <ChevronRight size={14} className="opacity-50" />
                                <span>나의 번역가</span>
                                <ChevronRight size={14} className="opacity-50" />
                                <span className="text-[#1d1d1f]">{selectedTranslator}</span>
                            </div>
                            
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-[26px] font-black text-[#1d1d1f]">
                                        {selectedTranslator} 번역가의 발자취
                                    </h1>
                                    {!isLoadingTimeline && timelineData.length > 0 && (
                                        <Badge variant="secondary" className="bg-white border border-gray-200 text-[#0066cc] text-[13px] font-bold px-2.5 py-1">
                                            총 {timelineData.reduce((acc, year) => acc + year.books.length, 0)}권 번역
                                        </Badge>
                                    )}
                                </div>

                                {/* ▼ [수정 2] 필터 모드 탭 추가 */}
                                {!isLoadingTimeline && timelineData.length > 0 && (
                                    <div className="flex bg-gray-200/50 p-1 rounded-xl">
                                        <button 
                                            onClick={() => setFilterMode('ALL')}
                                            className={`px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all ${filterMode === 'ALL' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-gray-500 hover:text-[#1d1d1f]'}`}
                                        >
                                            전체 도서
                                        </button>
                                        <button 
                                            onClick={() => setFilterMode('MY_BOOKS')}
                                            className={`px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all ${filterMode === 'MY_BOOKS' ? 'bg-[#0066cc] text-white shadow-sm' : 'text-gray-500 hover:text-[#1d1d1f]'}`}
                                        >
                                            내 서재만
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-[var(--spacing-1cm,32px)]">
                            {isLoadingTimeline ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                    <p className="text-[13px] font-bold text-gray-400 animate-pulse">번역 발자취를 따라가고 있습니다...</p>
                                </div>
                            ) : (
                                <div className="w-full max-w-4xl"> 
                                    <div className="relative border-l-2 border-[#0066cc]/20 ml-3 md:ml-6 space-y-12">
                                        {/* ▼ [수정 3] 필터링 로직 + 아코디언 O버튼 적용 */}
                                        {timelineData
                                            .map(yearData => {
                                                if (filterMode === 'ALL') return yearData;
                                                return {
                                                    ...yearData,
                                                    books: yearData.books.filter((book: any) => book.is_in_square)
                                                };
                                            })
                                            .filter(yearData => yearData.books.length > 0)
                                            .map((yearData, index) => {
                                                const isCollapsed = collapsedYears.has(yearData.year);
                                                
                                                return (
                                                    <div key={index} className="relative pl-8 md:pl-12">
                                                        {/* 노드 버튼 (Plus/Minus) */}
                                                        <div 
                                                            onClick={() => toggleYear(yearData.year)}
                                                            className={`absolute flex items-center justify-center w-7 h-7 rounded-full -left-[15px] top-0 shadow-sm z-10 cursor-pointer transition-all duration-200 hover:scale-110
                                                                ${isCollapsed 
                                                                    ? 'bg-white border-[3px] border-gray-300 text-gray-400 hover:border-[#0066cc] hover:text-[#0066cc]' 
                                                                    : 'bg-[#0066cc] border-[3px] border-[#0066cc] text-white shadow-md'}`}
                                                        >
                                                            {isCollapsed ? <Plus size={14} strokeWidth={3} /> : <Minus size={14} strokeWidth={3} />}
                                                        </div>
                                                        
                                                        {/* 연도 헤더 */}
                                                        <div className="flex items-center gap-3 mb-6 -mt-1 w-fit select-none">
                                                            <h2 className="text-[28px] font-black text-[#1d1d1f] leading-none tracking-tight">
                                                                {yearData.year}
                                                            </h2>
                                                            <Badge variant="outline" className="text-[12px] font-bold text-gray-400 border-gray-200 px-2 py-0.5">
                                                                {yearData.books.length}권
                                                            </Badge>
                                                        </div>

                                                        {/* 도서 목록 (아코디언 토글 적용 + 등록/미등록 배경색 구분) */}
                                                        <div className={`flex flex-col gap-4 transition-all duration-300 origin-top ${isCollapsed ? 'hidden' : 'block'}`}>
                                                            {/* ▼ [수정] map 함수에 bookIndex를 추가하고, key에 결합합니다! */}
                                                            {yearData.books.map((book: any, bookIndex: number) => (
                                                                <div 
                                                                    key={`${book.id}_${bookIndex}`} 
                                                                    onClick={() => handleBookClick(book)}
                                                                    className={`group p-5 rounded-xl shadow-sm border transition-all cursor-pointer flex items-center justify-between hover:shadow-md
                                                                        ${book.is_in_square 
                                                                            ? 'bg-[#e6f0fa]/50 border-[#0066cc]/10 hover:border-[#0066cc]/30' 
                                                                            : 'bg-white border-gray-100 hover:border-[#0066cc]/30'}`}
                                                                >
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <div className="flex items-center gap-2">
                                                                            <h3 className="text-[16px] font-bold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors line-clamp-1">
                                                                                {book.title}
                                                                            </h3>
                                                                            {!book.is_in_square && (
                                                                                <Badge variant="outline" className="bg-gray-50 text-gray-400 border-gray-200 text-[10px] px-1.5 py-0">미등록</Badge>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-[13px] font-medium text-gray-400 flex items-center gap-1.5">
                                                                            <BookOpen size={12} /> 출간일: {book.publish_date}
                                                                        </p>
                                                                    </div>
                                                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#e6f0fa] transition-colors shrink-0">
                                                                        {book.is_in_square ? (
                                                                            <ChevronRight size={16} className="text-gray-400 group-hover:text-[#0066cc]" />
                                                                        ) : (
                                                                            <ExternalLink size={14} className="text-gray-400 group-hover:text-[#0066cc]" />
                                                                        )}
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
                        </div>
                    </div>
                )}
            </div>

            {/* 외부 서점 모달 (유지) */}
            {modalData.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1d1f]/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white w-[400px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-[18px] font-black text-[#1d1d1f] mb-1">외부 서점에서 보기</h3>
                                <p className="text-[13px] font-bold text-gray-400 line-clamp-1">"{modalData.bookTitle}"</p>
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
        </div>
    );
}