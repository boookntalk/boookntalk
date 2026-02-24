'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { 
    Star, Search, BookOpen, MoreVertical, 
    Share2, Plus, Trash2, Edit, MessageSquare,
    Home, ChevronRight // [NEW] Breadcrumb용 아이콘 추가
} from 'lucide-react';

import { DESIGN_TOKEN } from '@/constants/styles';
import BookDetailForm from './BookDetailForm';
import Container from '@/components/layout/Container'; 
import { Button } from "@/components/ui/button";
import AddBookModal from '@/components/AddBookModal';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// ---- [타입 정의] ----
interface Book {
    library_id?: number;
    id: number;
    title: string;
    author: string;
    cover: string;
    status: string; // READING, COMPLETED, WISH
    rating: number;
    added_at: string;
    publisher?: string;
}

const API_URL = "http://localhost:8000"; 

const formatCardAuthor = (authorStr: string) => {
    if (!authorStr) return "저자 미상";

    return authorStr
        .replace(/\)\s*,\s*/g, ') ; ')
        .replace(/\(지은이\)/g, '지음')
        .replace(/\(저자\)/g, '지음')
        .replace(/\(글\)/g, '글')
        .replace(/\(옮긴이\)/g, '옮김')
        .replace(/\(역자\)/g, '옮김')
        .replace(/\(번역\)/g, '옮김')
        .replace(/\(그림\)/g, '그림')
        .replace(/\(삽화\)/g, '그림')
        .replace(/\(엮은이\)/g, '엮음')
        .replace(/\(편저\)/g, '엮음')
        .replace(/\(감수\)/g, '감수')
        .replace(/\(author\)/gi, '지음')
        .replace(/\(writer\)/gi, '지음')
        .replace(/\(translator\)/gi, '옮김')
        .replace(/\(illustrator\)/gi, '그림')
        .replace(/\(editor\)/gi, '엮음')
        .replace(/[()]/g, '')
        .trim();
};

