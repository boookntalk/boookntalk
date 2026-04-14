// 경로: frontend/src/app/(main)/library/LibraryClient.tsx
// 역할 및 기능: BoooknTalk 내 서재 클라이언트 화면. SubPageLayout 템플릿과 shadcn/ui Tabs를 도입하여 레이아웃 코드를 대폭 단축시키고 유지보수성을 극대화했습니다.

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

// 💡 [NEW] 우리가 만든 공통 레이아웃과 shadcn 컴포넌트 임포트
import SubPageLayout from '@/components/layout/SubPageLayout';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        // 💡 [핵심] Tabs로 감싸고, 우리가 만든 SubPageLayout에 빈칸(props)만 채워줍니다!
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <SubPageLayout
                // 1. 브레드크럼 영역
                breadcrumb={
                    <>
                        <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                            <Home size={15} /> <span>홈</span>
                        </Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-[#1d1d1f]">내 서재</span>
                    </>
                }
                
                // 2. 우측 액션(검색창) 영역
                actionArea={
                    <>
                        <Search className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0066cc] transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="책, 저자 검색..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-4 py-1.5 bg-transparent border-0 border-b-2 border-gray-200 rounded-none text-[14px] text-[#1d1d1f] placeholder:text-gray-400 transition-all outline-none focus:border-[#0066cc] focus:ring-0"
                        />
                    </>
                }

                // 3. 탭 메뉴 영역 (shadcn TabsList 사용)
                titleOrTabs={
                    <TabsList className="bg-transparent p-0 h-auto gap-6 justify-start flex-nowrap w-full">
                        {menuItems.map((item) => {
                            const count = item.code === 'ALL' 
                                ? books.filter(b => b.status !== 'WISH').length 
                                : item.code === 'COMPLETED'
                                    ? books.filter(b => b.status === 'COMPLETED' || b.status === 'FINISHED').length
                                    : books.filter(b => b.status === item.code).length;

                            return (
                                <TabsTrigger 
                                    key={item.code} 
                                    value={item.code}
                                    // 💡 [수정 완료] data-[state=active]:bg-transparent 를 추가하여 클릭 시 흰색 상자가 생기는 것을 원천 차단했습니다!
                                    className="p-0 pb-2 bg-transparent shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-[#0066cc] data-[state=active]:text-[#0066cc] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[15px] font-bold text-gray-400 hover:text-[#1d1d1f] whitespace-nowrap"
                                >
                                    {item.label}
                                    {count > 0 && (
                                        <span className={`ml-1.5 text-[12px] ${activeTab === item.code ? 'text-[#0066cc]' : 'text-gray-400'}`}>
                                            {count}
                                        </span>
                                    )}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                }
            >
                {/* 4. 메인 콘텐츠 영역 (SubPageLayout 내부의 pt-6 룰 자동 적용) */}
                {filteredBooks.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {filteredBooks.map((book, index) => (
                            <div key={book.library_id || index} className="relative h-full group/lib">
                                
                                <div className="absolute top-3 right-3 z-20 opacity-0 group-hover/lib:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full bg-white/90 shadow-sm hover:bg-white focus:outline-none" onClick={(e) => e.stopPropagation()}>
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
            </SubPageLayout>
            
            <button onClick={() => setIsAddBookOpen(true)} className="fixed bottom-8 right-8 w-14 h-14 bg-[#1d1d1f] hover:bg-[#1F3A5F] text-white rounded-full shadow-[0_8px_30px_rgba(29,36,51,0.3)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-40">
                <Plus size={24} />
            </button>

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
        </Tabs>
    );
}

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