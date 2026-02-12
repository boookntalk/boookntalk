'use client';

import React, { useState, useEffect } from 'react';
import { Star, Search, BookOpen, MessageSquare, MoreVertical, Share2, ChevronRight, Home } from 'lucide-react'; 
import { DESIGN_TOKEN } from '@/constants/styles';
import BookDetailForm from './BookDetailForm';
import BookDetailView from './BookDetailView';
import Container from '@/components/layout/Container'; 
import Image from 'next/image';

// shadcn/ui 컴포넌트
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; // 버튼 컴포넌트 추가

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
    current_page?: number;
    total_page?: number;
}

export default function LibraryClient({ initialBooks, user }: { initialBooks: any[], user: any }) {
    // 1. 상태 관리
    const [activeTab, setActiveTab] = useState('ALL'); 
    const [books, setBooks] = useState<Book[]>(initialBooks); 
    const [isLoading, setIsLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);     
    const [isDetailOpen, setIsDetailOpen] = useState(false);   
    
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const menuItems = [
        { label: "전체 도서", code: "ALL" },
        { label: "읽고 싶은", code: "WISH" },
        { label: "읽는 중", code: "READING" },
        { label: "완독", code: "COMPLETED" },
        { label: "리뷰", code: "REVIEW" },   
        { label: "중단", code: "STOPPED" },  
    ];

    const fetchBooks = async (status: string) => {
        if (!user?.email) return;
        
        setIsLoading(true); 
        try {
            const response = await fetch(`http://localhost:8000/api/users/${user.email}/records?status=${status}`, {
                cache: 'no-store', 
            });
            
            if (response.ok) {
                const data = await response.json();
                setBooks(data);
            }
        } catch (error) {
            console.error("Error fetching books:", error);
        } finally {
            setIsLoading(false);
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

    const openEditModal = (book: any) => {
        setSelectedBook(book);
        setIsModalOpen(true);
    };

    const openDetailView = (book: any) => {
        setSelectedBook(book);
        setIsDetailOpen(true);
    };

    // 현재 탭 이름 찾기
    const currentTabLabel = menuItems.find(item => item.code === activeTab)?.label || "전체 도서";

    return (
        // [구조 변경] 전체를 Flex Column으로 만들고 높이 100%
        <div className="w-full h-full flex flex-col">
            
            {/* [1. 헤더 영역] flex-none: 크기가 줄어들거나 스크롤되지 않음 (고정됨) */}
            <div className="flex-none bg-white border-b z-40"> 
                <Container className="py-4">
                    <header className="flex flex-col md:flex-row justify-between items-center gap-4">
                        {/* ... (헤더 내부 내용은 기존과 100% 동일) ... */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 w-full md:w-auto">
                            <div className="flex items-center gap-1 hover:text-gray-900 transition-colors cursor-pointer">
                                <Home size={14} />
                                <span>서재 홈</span>
                            </div>
                            <ChevronRight size={14} className="text-gray-300" />
                            <span className="font-semibold text-gray-900">{currentTabLabel}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative group flex-1 md:w-64">
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-[#1d1d1f] focus-within:ring-1 focus-within:ring-[#1d1d1f]/10 transition-all duration-300">
                                    <Search size={16} className="text-gray-400 group-focus-within:text-[#1d1d1f]" />
                                    <input 
                                        type="text" 
                                        placeholder="도서명, 저자 검색"
                                        className="bg-transparent border-none outline-none text-[13px] w-full placeholder:text-gray-400 text-[#1d1d1f]"
                                        value={searchTerm} 
                                        onChange={(e) => setSearchTerm(e.target.value)} 
                                    />
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="gap-2 text-gray-600 border-gray-200 hover:bg-gray-50 h-[38px]">
                                <Share2 size={14} />
                                <span className="hidden sm:inline">공유</span>
                            </Button>
                        </div>
                    </header>
                </Container>
            </div>

            {/* [2. 스크롤 영역] flex-1: 남은 공간을 다 차지함 + overflow-y-auto: 여기만 스크롤 됨 */}
            {/* 기존의 pt-[85px] 같은 패딩은 이제 필요 없습니다! 구조적으로 분리했으니까요. */}
            <div className="flex-1 overflow-y-auto bg-[#F5F5F7]">
                <Container className="py-8 pb-20">        
                    
                    {/* 탭 네비게이션 */}
                    <nav className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.code}
                                onClick={() => setActiveTab(item.code)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                                    activeTab === item.code 
                                    ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-md' 
                                    : 'bg-white text-[#86868b] border-gray-200 hover:bg-gray-50 hover:text-[#1d1d1f]'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* 메인 리스트 */}
                    <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredBooks.map((book, index) => (
                                // ... (카드 내부 코드는 기존과 완벽히 동일) ...
                                <div key={book.library_id || book.id || `idx-${index}`} onClick={() => openDetailView(book)} className="group cursor-pointer">
                                     <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] group-hover:-translate-y-1 h-full flex flex-col relative">
                                        {/* ... 카드 상세 내용 ... */}
                                        <div className="relative aspect-[1/1.4] rounded-lg mb-4 w-[65%] mx-auto overflow-visible shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-all duration-300 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] group-hover:-translate-y-1">
                                            {book.cover ? (
                                                <Image src={book.cover} alt={book.title} fill className="object-cover rounded-lg" />
                                            ) : ( <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded-lg">No Cover</div> )}
                                        </div>
                                        <div className="text-left px-1 flex flex-col flex-grow">
                                            <h3 className="font-bold text-[#1d1d1f] text-[16px] mb-1 line-clamp-1">{book.title}</h3>
                                            <p className="text-[13px] text-[#86868b] mb-4 line-clamp-1">{book.author}</p>
                                            <div className="pt-3 border-t border-gray-50 flex items-center justify-between mt-auto">
                                                <BadgeByStatus status={book.status} />
                                                <div className="flex items-center gap-1">
                                                    <Star size={14} fill={book.rating && book.rating > 0 ? "#FFCC00" : "#E5E5E7"} className={book.rating && book.rating > 0 ? "text-[#FFCC00]" : "text-[#E5E5E7]"} />
                                                    <span className="text-[13px] font-bold text-[#1d1d1f] pt-0.5">{book.rating ? book.rating.toFixed(1) : '0.0'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </main>
                    </div>

                    {!isLoading && filteredBooks.length === 0 && (
                        <div className="py-20 text-center text-gray-400 flex flex-col items-center">
                            <BookOpen size={40} className="mb-3 opacity-20" />
                            <p>'{currentTabLabel}' 목록에 도서가 없습니다.</p>
                        </div>
                    )}
                </Container>
            </div>

            {/* 모달 및 시트 등 나머지 컴포넌트 */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[550px] p-6 max-h-[90vh] overflow-y-auto">
                    {/* ... */}
                    {selectedBook && <BookDetailForm initialData={selectedBook} onClose={() => setIsModalOpen(false)} />}
                </DialogContent>
            </Dialog>
            <BookDetailView book={selectedBook} open={isDetailOpen} onOpenChange={setIsDetailOpen} />
        </div>
    );
}

// 뱃지 컴포넌트
function BadgeByStatus({ status }: { status?: string }) {
    const s = status?.toUpperCase();
    let styles = "bg-gray-100 text-gray-500";
    let text = "읽고 싶은";

    if (s === 'READING') {
        styles = "bg-blue-50 text-blue-600";
        text = "읽는 중";
    } else if (s === 'COMPLETED') {
        styles = "bg-purple-50 text-purple-600";
        text = "완독";
    } else if (s === 'STOPPED') {
        styles = "bg-red-50 text-red-500";
        text = "중단";
    }

    return (
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${styles}`}>
            {text}
        </span>
    );
}