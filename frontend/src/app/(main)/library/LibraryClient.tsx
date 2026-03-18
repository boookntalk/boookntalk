'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
import { formatCardAuthor } from '@/utils/formatters';

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

    // ▼▼▼ [수정 1] 기획자님 의도대로 '읽고 싶음(WISH)' 탭 삭제 ▼▼▼
    const menuItems = [
        { label: '전체 도서', code: 'ALL' },
        { label: '읽는 중', code: 'READING' },
        { label: '완독', code: 'COMPLETED' },
    ];

    useEffect(() => {
        setMounted(true);
        if (user?.email) {
            fetchLibrarySilently();
        }
    }, [user?.email]);

    // ▼▼▼ [수정 2] WISH 데이터가 '전체 도서'에 섞이지 않도록 방어 로직 추가 ▼▼▼
    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              book.author.toLowerCase().includes(searchTerm.toLowerCase());
                              
        // '전체 도서' 탭일 때는 WISH(읽고 싶은 책)를 뺀 진짜 서재 책만 보여줍니다!
        if (activeTab === 'ALL') {
            return book.status !== 'WISH' && matchesSearch;
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

    if (!mounted) return <div className="w-full h-full bg-[#F5F5F7]" />;

    return (
        <div className="w-full h-full flex flex-col bg-[#F5F5F7]">
            <div className="flex-none bg-[#F5F5F7]/90 backdrop-blur-md z-30 pt-4 px-[var(--spacing-1cm,32px)] border-b border-gray-200 sticky top-0 transition-all">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[13px] font-bold text-gray-400">
                        <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                            <Home size={15} /> <span>홈</span>
                        </Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-[#1d1d1f]">내 서재</span>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" placeholder="책, 저자 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-[14px] w-56 focus:w-72 transition-all duration-300 outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide -mb-[1px]">
                    {menuItems.map((item) => (
                        <button
                            key={item.code} onClick={() => setActiveTab(item.code)}
                            className={`pb-2 text-[15px] font-bold transition-all whitespace-nowrap border-b-2 ${
                                activeTab === item.code ? 'text-[#0066cc] border-[#0066cc]' : 'text-gray-400 border-transparent hover:text-[#1d1d1f]'
                            }`}
                        >
                            {item.label}
                            {/* ▼▼▼ [수정 3] ALL 카운트에서도 WISH 개수는 제외하여 정확한 통계 제공 ▼▼▼ */}
                            <span className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === item.code ? 'bg-blue-50 text-[#0066cc]' : 'bg-gray-100 text-gray-400'}`}>
                                {item.code === 'ALL' 
                                    ? books.filter(b => b.status !== 'WISH').length 
                                    : books.filter(b => b.status === item.code).length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="p-[var(--spacing-1cm,32px)] pt-6 pb-32">
                    <main className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
                        {filteredBooks.map((book, index) => (
                            <div key={book.library_id || index} onClick={() => handleBookClick(book)} className="group cursor-pointer flex flex-col h-full bg-white rounded-sm p-4 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative">
                                <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full bg-white/90 shadow-sm hover:bg-white" onClick={(e) => e.stopPropagation()}>
                                                <MoreVertical size={14} className="text-gray-500" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                            <DropdownMenuItem onClick={(e) => openEditModal(e, book)}>
                                                <Edit size={14} className="mr-2" /> 상태 변경
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => handleDeleteBook(e, book.library_id)}>
                                                <Trash2 size={14} className="mr-2" /> 서재에서 삭제
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="relative aspect-[1/1.4] w-[80%] mx-auto rounded-sm overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-3 bg-gray-50 flex items-center justify-center border border-gray-100 transition-all duration-300 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
                                    {book.cover ? (
                                        <Image src={book.cover} alt={book.title} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover group-hover:scale-105 transition-transform duration-500" priority={index < 10} />
                                    ) : ( <span className="text-[10px] text-gray-400 font-bold">No Cover</span> )}
                                </div>

                                <div className="flex flex-col flex-1">
                                    <h3 className="font-bold text-[#1d1d1f] text-[14px] line-clamp-1 mb-1 group-hover:text-[#0066cc] transition-colors">{book.title}</h3>
                                    <p className="text-[11px] text-gray-400 line-clamp-1 mb-3">{formatCardAuthor(book.author)}</p>
                                    
                                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
                                        <BadgeByStatus status={book.status} /> 
                                        
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
                                    </div>
                                </div>
                            </div>
                        ))}
                    </main>

                    {filteredBooks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 mt-4">
                            <BookOpen size={40} strokeWidth={1.5} className="mb-3 opacity-30 text-[#0066cc]" />
                            <p className="font-bold text-[14px] text-gray-500">조건에 맞는 도서가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <button onClick={() => setIsAddBookOpen(true)} className="fixed bottom-8 right-8 w-14 h-14 bg-[#1d1d1f] hover:bg-[#0066cc] text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-40">
                <Plus size={24} />
            </button>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[28px] border-none shadow-2xl">
                    
                    {/* 접근성 에러를 잠재우는 투명 명찰 (sr-only) */}
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
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {isAddBookOpen && (
                <AddBookModal isOpen={isAddBookOpen} onClose={() => { setIsAddBookOpen(false); fetchLibrarySilently(); }} userEmail={user?.email} />
            )}
        </div>
    );
}

function BadgeByStatus({ status }: { status: string }) {
    switch (status) {
        case 'READING':
            return <Badge className="bg-blue-50 text-[#0066cc] hover:bg-blue-50 border-0 h-5 px-1.5 text-[10px] font-bold">읽는 중</Badge>;
        case 'COMPLETED':
            return <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-0 h-5 px-1.5 text-[10px] font-bold">완독</Badge>;
        case 'WISH':
            return <Badge className="bg-rose-50 text-rose-500 hover:bg-rose-50 border-0 h-5 px-1.5 text-[10px] font-bold">읽고 싶음</Badge>;
        default:
            return <Badge variant="outline" className="text-gray-400 border-gray-200 h-5 px-1.5 text-[10px]">{status}</Badge>;
    }
}