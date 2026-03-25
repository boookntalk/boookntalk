// 파일 경로: src/app/(main)/my-authors/writer/AuthorWriterClient.tsx
// 역할 및 기능: 화면을 좌우로 분할하여 좌측에는 작가 목록을, 우측에는 선택된 작가의 연도별 발간 도서 타임라인을 보여주는 Master-Detail 컴포넌트입니다.

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, ChevronRight, Users, Search, BookOpen, ExternalLink, Loader2, X, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// 임시 작가 데이터 타입
interface AuthorListItem {
    id: number;
    name: string;
    read_count: number;
}

// 외부 서점 모달 타입
interface BookstoreModalData {
    isOpen: boolean;
    bookTitle: string;
    isbn: string;
}

// 함수 기능: 좌측 리스트와 우측 타임라인 상태를 통합 관리하고 분할된 UI를 렌더링합니다.
export default function AuthorWriterClient() {
    // === [상태 관리] ===
    const [authors, setAuthors] = useState<AuthorListItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
    const [timelineData, setTimelineData] = useState<any[]>([]);
    const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
    
    const [modalData, setModalData] = useState<BookstoreModalData>({ isOpen: false, bookTitle: '', isbn: '' });

    const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set());
    // ▼▼▼ [NEW] 필터 모드 상태 추가 ('ALL' 또는 'MY_BOOKS') ▼▼▼
    const [filterMode, setFilterMode] = useState<'ALL' | 'MY_BOOKS'>('ALL');

    // 함수 기능: 특정 연도를 클릭하면 접기/펼치기 상태를 토글합니다.
    const toggleYear = (year: string) => {
        setCollapsedYears(prev => {
            const next = new Set(prev);
            if (next.has(year)) next.delete(year);
            else next.add(year);
            return next;
        });
    };

    // === [데이터 로딩] ===
    // 1. 좌측 작가 목록 로드 (진짜 백엔드 API 호출)
    useEffect(() => {
        const fetchAuthors = async () => {
            try {
                // user_id=1의 데이터를 가져옵니다.
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

    // 2. 우측 타임라인 로드 (작가가 선택될 때마다 API 호출)
    useEffect(() => {
        if (!selectedAuthor) return;

        const fetchTimeline = async () => {
            setIsLoadingTimeline(true);
            setTimelineData([]); 
            setCollapsedYears(new Set()); 
            setFilterMode('ALL'); // 💡 [NEW] 작가가 바뀌면 필터도 '전체 보기'로 초기화!

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

    // === [이벤트 핸들러] ===
    const filteredAuthors = authors.filter(author => author.name.includes(searchTerm));

    const handleBookClick = (book: any) => {
        if (book.is_in_square) {
            // DB에 있는 책은 상세 페이지 이동 (현재는 alert로 대체)
            alert(`내부 도서 상세 페이지로 이동: ${book.title}`);
        } else {
            setModalData({ isOpen: true, bookTitle: book.title, isbn: book.isbn });
        }
    };

    return (
        <div className="flex w-full h-full overflow-hidden bg-[#F5F5F7]">
            
            {/* ========================================== */}
            {/* 좌측 패널 (Master): 작가 목록 (너비 320px 고정) */}
            {/* ========================================== */}
            <div className="w-[320px] flex-none bg-white border-r border-gray-200 flex flex-col h-full z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                {/* 좌측 패널 헤더 */}
                <div className="p-5 border-b border-gray-100 flex-none">
                    <div className="flex items-center gap-2 mb-4">
                        <Users size={20} className="text-[#0066cc]" />
                        <h2 className="text-[18px] font-black text-[#1d1d1f]">나의 작가들</h2>
                    </div>
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <Input 
                            placeholder="작가 이름 검색" 
                            className="pl-9 h-9 text-[13px] bg-gray-50 border-transparent focus-visible:bg-white focus-visible:ring-[#0066cc]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* 좌측 패널 리스트 영역 (독립 스크롤) */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 scrollbar-hide">
                    {filteredAuthors.map((author) => (
                        <button
                            key={author.id}
                            onClick={() => setSelectedAuthor(author.name)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group
                                ${selectedAuthor === author.name 
                                    ? 'bg-[#0066cc] text-white shadow-md' 
                                    : 'hover:bg-gray-50 text-[#1d1d1f]'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors
                                    ${selectedAuthor === author.name ? 'bg-white/20' : 'bg-[#f0f5fa] group-hover:bg-[#e6f0fa]'}`}>
                                    <Users size={18} className={selectedAuthor === author.name ? 'text-white' : 'text-[#0066cc]'} />
                                </div>
                                <span className={`text-[15px] font-bold ${selectedAuthor === author.name ? 'text-white' : 'text-[#1d1d1f]'}`}>
                                    {author.name}
                                </span>
                            </div>
                            <Badge variant="secondary" className={`text-[11px] font-bold px-2 py-0.5 
                                ${selectedAuthor === author.name ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {author.read_count}권
                            </Badge>
                        </button>
                    ))}
                </div>
            </div>

            {/* ========================================== */}
            {/* 우측 패널 (Detail): 타임라인 (유동적 너비) */}
            {/* ========================================== */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
                {!selectedAuthor ? (
                    // 1. 작가 미선택 시 빈 화면
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <Users size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-[18px] font-black text-[#1d1d1f] mb-2">작가를 선택해주세요</h3>
                        <p className="text-[14px] text-gray-400 font-medium">왼쪽 목록에서 작가를 선택하면 발자취를 볼 수 있습니다.</p>
                    </div>
                ) : (
                    // 2. 작가 선택 시 타임라인 화면
                    <div className="w-full flex flex-col pb-20">
                        {/* 우측 상단 네비게이션 및 헤더 */}
                        <div className="flex-none bg-[#F5F5F7]/90 backdrop-blur-md z-30 pt-4 px-[var(--spacing-1cm,32px)] border-b border-gray-200 sticky top-0">
                            <div className="flex items-center gap-2 text-[13px] font-bold text-gray-400 mb-4">
                                <Link href="/" className="hover:text-[#0066cc]"><Home size={15} /></Link>
                                <ChevronRight size={14} className="opacity-50" />
                                <span>나의 작가</span>
                                <ChevronRight size={14} className="opacity-50" />
                                <span className="text-[#1d1d1f]">{selectedAuthor}</span>
                            </div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-[26px] font-black text-[#1d1d1f]">
                                        {selectedAuthor} 작가의 발자취
                                    </h1>
                                    {!isLoadingTimeline && timelineData.length > 0 && (
                                        <Badge variant="secondary" className="bg-white border border-gray-200 text-[#0066cc] text-[13px] font-bold px-2.5 py-1">
                                            총 {timelineData.reduce((acc, year) => acc + year.books.length, 0)}권 출간
                                        </Badge>
                                    )}
                                </div>

                                {/* ▼▼▼ [NEW] 직관적인 필터 토글 탭 ▼▼▼ */}
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
                                // ... (로딩 UI 동일 유지) ...
                                <div className="flex flex-col items-center justify-center py-24 gap-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                    <p className="text-[13px] font-bold text-gray-400 animate-pulse">발자취를 따라가고 있습니다...</p>
                                </div>
                            ) : (
                                <div className="w-full max-w-4xl"> 
                                    <div className="relative border-l-2 border-[#0066cc]/20 ml-3 md:ml-6 space-y-12">
                                        {/* ▼▼▼ [NEW] 원본 데이터를 훼손하지 않고 렌더링 직전에 동적 필터링 ▼▼▼ */}
                                        {timelineData
                                            .map(yearData => {
                                                if (filterMode === 'ALL') return yearData;
                                                // 내 서재 모드일 경우, is_in_square가 true인 도서만 걸러냄
                                                return {
                                                    ...yearData,
                                                    books: yearData.books.filter((book: any) => book.is_in_square)
                                                };
                                            })
                                            // 필터링 후 해당 연도에 표시할 책이 0권이라면 그 연도 자체를 통째로 숨김
                                            .filter(yearData => yearData.books.length > 0)
                                            .map((yearData, index) => {
                                                const isCollapsed = collapsedYears.has(yearData.year);
                                                
                                                return (
                                                    <div key={index} className="relative pl-8 md:pl-12">
                                                        {/* ▼▼▼ [NEW] 타임라인 동그라미(O) 자체를 클릭 가능한 토글 버튼으로 개조 ▼▼▼ */}
                                                        <div 
                                                            onClick={() => toggleYear(yearData.year)}
                                                            className={`absolute flex items-center justify-center w-7 h-7 rounded-full -left-[15px] top-0 shadow-sm z-10 cursor-pointer transition-all duration-200 hover:scale-110
                                                                ${isCollapsed 
                                                                    ? 'bg-white border-[3px] border-gray-300 text-gray-400 hover:border-[#0066cc] hover:text-[#0066cc]' 
                                                                    : 'bg-[#0066cc] border-[3px] border-[#0066cc] text-white shadow-md'}`}
                                                        >
                                                            {isCollapsed ? <Plus size={14} strokeWidth={3} /> : <Minus size={14} strokeWidth={3} />}
                                                        </div>
                                                        
                                                        {/* ▼▼▼ [수정] 연도 텍스트 영역 (여기에 있던 기존 클릭 이벤트와 화살표는 삭제하여 깔끔하게 유지) ▼▼▼ */}
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
                                                                        <p className="text-[13px] font-medium text-gray-400 flex items-center gap-1.5"><BookOpen size={12} /> 출간일: {book.publish_date}</p>
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
                        </div>
                    </div>
                )}
            </div>

            {/* 외부 서점 모달 영역 (우측 하단에서 팝업) */}
            {modalData.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1d1f]/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white w-[400px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* 모달 내용은 기존과 완벽 동일! */}
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
                            {/* 외부 링크들... */}
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