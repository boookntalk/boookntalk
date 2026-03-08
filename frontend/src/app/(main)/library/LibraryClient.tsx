'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

import { 
    Star, Search, BookOpen, MoreVertical, 
    Trash2, Edit, MessageSquare,
    Home, ChevronRight, Plus, Loader2
} from 'lucide-react';

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; 

// 저자 포맷팅 함수 (기존 유지)
const formatCardAuthor = (authorStr: string) => {
    if (!authorStr) return "저자 미상";
    return authorStr
        .replace(/\(지은이\)/g, '지음').replace(/\(저자\)/g, '지음')
        .replace(/\(옮긴이\)/g, '옮김').replace(/\(역자\)/g, '옮김')
        .replace(/[()]/g, '').trim();
};

export default function LibraryClient({ initialBooks, user }: { initialBooks: any[], user: any }) {
    const router = useRouter();

    // --- [해결 1] Hydration Mismatch 방지 ---
    // 서버와 클라이언트의 초기 HTML ID(Radix UI 관련)가 일치하지 않는 문제를 해결합니다.
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

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
        if (book.library_id) router.push(`/library/${book.library_id}`);
    };

    const openEditModal = (e: React.MouseEvent, book: any) => {
        e.stopPropagation(); 
        setSelectedBook(book);
        setIsEditModalOpen(true);
    };

    const fetchLibrarySilently = async () => {
        if (!user?.email) return;
        try {
            const res = await fetch(`${API_URL}/api/my-library/${user.email}`);
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
                toast.success("책이 삭제되었습니다.");
            }
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    // 마운트 전에는 레이아웃 구조만 렌더링하여 Hydration 오류 차단
    if (!mounted) return <div className="w-full h-full bg-[#F5F5F7]" />;

    return (
        <div className="w-full h-full flex flex-col bg-[#F5F5F7]">
            
            {/* 상단 고정 영역 */}
            <div className="flex-none bg-[#F5F5F7]/90 backdrop-blur-md z-30 pt-8 border-b border-gray-200">
                <Container>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 py-2.5 text-[13px] font-bold text-gray-400">
                            <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                                <Home size={15} />
                                <span>홈</span>
                            </Link>
                            <ChevronRight size={14} className="opacity-50" />
                            <span className="text-[#1d1d1f]">내 서재</span>
                        </div>

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

            {/* 카드 리스트 영역 */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                <Container className="pt-8 pb-32">
                    <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                        <main className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                            {filteredBooks.map((book, index) => (
                                <div 
                                    key={book.library_id || index} 
                                    onClick={() => handleBookClick(book)} 
                                    className="group cursor-pointer relative"
                                >
                                    <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] group-hover:-translate-y-1 h-full flex flex-col relative">
                                        
                                        {/* 드롭다운 메뉴 */}
                                        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        variant="secondary" 
                                                        size="icon" 
                                                        className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
                                                        onClick={(e) => e.stopPropagation()} 
                                                    >
                                                        <MoreVertical size={16} className="text-gray-500" />
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
                                        <div className="relative aspect-[1/1.4] rounded-lg mb-4 w-[85%] mx-auto shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-all duration-300 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] group-hover:-translate-y-1">
                                            {book.cover ? (
                                                <Image 
                                                    src={book.cover} 
                                                    alt={book.title} 
                                                    fill 
                                                    sizes="(max-width: 768px) 50vw, 20vw"
                                                    className="object-cover rounded-lg" 
                                                    priority={index < 10} // 상단 도서 우선 로딩
                                                />
                                            ) : ( 
                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded-lg">No Cover</div> 
                                            )}
                                        </div>

                                        <div className="mt-3 px-1">
                                            <h3 className="font-bold text-[#1d1d1f] text-[15px] mb-1 line-clamp-1">{book.title}</h3>
                                            <p className="text-[12px] text-[#86868b] mb-4 line-clamp-1">
                                                {formatCardAuthor(book.author)}
                                            </p>
                                            <div className="mt-auto flex items-center justify-between">
                                                <BadgeByStatus status={book.status} /> 
                                                <div className="flex items-center gap-2">
                                                    {book.short_review && (
                                                        <MessageSquare size={13} className="text-blue-500 opacity-70" />
                                                    )}
                                                    <div className="flex items-center gap-1 text-[#FFCC00]">
                                                        <Star size={11} fill="currentColor" />
                                                        <span className="text-[11px] font-bold pt-0.5 text-gray-500">{book.rating || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </main>
                    </div>

                    {filteredBooks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                            <BookOpen size={48} strokeWidth={1} className="mb-4 opacity-30" />
                            <p className="font-medium text-[15px]">해당하는 도서가 없습니다.</p>
                        </div>
                    )}
                </Container>
            </div>
            
            <button 
                onClick={() => setIsAddBookOpen(true)}
                className="fixed bottom-8 right-8 w-14 h-14 bg-[#1d1d1f] hover:bg-black text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40"
            >
                <Plus size={24} />
            </button>

            {/* 모달 로직 */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[28px] border-none shadow-2xl">
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
                                setIsEditModalOpen(false);
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

function BadgeByStatus({ status }: { status: string }) {
    switch (status) {
        case 'READING':
            return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-0 h-5 px-1.5 text-[10px] font-bold">읽는 중</Badge>;
        case 'COMPLETED':
            return <Badge className="bg-green-50 text-green-600 hover:bg-green-50 border-0 h-5 px-1.5 text-[10px] font-bold">완독</Badge>;
        case 'WISH':
            return <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-0 h-5 px-1.5 text-[10px] font-bold">읽고 싶음</Badge>;
        default:
            return <Badge variant="outline" className="text-gray-400 border-gray-200 h-5 px-1.5 text-[10px]">{status}</Badge>;
    }
}