'use client';

import React, { useState } from 'react';
import { Star, Plus, Search } from 'lucide-react';
import { DESIGN_TOKEN } from '@/constants/styles';
import BookDetailForm from './BookDetailForm';
import AddBookModal from '@/components/AddBookModal'; // [추가] 도서 등록 모달 import 필요
import Dialog from '@/components/ui/dialog';
import Container from '@/components/layout/Container'; 
import Image from 'next/image'; 

// [타입 정의] 실제 데이터 구조에 맞게 수정 가능
interface Book {
    id: number;
    title: string;
    author: string;
    cover: string;
    status: 'reading' | 'completed' | 'wish';
    rating?: number;
    // ... 필요한 필드 추가
}

export default function LibraryClient({ initialBooks, user }: { initialBooks: any[], user: any }) {
    const [filter, setFilter] = useState('all');
    
    // 모달 상태 관리
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); // 상세 조회 모달
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);       // 도서 등록 모달
    const [selectedBook, setSelectedBook] = useState<any>(null);

    const [searchTerm, setSearchTerm] = useState('');

    // 책 클릭 시 상세 모달 열기
    const openDetailModal = (book: any) => {
        setSelectedBook(book);
        setIsDetailModalOpen(true);
    };

    // 필터링 로직 (예시)
    const filteredBooks = initialBooks.filter(book => {
        const matchesFilter = filter === 'all' || book.status === filter;
        const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              book.author.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        /* 배경색을 globals.css의 --background와 통일하기 위해 bg 클래스 제거 */
        <div className="w-full min-h-screen relative">
            <Container className="pt-0 pb-24">        
                {/* 상단 헤더 섹션 */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pt-0 gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className={`text-[28px] ${DESIGN_TOKEN.FONT.TITLE} tracking-tight text-[#1d1d1f]`}>나의 서재</h1>
                        <p className={`${DESIGN_TOKEN.FONT.SUBTITLE} text-[14px] text-[#86868b]`}>수집한 지식과 문장들이 머무는 사색의 공간</p>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative group w-full md:w-auto">
                            {/* 검색창 */}
                            <div className="flex items-center gap-2 pb-1.5 border-b border-gray-300 group-focus-within:border-[#1d1d1f] transition-all duration-300 w-full md:w-64">
                                <Search size={18} className="text-gray-400 group-focus-within:text-[#1d1d1f] transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="도서명, 저자 검색"
                                    className="bg-transparent border-none outline-none text-[15px] w-full placeholder:text-gray-400 text-[#1d1d1f]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* 탭 네비게이션 */}
                <nav className="flex gap-8 mb-8 border-b border-gray-200/40 relative">
                    {['all', 'reading', 'completed', 'wish'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`pb-4 text-sm transition-all relative flex flex-col items-center gap-1 ${
                                filter === f ? 'text-[#0055aa] font-bold' : 'text-[#86868b] font-medium hover:text-[#1d1d1f]'
                            }`}
                        >
                            <span>
                                {f === 'all' && '전체 도서'}
                                {f === 'reading' && '읽는 중'}
                                {f === 'completed' && '완독'}
                                {f === 'wish' && '읽고 싶은'}
                            </span>

                            {/* 선택 시 하단 인디케이터 */}
                            {filter === f && (
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#0055aa] rounded-full shadow-[0_0_5px_rgba(0,85,170,0.4)] mb-2" />
                            )}
                        </button>
                    ))}
                </nav>

                {/* 도서 그리드 */}
                <main className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
                    {filteredBooks.map((book) => (
                        <div 
                            key={book.id || book.library_id} 
                            onClick={() => openDetailModal(book)}
                            className="group cursor-pointer flex flex-col"
                        >
                            {/* 1. 책 표지 카드 */}
                            <div className="relative aspect-[1/1.5] w-full rounded-lg overflow-hidden shadow-sm border border-gray-100 bg-white transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                                {book.cover ? (
                                    <Image 
                                        src={book.cover} 
                                        alt={book.title}
                                        fill
                                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                        className="object-cover"
                                        unoptimized={true}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                        No Cover
                                    </div>
                                )}
                                {/* 호버 오버레이 */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
                            </div>

                            {/* 2. 도서 정보 (카드 하단) */}
                            <div className="mt-3 px-1">
                                <h3 className="font-bold text-[#1d1d1f] text-[15px] leading-snug line-clamp-1 mb-1">
                                    {book.title}
                                </h3>
                                <p className="text-[13px] text-[#86868b] line-clamp-1 mb-2">
                                    {book.author}
                                </p>

                                {/* 상태별 표시 (별점 or 독서율) */}
                                {book.status === 'READING' || book.status === 'reading' ? (
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#0066cc] w-[45%] rounded-full" />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <Star size={14} className="text-[#FFCC00] fill-[#FFCC00]" />
                                        <span className="text-[13px] font-bold text-[#1d1d1f]">
                                            {book.rating ? book.rating.toFixed(1) : "0.0"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {/* 검색 결과 없음 표시 */}
                    {filteredBooks.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-500">
                            등록된 도서가 없거나 검색 결과가 없습니다.
                        </div>
                    )}
                </main>
            </Container>

            {/* ▼▼▼ [복구] 도서 등록 플로팅 버튼 (FAB) ▼▼▼ */}
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="fixed bottom-8 right-8 w-14 h-14 bg-[#0066cc] text-white rounded-full shadow-lg 
                           flex items-center justify-center hover:bg-[#0052a3] transition-all 
                           hover:scale-110 active:scale-95 z-40 group"
                aria-label="새 도서 등록"
            >
                <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* 1. 도서 상세 모달 */}
            <Dialog isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}>
                {selectedBook && (
                    <BookDetailForm 
                        initialData={selectedBook} 
                        onClose={() => setIsDetailModalOpen(false)} 
                    />
                )}
            </Dialog>

            {/* 2. 도서 등록 모달 (AddBookModal 컴포넌트가 있다고 가정) */}
            {isAddModalOpen && (
                <AddBookModal 
                    isOpen={isAddModalOpen} 
                    onClose={() => setIsAddModalOpen(false)}
                    userEmail={user?.email} 
                />
            )}
        </div>
    );
}