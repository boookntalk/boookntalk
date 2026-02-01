'use client';

import React, { useState } from 'react';
import { Star, Plus, Search } from 'lucide-react';
import { DESIGN_TOKEN } from '@/constants/styles';
import BookDetailForm from './BookDetailForm';
import Dialog from '@/components/ui/dialog'; 
import Container from '@/components/layout/Container'; // 대소문자 확인: Container

export default function LibraryClient({ initialBooks }: { initialBooks: any[] }) {
    const [filter, setFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');

    const openModal = (book: any) => {
        setSelectedBook(book);
        setIsModalOpen(true);
    };

    return (
        /* 배경색을 globals.css의 --background와 통일하기 위해 bg 클래스 제거 */
        <div className="w-full">
            <Container className="pt-0 pb-16">        
                {/* 상단 헤더 섹션: layout.tsx에서 설정한 공통 여백(20px) 덕분에 pt-0 유지 */}
                <header className="flex justify-between items-start mb-8 pt-0">
                    <div className="flex flex-col gap-1">
                        <h1 className={`text-[28px] ${DESIGN_TOKEN.FONT.TITLE} tracking-tight text-[#1d1d1f]`}>나의 서재</h1>
                        <p className={`${DESIGN_TOKEN.FONT.SUBTITLE} text-[14px] text-[#86868b]`}>수집한 지식과 문장들이 머무는 사색의 공간</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                                                <div className="relative group">
                            {/* 아이콘 위치와 라인 스타일 수정 */}
                            <div className="flex items-center gap-2 pb-1.5 border-b border-gray-300 group-focus-within:border-[#1d1d1f] transition-all duration-300">
                                <Search size={18} className="text-gray-400 group-focus-within:text-[#1d1d1f] transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="도서명, 저자 검색"
                                    className="bg-transparent border-none outline-none text-[15px] w-64 placeholder:text-gray-400 text-[#1d1d1f]"
                                    value={searchTerm} // 기존 검색 상태 변수가 있다면 유지
                                    onChange={(e) => setSearchTerm(e.target.value)} // 기존 핸들러 유지
                                />
                            </div>
                        </div>
                        {/* <button className="flex items-center gap-2 bg-[#0066cc] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#0055aa] transition-all shadow-sm">
                            <Plus className="w-4 h-4" />
                            새 도서 등록
                        </button> */}
                    </div>
                </header>

                <nav className="flex gap-10 mb-8 border-b border-gray-200/40 relative">
                    {['all', 'reading', 'completed', 'wish'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        /* 주석을 올바른 JSX 주석 형식으로 수정하거나 속성 밖으로 이동했습니다. */
                        className={`pb-4 text-sm font-medium transition-all relative flex flex-col items-center gap-1 ${
                            filter === f ? 'text-[#0055aa] font-bold' : 'text-[#86868b] hover:text-[#1d1d1f]'
                        }`}
                    >
                        <span>
                            {f === 'all' && '전체 도서'}
                            {f === 'reading' && '읽는 중'}
                            {f === 'completed' && '완독'}
                            {f === 'wish' && '읽고 싶은'}
                        </span>

                        {/* 선택 시 텍스트 아래 중앙에 표시되는 푸른색 원 */}
                        {filter === f && (
                            <span className="absolute bottom-2 w-1.5 h-1.5 bg-[#0055aa] rounded-full shadow-[0_0_5px_rgba(0,85,170,0.4)]" />
                        )}
                    </button>
                    ))}
                </nav>

                <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {initialBooks.map((book) => (
                        <div 
                            key={book.id} 
                            onClick={() => openModal(book)}
                            className="group cursor-pointer"
                        >
                            {/* [수정 포인트] 정보 전체를 감싸는 흰색 카드 생성 */}
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-0.5">

                                {/* 1. 책 표지 영역 (카드 내 상단에 위치) */}
                                
                                <div className="relative aspect-[3/4] rounded-lg mb-4 w-[70%] mx-auto">
                                    <img 
                                        src={book.cover} 
                                        alt={book.title} 
                                        className="w-full h-full object-cover rounded-lg shadow-md 
                                        transition-all duration-500 ease-out 
                                        group-hover:-translate-y-0.3 group-hover:shadow-[10px_10px_10px_rgba(0,0,0,0.4)]" 
                                    />
                                    {/* 표지 위에 덧씌워지는 미세한 오버레이 (선택사항) */}
                                    <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                                </div>

                                {/* 2. 도서 정보 영역 (카드 내 하단에 위치) */}
                                <div className="text-left px-1"> {/* 좌측 정렬 유지 */}
                                    <h3 className="font-bold text-[#1d1d1f] text-[15px] mb-1 line-clamp-1">{book.title}</h3>
                                    <p className="text-[13px] text-[#86868b] mb-3">{book.author}</p>

                                    <div className="pt-3 border-t border-gray-100">
                                        {book.status === 'reading' ? (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[11px] font-bold">
                                                    <span className="text-[#0066cc]">45%</span>
                                                    <span className="text-gray-400">128 / 320p</span>
                                                </div>
                                                <div className="h-[4px] bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 w-[45%] rounded-full" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star 
                                                            key={i} 
                                                            size={12} 
                                                            fill={i < 4 ? "#FFCC00" : "#E5E5E7"} 
                                                            className={i < 4 ? "text-[#FFCC00]" : "text-[#E5E5E7]"} 
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-[13px] font-bold text-[#1d1d1f]">4.0</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </main>
            </Container>

            <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {selectedBook && <BookDetailForm initialData={selectedBook} onClose={() => setIsModalOpen(false)} />}
            </Dialog>
        </div>
    );
}