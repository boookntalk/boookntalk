'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { 
    Star, Search, BookOpen, MoreVertical, 
    Share2, Plus, Trash2, Edit, MessageSquare
} from 'lucide-react';

import { DESIGN_TOKEN } from '@/constants/styles';
import BookDetailForm from './BookDetailForm'; // 수정 모달 컴포넌트
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

const API_URL = "http://localhost:8000"; // 실제 환경변수로 교체 권장

export default function LibraryClient({ initialBooks, user }: { initialBooks: any[], user: any }) {
    const router = useRouter();

    // 상태 관리
    const [activeTab, setActiveTab] = useState('ALL');
    const [books, setBooks] = useState<any[]>(initialBooks); 
    const [isLoading, setIsLoading] = useState(false);
    
    // 모달 상태
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddBookOpen, setIsAddBookOpen] = useState(false);
    
    // 선택된 책 (수정/삭제용)
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // 탭 메뉴 정의
    const menuItems = [
        { label: '전체', code: 'ALL' },
        { label: '읽는 중', code: 'READING' },
        { label: '읽고 싶음', code: 'WISH' },
        { label: '완독', code: 'COMPLETED' },
    ];

    // 필터링 로직
    const filteredBooks = books.filter(book => {
        const matchesTab = activeTab === 'ALL' || book.status === activeTab;
        const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              book.author.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    // [핸들러] 카드 클릭 -> 상세 페이지 이동
    const handleBookClick = (book: any) => {
        if (book.library_id) {
            router.push(`/library/${book.library_id}`);
        }
    };

    // [핸들러] 수정 모달 열기 (이벤트 전파 중단)
    const openEditModal = (e: React.MouseEvent, book: any) => {
        e.stopPropagation(); // 부모(카드) 클릭 이벤트 실행 방지
        setSelectedBook(book);
        setIsEditModalOpen(true);
    };

    // [핸들러] 책 삭제
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
        <div className="w-full h-full flex flex-col bg-[#F5F5F7]">
            {/* 1. Header & Search */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
                <Container className="h-16 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#1d1d1f]">내 서재</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="책 검색..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm w-48 focus:w-64 transition-all focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </Container>
            </header>

            {/* 2. Main Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                <Container className="py-8 pb-24">        
                    {/* 탭 메뉴 */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                        {menuItems.map((item) => (
                            <button
                                key={item.code}
                                onClick={() => setActiveTab(item.code)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                    activeTab === item.code 
                                    ? 'bg-[#1d1d1f] text-white shadow-md' 
                                    : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* 도서 그리드 */}
                    <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                        <main className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                            {filteredBooks.map((book, index) => (
                                <div 
                                    key={book.library_id || index} 
                                    onClick={() => handleBookClick(book)} 
                                    className="group cursor-pointer relative"
                                >
                                    {/* 카드 본문 */}
                                    <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] group-hover:-translate-y-1 h-full flex flex-col relative">
                                        
                                        {/* [복구됨] 점 3개 메뉴 버튼 (Hover 시 등장) */}
                                        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        variant="secondary" 
                                                        size="icon" 
                                                        className="h-8 w-8 rounded-full bg-white/90 shadow-sm hover:bg-white"
                                                        onClick={(e) => e.stopPropagation()} // 중요: 카드 클릭 방지
                                                    >
                                                        <MoreVertical size={16} className="text-gray-600" />
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
                                            <p className="text-[13px] text-[#86868b] mb-4 line-clamp-1">{book.author}</p>
                                            
                                            <div className="mt-auto flex items-center justify-between">
                                                <BadgeByStatus status={book.status} /> 
                                                
                                                <div className="flex items-center gap-2"> {/* gap 추가 */}
                                                    {/* ✨ 리뷰 아이콘 추가: short_review가 비어있지 않을 때만 표시 */}
                                                    {book.short_review && book.short_review.trim().length > 0 && (
                                                        <div className="flex items-center text-blue-500" title="리뷰 작성됨">
                                                            <MessageSquare size={14} fill="currentColor" className="opacity-80" />
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-1 text-yellow-500">
                                                        <Star size={12} fill="currentColor" />
                                                        <span className="text-xs font-bold pt-0.5">{book.rating || 0}</span>
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
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <BookOpen size={48} strokeWidth={1} className="mb-4 opacity-50" />
                            <p>해당하는 도서가 없습니다.</p>
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

            {/* 모달 1: 상태 변경/수정 (BookDetailForm) */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[550px] p-6 max-h-[90vh] overflow-y-auto">
                    {selectedBook && (
                        <BookDetailForm 
                            initialData={selectedBook} 
                            onClose={() => {
                                setIsEditModalOpen(false);
                                // 수정 후 목록 새로고침 로직이 필요하다면 여기에 추가 (예: router.refresh())
                                window.location.reload(); // 임시: 간단한 새로고침
                            }} 
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* 모달 2: 도서 추가 */}
            {isAddBookOpen && (
                <AddBookModal 
                    isOpen={isAddBookOpen} 
                    onClose={() => {
                        setIsAddBookOpen(false);
                        window.location.reload();
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