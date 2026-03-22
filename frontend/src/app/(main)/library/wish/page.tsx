'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
    Home, ChevronRight, Bookmark, Loader2, BookOpen, MoreVertical, Edit, Trash2
} from 'lucide-react';
import { formatCardAuthor } from '@/utils/formatters';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import BookDetailForm from '@/app/(main)/library/BookDetailForm'
import { BookItemCard } from '@/components/common/BookItemCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function WishlistPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    const [wishBooks, setWishBooks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // ▼▼▼ [NEW] 상태 변경 모달을 위한 상태값 추가 ▼▼▼
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<any>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/'); 
        }
        if (session?.user?.email) {
            fetchWishlistData(session.user.email);
        }
    }, [session, status, router]);

    const fetchWishlistData = async (email: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/users/${email}/wish`);
            if (res.ok) {
                const data = await res.json();
                setWishBooks(data);
            }
        } catch (error) {
            console.error("API 연결 오류:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBookClick = (libraryId: number) => {
        router.push(`/library/${libraryId}`);
    };

    // ▼▼▼ [NEW] 액션 핸들러 추가 ▼▼▼
    const openEditModal = (e: React.MouseEvent, book: any) => {
        e.stopPropagation(); 
        setSelectedBook(book);
        setIsEditModalOpen(true);
    };

    const handleDeleteBook = async (e: React.MouseEvent, libraryId: number) => {
        e.stopPropagation();
        if (!confirm("정말로 위시리스트에서 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(`${API_URL}/api/library/${libraryId}`, { method: 'DELETE' });
            if (res.ok) {
                setWishBooks(prev => prev.filter(b => b.library_id !== libraryId));
                toast.success("위시리스트에서 삭제되었습니다.");
            }
        } catch (error) {
            toast.error("삭제 중 오류가 발생했습니다.");
        }
    };

    if (isLoading) {
        return (
            <div className="w-full h-full bg-[#F5F5F7] flex justify-center items-center">
                <Loader2 className="animate-spin text-[#0066cc]" size={40} />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-[#F5F5F7]">
            {/* 상단 네비게이션 */}
            <div className="flex-none bg-[#F5F5F7]/90 backdrop-blur-md z-30 pt-4 px-[var(--spacing-1cm,32px)] border-b border-gray-200 sticky top-0 transition-all">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[13px] font-bold text-gray-400">
                        <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                            <Home size={15} /> <span>홈</span>
                        </Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <Link href="/library" className="hover:text-[#0066cc] transition-colors">내 서재</Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-[#1d1d1f] flex items-center gap-1">
                            <Bookmark size={14} /> 읽고 싶은 도서
                        </span>
                    </div>
                </div>

                {/* 타이틀 및 카운트 */}
                <div className="flex flex-col mb-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-[22px] font-black text-[#1d1d1f] flex items-center gap-2">
                            <Bookmark size={24} className="text-rose-500 fill-rose-100" />
                            위시리스트
                        </h1>
                        <Badge variant="secondary" className="bg-gray-200/50 text-gray-500 text-[12px] font-bold px-2 py-0.5">
                            {wishBooks.length}권
                        </Badge>
                    </div>
                </div>
            </div>

            {/* 본문: 위시리스트 카드 그리드 영역 */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="p-[var(--spacing-1cm,32px)] pt-6 pb-32">
                    {wishBooks.length > 0 ? (
                        <main className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
                            {wishBooks.map((book, index) => (
                                // ▼▼▼ [핵심 설계] 드롭다운 호버 메뉴를 띄우기 위해 바깥쪽에 'group/wish' 래퍼 추가 ▼▼▼
                                <div key={book.library_id || index} className="relative h-full group/wish">
                                    
                                    {/* ▼▼▼ [유지] 카드 우측 상단 드롭다운 메뉴 ▼▼▼ */}
                                    {/* group-hover/wish를 사용하여 BookItemCard의 호버와 충돌하지 않게 분리했습니다. */}
                                    <div className="absolute top-3 right-3 z-20 opacity-0 group-hover/wish:opacity-100 transition-opacity">
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
                                                    <Trash2 size={14} className="mr-2" /> 위시리스트 삭제
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* ▼▼▼ [적용] 공통 BookItemCard 컴포넌트 이식 ▼▼▼ */}
                                    {/* 움직임이 제거되고 커버만 부드럽게 상승합니다. */}
                                    <BookItemCard 
                                        onClick={() => handleBookClick(book.library_id)}
                                        cover={book.cover}
                                        title={book.title}
                                        author={book.author}
                                        // 하단 좌측: 읽고 싶음 뱃지
                                        footerLeft={
                                            <Badge className="bg-rose-50 text-rose-500 hover:bg-rose-50 border-0 h-5 px-1.5 text-[10px] font-bold">
                                                읽고 싶음
                                            </Badge>
                                        }
                                        // 하단 우측: 담은 날짜
                                        footerRight={
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {book.added_at ? book.added_at.substring(0, 10) : ''} 담음
                                            </span>
                                        }
                                    />
                                </div>
                            ))}
                        </main>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 mt-4">
                            <BookOpen size={40} strokeWidth={1.5} className="mb-3 opacity-30 text-rose-500" />
                            <p className="font-bold text-[14px] text-gray-500 mb-1">아직 읽고 싶은 책으로 담은 도서가 없습니다.</p>
                            <p className="text-[12px] text-gray-400">광장이나 검색을 통해 흥미로운 책을 담아보세요!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ▼▼▼ [NEW] 상태 변경을 위한 모달 렌더링 영역 ▼▼▼ */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[28px] border-none shadow-2xl">
                    <DialogTitle className="sr-only">도서 기록 변경</DialogTitle>
                    {selectedBook && (
                        <BookDetailForm 
                            initialData={selectedBook} 
                            onClose={() => setIsEditModalOpen(false)} 
                            onSaved={(updatedData) => {
                                // 상태가 WISH에서 READING이나 COMPLETED로 바뀌면 목록에서 즉시 제거!
                                if (updatedData.status !== 'WISH') {
                                    setWishBooks(prev => prev.filter(b => b.library_id !== selectedBook.library_id));
                                    
                                    // ▼▼▼ [핵심] 첫 번째 토스트가 뜬 후, 0.8초(800ms) 뒤에 두 번째 토스트가 우아하게 등장하도록 시간차 세팅! ▼▼▼
                                    setTimeout(() => {
                                        toast.success("상태가 변경되어 서재로 이동되었습니다!");
                                    }, 800);
                                    
                                } else {
                                    // WISH 그대로 정보만 수정된 경우
                                    setWishBooks(prev => prev.map(book => 
                                        book.library_id === selectedBook.library_id ? { ...book, ...updatedData } : book
                                    ));
                                }
                                setIsEditModalOpen(false);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}