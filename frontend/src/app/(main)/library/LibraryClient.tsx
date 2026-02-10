'use client';

import React, { useState, useEffect } from 'react';
import { Star, Search, BookOpen, CheckCircle, PauseCircle, MessageSquare, Heart } from 'lucide-react';
import { DESIGN_TOKEN } from '@/constants/styles';
import BookDetailForm from './BookDetailForm';
import Dialog from '@/components/ui/dialog'; 
import Container from '@/components/layout/Container'; 
import Image from 'next/image';


interface Book {
    library_id?: number; 
    id?: number;
    title: string;
    author: string;
    cover: string;
    status: string; 
    rating?: number;
    short_review?: string;
    isbn?: string;
    isbn10?: string;
}

export default function LibraryClient({ initialBooks, user }: { initialBooks: any[], user: any }) {
    // 1. 상태 관리
    const [activeTab, setActiveTab] = useState('ALL'); 
    const [books, setBooks] = useState<Book[]>(initialBooks); 
    const [isLoading, setIsLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // [수정 1] 메뉴에 '읽고 싶은(WISH)' 추가! (이게 없어서 책이 안 보였던 것)
    const menuItems = [
        { label: "전체 도서", code: "ALL" },
        { label: "읽고 싶은", code: "WISH" },      // ✨ 추가됨
        { label: "읽는 중", code: "READING" },
        { label: "완독", code: "COMPLETED" },
        { label: "리뷰", code: "REVIEW" },   
        { label: "중단", code: "STOPPED" },  
    ];

    const fetchBooks = async (status: string) => {
        if (!user?.email) {
            console.error("❌ user 정보 없음");
            return;
        }
        
        setIsLoading(true); // 로딩 시작
        try {
            // ▼▼▼ [수정] 주소 앞에 http://localhost:8000 을 붙여주세요! ▼▼▼
            const response = await fetch(`http://localhost:8000/api/users/${user.email}/records?status=${status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log("✅ 데이터 수신:", data);
                setBooks(data);
            }
        } catch (error) {
            console.error("Error fetching books:", error);
        } finally {
            setIsLoading(false); // 로딩 끝
        }
    };

    useEffect(() => {
        fetchBooks(activeTab);
    }, [activeTab]);

    const filteredBooks = books.filter(book => {
        if (!searchTerm) return true;
        return book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           book.author.toLowerCase().includes(searchTerm.toLowerCase());        
    });

    const openModal = (book: any) => {
        setSelectedBook(book);
        setIsModalOpen(true);
    };

    return (
        <div className="w-full">
            <Container className="pt-0 pb-16">        
                {/* 헤더 */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pt-0 gap-4">
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

                {/* 탭 네비게이션 */}
                <nav className="flex gap-6 mb-8 border-b border-gray-200/60 relative overflow-x-auto scrollbar-hide">
                    {menuItems.map((item) => (
                    <button
                        key={item.code}
                        onClick={() => setActiveTab(item.code)}
                        className={`pb-4 text-sm font-medium transition-all relative flex flex-col items-center gap-1 whitespace-nowrap px-2 ${
                            activeTab === item.code ? 'text-[#0055aa] font-bold' : 'text-[#86868b] hover:text-[#1d1d1f]'
                        }`}
                    >
                        <span>{item.label}</span>
                        {activeTab === item.code && (
                            <span className="absolute bottom-0 w-full h-0.5 bg-[#0055aa] shadow-[0_0_5px_rgba(0,85,170,0.4)]" />
                        )}
                    </button>
                    ))}
                </nav>

                {/* [수정 2] 깜빡임 해결 로직
                    isLoading이라고 해서 화면을 지우지 않습니다.
                    대신 opacity(투명도)를 조절해서 '로딩 중임'을 은은하게 보여줍니다.
                */}
                <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {filteredBooks.map((book, index) => (
                        <div 
                            key={book.library_id || book.id || `idx-${index}`} 
                            onClick={() => openModal(book)}
                            className="group cursor-pointer"
                        >
                            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 h-full flex flex-col">
                                
                                {/* 1. 표지 이미지 (기존 유지) */}
                                <div className="relative aspect-[3/4] rounded-lg mb-4 w-[60%] mx-auto overflow-visible shadow-sm transition-all duration-300 group-hover:shadow-[8px_8px_12px_rgba(0,0,0,0.25)] group-hover:-translate-y-1">
                                    {book.cover ? (
                                        <Image 
                                            src={book.cover} 
                                            alt={book.title}
                                            fill  
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            unoptimized={true} 
                                            className="object-cover rounded-[1px]" 
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded-lg">No Cover</div>
                                    )}
                                    {/* 호버 효과 */}
                                    <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                                </div>
                        
                                {/* 2. 텍스트 정보 영역 (flex-grow로 하단 정렬 보장) */}
                                <div className="text-left px-1 flex flex-col flex-grow">
                                    
                                    {/* 제목 */}
                                    <h3 className="font-bold text-[#1d1d1f] text-[15px] mb-1 line-clamp-1" title={book.title}>
                                        {book.title}
                                    </h3>

                                    {/* [수정] 작가 정보: 2줄까지 표시 (line-clamp-2) */}
                                    {/* min-h-[2.5em]을 주어 1줄이어도 높이를 유지하게 하면 카드 높이가 들쑥날쑥해지는 걸 방지할 수 있습니다. */}
                                    <p className="text-[13px] text-[#86868b] mb-1 line-clamp-2 leading-tight min-h-[2.4em]" title={book.author}>
                                        {book.author}
                                    </p>
                                    
                                    {/* ISBN */}
                                    <p className="text-[10px] text-gray-300 font-medium tracking-tight mb-3 font-mono mt-auto">
                                        {book.isbn || book.isbn10 || ""}
                                    </p>

                                    {/* 하단 정보 (상태 / 리뷰 / 별점) */}
                                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between mt-auto">
                                        {/* 왼쪽: 상태 뱃지 */}
                                        <BadgeByStatus status={book.status} />

                                        {/* 오른쪽: 리뷰 유무 & 별점 */}
                                        <div className="flex items-center gap-3">
                                            
                                            {/* [NEW] 리뷰 유무 아이콘 (On/Off) */}
                                            <div className="flex items-center" title={book.short_review ? "리뷰 있음" : "리뷰 없음"}>
                                                <MessageSquare
                                                    size={14} 
                                                    // 리뷰가 있으면: 파란색 + 채우기 / 없으면: 연한 회색 + 빈 아이콘
                                                    className={book.short_review ? "text-blue-500" : "text-gray-300"} 
                                                    fill={book.short_review ? "currentColor" : "none"}
                                                />
                                            </div>

                                            {/* 별점 */}
                                            <div className="flex items-center gap-1">
                                                <Star 
                                                    size={12} 
                                                    fill={book.rating && book.rating > 0 ? "#FFCC00" : "#E5E5E7"} 
                                                    className={book.rating && book.rating > 0 ? "text-[#FFCC00]" : "text-[#E5E5E7]"} 
                                                />
                                                <span className="text-[12px] font-medium text-[#1d1d1f]">
                                                    {book.rating ? book.rating.toFixed(1) : '0.0'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    </main>
                </div>

                {/* 데이터가 없을 때 표시 (로딩 중이 아닐 때만) */}
                {!isLoading && filteredBooks.length === 0 && (
                    <div className="py-20 text-center text-gray-400 flex flex-col items-center">
                        <BookOpen size={40} className="mb-3 opacity-20" />
                        <p>'{menuItems.find(m => m.code === activeTab)?.label}' 목록에 도서가 없습니다.</p>
                    </div>
                )}
            </Container>

            <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {selectedBook && <BookDetailForm initialData={selectedBook} onClose={() => setIsModalOpen(false)} />}
            </Dialog>
        </div>
    );
}

function BadgeByStatus({ status }: { status?: string }) {
    const s = status?.toUpperCase();
    
    let styles = "bg-gray-100 text-gray-500";
    let text = "읽고 싶은";

    if (s === 'READING') {
        styles = "bg-blue-50 text-blue-600";
        text = "읽는 중";
    } else if (s === 'COMPLETED') {
        styles = "bg-green-50 text-green-600";
        text = "완독";
    } else if (s === 'STOPPED') {
        styles = "bg-gray-100 text-red-500";
        text = "중단";
    } else if (s === 'WISH') {
        styles = "bg-gray-100 text-gray-600 border border-gray-200"; // 읽고 싶은 상태 스타일
        text = "읽고 싶은";
    }

    return (
        <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${styles}`}>
            {text}
        </span>
    );
}