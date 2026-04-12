// 경로: frontend/src/app/(main)/library/LibraryClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { 
    Star, Search, BookOpen, MoreVertical, 
    Trash2, Edit, MessageSquare,
    Home, ChevronRight, Plus, PenTool 
} from 'lucide-react';

import BookDetailForm from './BookDetailForm';
import { Button } from "@/components/ui/button";
import AddBookModal from '@/components/AddBookModal';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { BookItemCard } from '@/components/common/BookItemCard';
import StandardContainer from '@/components/layout/StandardContainer'; // 💡 공통 컨테이너 Import

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; 

export default function LibraryClient({ initialBooks, user }: { initialBooks: any[], user: any }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    
    const [activeTab, setActiveTab] = useState('ALL');
    const [books, setBooks] = useState<any[]>(initialBooks); 
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddBookOpen, setIsAddBookOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<any>(null);

    const menuItems = [
        { label: '전체 도서', code: 'ALL' },
        { label: '읽기 전', code: 'UNREAD' },
        { label: '읽는 중', code: 'READING' },
        { label: '완독', code: 'COMPLETED' },
    ];

    useEffect(() => {
        setMounted(true);
        if (user?.email) {
            fetchLibrarySilently();
        }
    }, [user?.email]);

    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              book.author.toLowerCase().includes(searchTerm.toLowerCase());
                              
        if (activeTab === 'ALL') {
            return book.status !== 'WISH' && matchesSearch;
        }
        if (activeTab === 'COMPLETED') {
            return (book.status === 'COMPLETED' || book.status === 'FINISHED') && matchesSearch;
        }
        return book.status === activeTab && matchesSearch;
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
            const res = await fetch(`${API_URL}/api/users/${user.email}/records`);
            if (res.ok) setBooks(await res.json()); 
        } catch (error) {
            console.error("Failed to fetch library", error);
        }
    };

    const handleDeleteBook = async (e: React.MouseEvent, libraryId: number) => {
        e.stopPropagation();
        if (!confirm("정말로 이 책을 서재에서 삭제하시겠습니까? 기록도 함께 삭제됩니다.")) return;

        try {
            const res = await fetch(`${API_URL}/api/library/${libraryId}`, { method: 'DELETE' });
            if (res.ok) {
                setBooks(prev => prev.filter(b => b.library_id !== libraryId));
                toast.success("책이 삭제되었습니다.");
            }
        } catch (error) {
            toast.error("삭제 중 오류가 발생했습니다.");
        }
    };

    if (!mounted) return <div className="w-full h-full bg-[var(--bg-main)]" />;

    return (
        // 💡 [핵심] 기존의 flex-none, overflow-y-auto 등의 하드코딩 껍데기를 모두 삭제하고
        // StandardContainer 하나로 모든 레이아웃과 간격을 통제합니다.
        <StandardContainer size="wide" className="pt-8 relative pb-32 min-h-screen">
            
            {/* 1. 상단 브레드크럼 */}
            <div className="flex items-center gap-2 text-[12px] md:text-[13px] text-[#A0AABF] font-medium mb-2">
                <Link href="/" className="flex items-center gap-1 hover:text-[#1D2433] transition-colors">
                    <Home size={14} /> <span>홈</span>
                </Link>
                <ChevronRight size={14} />
                <span className="font-bold text-[#1D2433]">내 서재</span>
            </div>

            {/* 2. 타이틀 영역 */}
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-[24px] md:text-[28px] font-black text-[#1D2433] tracking-tight flex items-center gap-2">
                    {menuItems.find(m => m.code === activeTab)?.label}
                    <span className="text-[#0066cc]">
                        {activeTab === 'ALL' 
                            ? books.filter(b => b.status !== 'WISH').length 
                            : activeTab === 'COMPLETED'
                                ? books.filter(b => b.status === 'COMPLETED' || b.status === 'FINISHED').length
                                : books.filter(b => b.status === activeTab).length}
                    </span>
                </h1>
            </div>

            {/* 3. 탭 네비게이션 */}
            <div className="border-b border-[#E7E2D9] mb-6">
                <nav className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide">
                    {menuItems.map((item) => (
                        <button
                            key={item.code} 
                            onClick={() => setActiveTab(item.code)}
                            className={`pb-3 text-[14px] md:text-[15px] font-medium whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                                activeTab === item.code 
                                ? 'border-[#1F3A5F] text-[#1F3A5F] font-bold' 
                                : 'border-transparent text-[#A0AABF] hover:text-[#1D2433]'
                            }`}
                        >
                            {item.label}
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === item.code ? 'bg-blue-50 text-[#0066cc]' : 'bg-[#F7F5F1] text-[#A0AABF]'}`}>
                                {item.code === 'ALL' 
                                    ? books.filter(b => b.status !== 'WISH').length 
                                    : item.code === 'COMPLETED'
                                        ? books.filter(b => b.status === 'COMPLETED' || b.status === 'FINISHED').length
                                        : books.filter(b => b.status === item.code).length}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* 4. 검색 필터 */}
            <div className="flex flex-col md:flex-row items-center justify-end gap-2 md:gap-3 mb-6">
                <div className="relative w-full md:w-[260px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AABF]" size={16} />
                    <input 
                        type="text" 
                        placeholder="책, 저자 검색..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-[#E7E2D9] rounded-full text-[13px] outline-none focus:border-[#1F3A5F] transition-colors shadow-sm"
                    />
                </div>
            </div>

            {/* 5. 도서 그리드 (Wide 컨테이너 규격에 맞춰 5열 반응형) */}
            {filteredBooks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {filteredBooks.map((book, index) => (
                        <div key={book.library_id || index} className="relative h-full group/lib">
                            
                            {/* 드롭다운 메뉴 (앱솔루트 포지셔닝 유지) */}
                            <div className="absolute top-3 right-3 z-20 opacity-0 group-hover/lib:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button 
                                            variant="secondary" 
                                            size="icon" 
                                            className="h-7 w-7 rounded-full bg-white/90 shadow-sm hover:bg-white focus:outline-none" 
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreVertical size={14} className="text-gray-500" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    
                                    <DropdownMenuContent align="end" className="w-44" onCloseAutoFocus={(e) => e.preventDefault()}>
                                        <DropdownMenuItem onClick={(e) => openEditModal(e, book)}>
                                            <Edit size={14} className="mr-2" /> 상태 변경
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => handleDeleteBook(e, book.library_id)}>
                                            <Trash2 size={14} className="mr-2" /> 서재에서 삭제
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* BookItemCard 컴포넌트 호출 */}
                            <BookItemCard 
                                onClick={() => handleBookClick(book)}
                                cover={book.cover}
                                title={book.title}
                                author={book.author}
                                footerLeft={<BadgeByStatus status={book.status} />}
                                footerRight={
                                    <div className="flex items-center gap-2">
                                        {book.short_review && (<span title="한줄평 작성됨" className="flex items-center"><MessageSquare size={12} className="text-[#0066cc]/50" /></span>)}
                                        {book.has_long_review && (<span title="긴줄평 작성됨" className="flex items-center"><PenTool size={12} className="text-emerald-500/80" /></span>)}
                                        {book.rating > 0 && (
                                            <div className="flex items-center gap-0.5 text-amber-400" title="별점">
                                                <Star size={10} fill="currentColor" />
                                                <span className="text-[10px] font-bold text-gray-500 pt-[1px]">{book.rating}</span>
                                            </div>
                                        )}
                                    </div>
                                }
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-gray-400 bg-white rounded-3xl border border-dashed border-[#E7E2D9] mt-4">
                    <BookOpen size={40} strokeWidth={1.5} className="mb-3 opacity-30 text-[#1F3A5F]" />
                    <p className="font-bold text-[14px] text-gray-500">조건에 맞는 도서가 없습니다.</p>
                </div>
            )}
            
            {/* 우측 하단 플로팅 도서 추가 버튼 */}
            <button onClick={() => setIsAddBookOpen(true)} className="fixed bottom-8 right-8 w-14 h-14 bg-[#1d1d1f] hover:bg-[#1F3A5F] text-white rounded-full shadow-[0_8px_30px_rgba(29,36,51,0.3)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-40">
                <Plus size={24} />
            </button>

            {/* 모달 영역 */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[28px] border-none shadow-2xl">
                    <DialogTitle className="sr-only">독서 상태 변경</DialogTitle>
                    {selectedBook && (
                        <BookDetailForm 
                            initialData={selectedBook} 
                            onClose={() => setIsEditModalOpen(false)} 
                            onSaved={(updatedData) => {
                                setBooks(prev => prev.map(book => 
                                    book.library_id === (selectedBook.library_id || selectedBook.id) ? { ...book, ...updatedData } : book
                                ));
                                setIsEditModalOpen(false);
                                setTimeout(() => {
                                    toast.success("독서 기록이 최신 상태로 업데이트되었습니다!");
                                }, 800);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {isAddBookOpen && (
                <AddBookModal isOpen={isAddBookOpen} onClose={() => { setIsAddBookOpen(false); fetchLibrarySilently(); }} userEmail={user?.email} />
            )}
        </StandardContainer>
    );
}

// 뱃지 컴포넌트
function BadgeByStatus({ status }: { status: string }) {
    switch (status) {
        case 'UNREAD':
            return <Badge className="bg-violet-50 text-violet-600 hover:bg-violet-50 border-0 h-5 px-1.5 text-[10px] font-bold shadow-none">읽기 전</Badge>;
        case 'READING':
            return <Badge className="bg-blue-50 text-[#0066cc] hover:bg-blue-50 border-0 h-5 px-1.5 text-[10px] font-bold shadow-none">읽는 중</Badge>;
        case 'FINISHED':
        case 'COMPLETED': 
            return <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-0 h-5 px-1.5 text-[10px] font-bold shadow-none">완독</Badge>;
        case 'WISH':
            return <Badge className="bg-rose-50 text-rose-500 hover:bg-rose-50 border-0 h-5 px-1.5 text-[10px] font-bold shadow-none">읽고 싶음</Badge>;
        default:
            return <Badge variant="outline" className="text-gray-400 border-[#E7E2D9] h-5 px-1.5 text-[10px] shadow-none">{status}</Badge>;
    }
}