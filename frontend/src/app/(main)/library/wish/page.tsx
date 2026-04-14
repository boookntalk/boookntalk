// 경로: frontend/src/app/(main)/library/wish/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
    Home, ChevronRight, Bookmark, Loader2, BookOpen, MoreVertical, Edit, Trash2
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import BookDetailForm from '@/app/(main)/library/BookDetailForm';
import { BookItemCard } from '@/components/common/BookItemCard';
import StandardContainer from '@/components/layout/StandardContainer'; 
import SubPageLayout from '@/components/layout/SubPageLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function WishlistPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    const [wishBooks, setWishBooks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
            <StandardContainer size="wide" className="min-h-screen flex justify-center items-center">
                <Loader2 className="animate-spin text-[#0066cc]" size={40} />
            </StandardContainer>
        );
    }

    return (
        <SubPageLayout
            breadcrumb={
                <>
                    <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                        <Home size={15} /> <span>홈</span>
                    </Link>
                    <ChevronRight size={14} className="opacity-50" />
                    <Link href="/library" className="hover:text-[#0066cc] transition-colors">내 서재</Link>
                    <ChevronRight size={14} className="opacity-50" />
                    <span className="text-[#1d1d1f] flex items-center gap-1">
                        <Bookmark size={14} /> 읽고 싶은 도서
                    </span>
                </>
            }
            titleOrTabs={
                <div className="flex items-center gap-3 pb-2 w-full">
                    <h1 className="text-[20px] md:text-[22px] font-black text-[#1d1d1f] flex items-center gap-2">
                        <Bookmark size={22} className="text-rose-500 fill-rose-100" />
                        위시리스트
                    </h1>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[12px] font-bold px-2 py-0.5">
                        {wishBooks.length}권
                    </Badge>
                </div>
            }
        >
            <div className="flex flex-col gap-10">
                {wishBooks.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {wishBooks.map((book, index) => (
                            <div key={book.library_id || index} className="relative h-full group/wish">
                                
                                <div className="absolute top-3 right-3 z-20 opacity-0 group-hover/wish:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full bg-white/90 shadow-sm hover:bg-white" onClick={(e) => e.stopPropagation()}>
                                                <MoreVertical size={14} className="text-gray-500" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44" onCloseAutoFocus={(e) => e.preventDefault()}>
                                            <DropdownMenuItem onClick={(e) => openEditModal(e, book)}>
                                                <Edit size={14} className="mr-2" /> 상태 변경
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => handleDeleteBook(e, book.library_id)}>
                                                <Trash2 size={14} className="mr-2" /> 위시리스트 삭제
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <BookItemCard 
                                    onClick={() => handleBookClick(book.library_id)}
                                    cover={book.cover}
                                    title={book.title}
                                    author={book.author}
                                    footerLeft={
                                        <Badge className="bg-rose-50 text-rose-500 hover:bg-rose-50 border-0 h-5 px-1.5 text-[10px] font-bold shadow-none">
                                            읽고 싶음
                                        </Badge>
                                    }
                                    footerRight={
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {book.added_at ? book.added_at.substring(0, 10) : ''} 담음
                                        </span>
                                    }
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-gray-400 bg-white rounded-3xl border border-dashed border-[#E7E2D9] mt-4">
                        <BookOpen size={40} strokeWidth={1.5} className="mb-3 opacity-30 text-rose-500" />
                        <p className="font-bold text-[14px] text-gray-500 mb-1">아직 읽고 싶은 책으로 담은 도서가 없습니다.</p>
                        <p className="text-[12px] text-gray-400">광장이나 검색을 통해 흥미로운 책을 담아보세요!</p>
                    </div>
                )}
            </div>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[28px] border-none shadow-2xl">
                    <DialogTitle className="sr-only">도서 기록 변경</DialogTitle>
                    {selectedBook && (
                        <BookDetailForm 
                            initialData={selectedBook} 
                            onClose={() => setIsEditModalOpen(false)} 
                            onSaved={(updatedData) => {
                                if (updatedData.status !== 'WISH') {
                                    setWishBooks(prev => prev.filter(b => b.library_id !== selectedBook.library_id));
                                    setTimeout(() => {
                                        toast.success("상태가 변경되어 서재로 이동되었습니다!");
                                    }, 800);
                                } else {
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
        </SubPageLayout>
    );
}