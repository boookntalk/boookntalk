'use client';

import React, { useState, useEffect } from 'react'; // useEffect 추가
import { Star, Plus, Search, BookOpen, CheckCircle, PauseCircle, MessageSquare } from 'lucide-react';
import { DESIGN_TOKEN } from '@/constants/styles';
import BookDetailForm from './BookDetailForm_org';
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
    status: 'READING' | 'COMPLETED' | 'WISH' | 'STOPPED'; // 대문자로 수정 (백엔드와 일치)
    rating?: number;
    short_review?: string; // 리뷰 유무 확인용
    added_at?: string;
}

export default function LibraryClient({ initialBooks, user }: { initialBooks: any[], user: any }) {
    // 1. 상태 관리
    const [activeTab, setActiveTab] = useState('ALL'); // 현재 선택된 탭 코드
    const [books, setBooks] = useState<Book[]>(initialBooks); // 보여줄 책 목록
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태

    // 모달 상태
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // 2. 메뉴 정의 (5개 탭)
    const menuItems = [
        { label: "전체", code: "ALL", icon: <BookOpen size={16} /> },
        { label: "읽는 중", code: "READING", icon: <BookOpen size={16} /> },
        { label: "완독", code: "COMPLETED", icon: <CheckCircle size={16} /> },
        { label: "리뷰", code: "REVIEW", icon: <MessageSquare size={16} /> }, // ✨ NEW
        { label: "중단", code: "STOPPED", icon: <PauseCircle size={16} /> },  // ✨ NEW
    ];

    // 3. 서버에서 데이터 가져오기 (탭 변경 시 실행)
    const fetchBooks = async (status: string) => {
        if (!user?.email) return;
        
        setIsLoading(true);
        try {
            // 백엔드 API 호출 (쿼리 스트링으로 status 전달)
            const response = await fetch(`/api/users/${user.email}/records?status=${status}`);
            if (response.ok) {
                const data = await response.json();
                // ▼▼▼ [디버깅 코드 추가] ▼▼▼
                console.log("🔥 서버에서 받은 데이터:", data); 
                // ▲▲▲ F12 개발자 도구 -> [Console] 탭에서 확인 가능
                setBooks(data);
            } else {
                console.error("Failed to fetch books");
            }
        } catch (error) {
            console.error("Error fetching books:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 4. 탭이 바뀔 때마다 데이터 다시 불러오기
    useEffect(() => {
        fetchBooks(activeTab);
    }, [activeTab]);

    // 5. 검색어 필터링 (클라이언트 측에서 처리)
    const filteredBooks = books.filter(book => {
        return book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
               book.author.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const openDetailModal = (book: any) => {
        setSelectedBook(book);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="w-full min-h-screen relative bg-white">
            <Container className="pt-8 pb-24">        
                {/* 헤더 */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className={`text-[28px] ${DESIGN_TOKEN.FONT.TITLE} tracking-tight text-[#1d1d1f]`}>나의 서재</h1>
                        <p className={`${DESIGN_TOKEN.FONT.SUBTITLE} text-[14px] text-[#86868b]`}>수집한 지식과 문장들이 머무는 사색의 공간</p>
                    </div>
                    
                    {/* 검색창 */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative group w-full md:w-auto">
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

                {/* ✨ 탭 네비게이션 (5개 메뉴) */}
                <nav className="flex gap-6 mb-8 border-b border-gray-100 overflow-x-auto scrollbar-hide">
                    {menuItems.map((item) => (
                        <button
                            key={item.code}
                            onClick={() => setActiveTab(item.code)}
                            className={`pb-3 text-[15px] transition-all relative flex items-center gap-2 whitespace-nowrap px-1 ${
                                activeTab === item.code 
                                    ? 'text-[#1d1d1f] font-bold border-b-2 border-[#1d1d1f]' 
                                    : 'text-[#86868b] font-medium hover:text-[#1d1d1f] border-b-2 border-transparent'
                            }`}
                        >
                            {/* 아이콘은 선택되었을 때만 보여주거나 항상 보여줘도 됨 (여기선 심플하게 텍스트만) */}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* 로딩 표시 */}
                {isLoading ? (
                    <div className="py-20 text-center text-gray-400">
                        <div className="animate-pulse">📚 서재를 불러오는 중...</div>
                    </div>
                ) : (
                    /* 도서 그리드 */
                    <main className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
                        {filteredBooks.map((book) => (
                            <div 
                                key={book.id} 
                                onClick={() => openDetailModal(book)}
                                className="group cursor-pointer flex flex-col"
                            >
                                {/* 책 표지 */}
                                <div className="relative aspect-[1/1.5] w-full rounded-lg overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] bg-[#f5f5f7] transition-all duration-300 group-hover:shadow-[0_8px_16px_rgba(0,0,0,0.12)] group-hover:-translate-y-1">
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
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                            No Cover
                                        </div>
                                    )}
                                    
                                    {/* 상태 뱃지 (리뷰/중단 등 특이사항 있을 때 표시) */}
                                    {activeTab === 'ALL' && book.status === 'STOPPED' && (
                                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                                            중단
                                        </div>
                                    )}
                                </div>

                                {/* 도서 정보 */}
                                <div className="mt-3 px-1">
                                    <h3 className="font-bold text-[#1d1d1f] text-[15px] leading-snug line-clamp-1 mb-1">
                                        {book.title}
                                    </h3>
                                    <p className="text-[13px] text-[#86868b] line-clamp-1 mb-2">
                                        {book.author}
                                    </p>
                                    
                                    {/* 하단 정보 (별점 or 독서 상태) */}
                                    <div className="flex items-center gap-1 text-[12px] text-[#86868b]">
                                        {book.status === 'READING' ? (
                                             <span className="text-[#0066cc] font-medium">읽는 중</span>
                                        ) : book.rating && book.rating > 0 ? (
                                            <div className="flex items-center gap-1">
                                                <Star size={12} className="text-[#FFCC00] fill-[#FFCC00]" />
                                                <span className="font-bold text-[#1d1d1f]">{book.rating.toFixed(1)}</span>
                                            </div>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 데이터 없음 표시 */}
                        {!isLoading && filteredBooks.length === 0 && (
                            <div className="col-span-full py-32 text-center flex flex-col items-center justify-center text-gray-400">
                                <BookOpen size={48} className="mb-4 opacity-20" />
                                <p>아직 '{menuItems.find(m => m.code === activeTab)?.label}' 목록에 책이 없어요.</p>
                            </div>
                        )}
                    </main>
                )}
            </Container>

            {/* FAB 버튼 */}
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="fixed bottom-8 right-8 w-14 h-14 bg-[#1d1d1f] text-white rounded-full shadow-lg 
                           flex items-center justify-center hover:bg-[#000000] transition-all 
                           hover:scale-105 active:scale-95 z-40 group"
                aria-label="새 도서 등록"
            >
                <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* 모달들 */}
            <Dialog isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}>
                {selectedBook && (
                    <BookDetailForm 
                        initialData={selectedBook} 
                        onClose={() => setIsDetailModalOpen(false)} 
                    />
                )}
            </Dialog>

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