export default function LibraryClient({ initialBooks, user }: { initialBooks: any[], user: any }) {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('ALL');
    const [books, setBooks] = useState<any[]>(initialBooks); 
    const [isLoading, setIsLoading] = useState(false);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddBookOpen, setIsAddBookOpen] = useState(false);
    
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const menuItems = [
        { label: '전체', code: 'ALL' },
        { label: '읽는 중', code: 'READING' },
        { label: '읽고 싶음', code: 'WISH' },
        { label: '완독', code: 'COMPLETED' },
    ];

    const filteredBooks = books.filter(book => {
        const matchesTab = activeTab === 'ALL' || book.status === activeTab;
        const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              book.author.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const handleBookClick = (book: any) => {
        if (book.library_id) {
            router.push(`/library/${book.library_id}`);
        }
    };

    const openEditModal = (e: React.MouseEvent, book: any) => {
        e.stopPropagation(); 
        setSelectedBook(book);
        setIsEditModalOpen(true);
    };

    const fetchLibrarySilently = async () => {
        if (!user?.email) return;
        try {
            const res = await fetch(`http://localhost:8000/api/my-library/${user.email}`);
            if (res.ok) {
                const data = await res.json();
                setBooks(data); 
            }
        } catch (error) {
            console.error("Failed to fetch library", error);
        }
    };

    const handleDeleteBook = async (e: React.MouseEvent, libraryId: number) => {
        e.stopPropagation();
        if (!confirm("정말로 이 책을 서재에서 삭제하시겠습니까? 기록도 함께 삭제됩니다.")) return;

        try {
            const res = await fetch(`${API_URL}/api/library/${libraryId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setBooks(prev => prev.filter(b => b.library_id !== libraryId));
            } else {
                alert("삭제 실패");
            }
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    return (
        // [수정] 불필요한 ml-64 마진을 제거하고, 기존의 전체 꽉 찬 레이아웃으로 복구
        <div className="w-full h-full flex flex-col bg-[#F5F5F7]">
            
            {/* ▼▼▼ [해결 1] 절대 움직이지 않는 상단 고정 영역 (flex-none) ▼▼▼ */}
            <div className="flex-none bg-[#F5F5F7]/90 backdrop-blur-md z-30 pt-8 border-b border-gray-200">
                <Container>
                    {/* 1. 이동 경로(Breadcrumb) & 검색바 영역 */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 py-2.5 text-[13px] font-bold text-gray-400">
                            <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                                <Home size={15} />
                                <span>홈</span>
                            </Link>
                            <ChevronRight size={14} className="opacity-50" />
                            <span className="text-[#1d1d1f]">내 서재</span>
                        </div>

                        {/* 우측 검색바 */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="책, 저자 검색..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-[14px] w-56 focus:w-72 transition-all duration-300 focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] shadow-sm"
                            />
                        </div>
                    </div>

                    {/* 2. 상태 필터 탭 */}
                    {/* 탭 자체의 하단 보더를 없애고, 부모 요소(flex-none)의 하단 보더에 딱 붙입니다 */}
                    <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide -mb-[1px]">
                        {menuItems.map((item) => (
                            <button
                                key={item.code}
                                onClick={() => setActiveTab(item.code)}
                                className={`pb-3 text-[15px] font-bold transition-colors border-b-[3px] whitespace-nowrap ${
                                    activeTab === item.code 
                                    ? 'text-[#0066cc] border-[#0066cc]' 
                                    : 'text-gray-400 hover:text-[#1d1d1f] border-transparent'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </Container>
            </div>
            {/* ▲▲▲ 상단 고정 영역 끝 ▲▲▲ */}

            {/* ▼▼▼ [해결 2] 카드들만 스크롤되는 영역 (flex-1 + overflow-y-auto) ▼▼▼ */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                <Container className="pt-8 pb-32">
                    {/* 3. 도서 그리드 렌더링 영역 */}
                    <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                        <main className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                            {filteredBooks.map((book, index) => (
                                <div 
                                    key={book.library_id || index} 
                                    onClick={() => handleBookClick(book)} 
                                    className="group cursor-pointer relative"
                                >
                                    <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] group-hover:-translate-y-1 h-full flex flex-col relative">
                                        
                                        {/* 점 3개 메뉴 버튼 */}
                                        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        variant="secondary" 
                                                        size="icon" 
                                                        className="h-8 w-8 rounded-full bg-white/1 backdrop-blur-sm shadow-sm hover:bg-white/70 transition-colors"
                                                        onClick={(e) => e.stopPropagation()} 
                                                    >
                                                        <MoreVertical size={16} className="text-red-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem onClick={(e) => openEditModal(e, book)}>
                                                        <Edit size={14} className="mr-2" /> 상태 변경
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={(e) => handleDeleteBook(e, book.library_id)}
                                                    >
                                                        <Trash2 size={14} className="mr-2" /> 삭제
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* 책 표지 */}
                                        <div className="relative aspect-[1/1.4] rounded-lg mb-4 w-[70%] mx-auto shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-all duration-300 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] group-hover:-translate-y-1">
                                            {book.cover ? (
                                                <Image src={book.cover} alt={book.title} fill className="object-cover rounded-lg" unoptimized />
                                            ) : ( 
                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded-lg">No Cover</div> 
                                            )}
                                        </div>

                                        {/* 책 정보 */}
                                        <div className="mt-3 px-1">
                                            <h3 className="font-bold text-[#1d1d1f] text-[16px] mb-1 line-clamp-1">{book.title}</h3>
                                            <p className="text-[13px] text-[#86868b] mb-4 line-clamp-1">
                                                {formatCardAuthor(book.author)}
                                            </p>
                                            <div className="mt-auto flex items-center justify-between">
                                                <BadgeByStatus status={book.status} /> 
                                                <div className="flex items-center gap-2">
                                                    {book.short_review && book.short_review.trim().length > 0 && (
                                                        <div className="flex items-center text-[#0066cc]" title="한줄평 작성됨">
                                                            <MessageSquare size={14} fill="currentColor" className="opacity-80" />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1 text-[#FFCC00]">
                                                        <Star size={12} fill="currentColor" />
                                                        <span className="text-xs font-bold pt-0.5 text-gray-600">{book.rating || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </main>
                    </div>

                    {/* Empty State */}
                    {filteredBooks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                            <BookOpen size={48} strokeWidth={1} className="mb-4 opacity-30" />
                            <p className="font-medium text-[15px]">해당하는 도서가 없습니다.</p>
                        </div>
                    )}
                </Container>
            </div>
            
            {/* FAB: 도서 추가 버튼 */}
            <button 
                onClick={() => setIsAddBookOpen(true)}
                className="fixed bottom-8 right-8 w-14 h-14 bg-[#1d1d1f] hover:bg-black text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40"
            >
                <Plus size={24} />
            </button>

            {/* 모달 영역들... */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[550px] p-6 max-h-[90vh] overflow-y-auto">
                    {selectedBook && (
                        <BookDetailForm 
                            initialData={selectedBook} 
                            onClose={() => setIsEditModalOpen(false)} 
                            onSaved={(updatedData) => {
                                setBooks(prev => prev.map(book => 
                                    book.library_id === (selectedBook.library_id || selectedBook.id)
                                        ? { ...book, ...updatedData } 
                                        : book
                                ));
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {isAddBookOpen && (
                <AddBookModal 
                    isOpen={isAddBookOpen} 
                    onClose={() => {
                        setIsAddBookOpen(false);
                        fetchLibrarySilently(); 
                    }}
                    userEmail={user?.email} 
                />
            )}
        </div>
    );
}

// 상태 뱃지 컴포넌트
function BadgeByStatus({ status }: { status: string }) {
    switch (status) {
        case 'READING':
            return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-0 h-6 px-2 text-[10px]">읽는 중</Badge>;
        case 'COMPLETED':
            return <Badge className="bg-green-50 text-green-600 hover:bg-green-100 border-0 h-6 px-2 text-[10px]">완독</Badge>;
        case 'WISH':
            return <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-200 border-0 h-6 px-2 text-[10px]">읽고 싶음</Badge>;
        default:
            return <Badge variant="outline" className="text-gray-400 border-gray-200 h-6 px-2 text-[10px]">{status}</Badge>;
    }
}