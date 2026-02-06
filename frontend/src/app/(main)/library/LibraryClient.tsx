'use client';

import React, { useState } from 'react';
import { Star, Search } from 'lucide-react';
import { DESIGN_TOKEN } from '@/constants/styles';
import BookDetailForm from './BookDetailForm';
import Dialog from '@/components/ui/dialog'; 
import Container from '@/components/layout/Container'; 
import Image from 'next/image'; 

// [수정] 백엔드 데이터 구조에 맞게 인터페이스 정의 (TypeScript 활용)
interface Book {
    library_id: number; // 백엔드에서는 id 대신 library_id를 줄 수 있음
    title: string;
    author: string;
    cover: string;
    status: string;
    rating?: number;
    // 필요한 다른 필드들...
}

export default function LibraryClient({ initialBooks }: { initialBooks: any[] }) {
    const [filter, setFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<any>(null);

    const [searchTerm, setSearchTerm] = useState('');

    const openModal = (book: any) => {
        setSelectedBook(book);
        setIsModalOpen(true);
    };

    // [로직 추가] 검색어 및 필터링 로직 적용
    const filteredBooks = initialBooks.filter(book => {
        // 1. 탭 필터 (전체/읽는중/완독 등)
        const statusMatch = filter === 'all' 
            ? true 
            : filter === 'reading' ? book.status === 'READING' // 백엔드가 대문자로 줄 수 있음
            : filter === 'completed' ? book.status === 'COMPLETED'
            : filter === 'wish' ? book.status === 'WISH'
            : true;
        
        // 2. 검색어 필터
        const searchMatch = !searchTerm 
            ? true 
            : book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
              book.author.toLowerCase().includes(searchTerm.toLowerCase());

        return statusMatch && searchMatch;
    });

    return (
        <div className="w-full">
            <Container className="pt-0 pb-16">        
                <header className="flex justify-between items-start mb-8 pt-0">
                    <div className="flex flex-col gap-1">
                        <h1 className={`text-[28px] ${DESIGN_TOKEN.FONT.TITLE} tracking-tight text-[#1d1d1f]`}>나의 서재</h1>
                        <p className={`${DESIGN_TOKEN.FONT.SUBTITLE} text-[14px] text-[#86868b]`}>수집한 지식과 문장들이 머무는 사색의 공간</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div className="flex items-center gap-2 pb-1.5 border-b border-gray-300 group-focus-within:border-[#1d1d1f] transition-all duration-300">
                                <Search size={18} className="text-gray-400 group-focus-within:text-[#1d1d1f] transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="도서명, 저자 검색"
                                    className="bg-transparent border-none outline-none text-[15px] w-64 placeholder:text-gray-400 text-[#1d1d1f]"
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <nav className="flex gap-10 mb-8 border-b border-gray-200 relative">
                    {['all', 'reading', 'completed', 'wish'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`pb-4 text-sm font-medium transition-all relative flex flex-col items-center gap-1 ${
                            filter === f ? 'text-[#0055aa] font-bold' : 'text-[#86868b] hover:text-[#1d1d1f]'
                        }`}
                    >
                        <span>
                            {f === 'all' && '전체 도서'}
                            {f === 'reading' && '읽는 중'}
                            {f === 'completed' && '완독'}
                            {f === 'wish' && '읽고 싶은'}
                        </span>
                        {filter === f && (
                            <span className="absolute bottom-2 w-1.5 h-1.5 bg-[#0055aa] rounded-full shadow-[0_0_5px_rgba(0,85,170,0.4)]" />
                        )}
                    </button>
                    ))}
                </nav>

                <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {/* [수정] filteredBooks 사용 */}
                    {filteredBooks.map((book) => (
                        <div 
                            key={book.library_id || book.id} // [수정] library_id를 우선 사용
                            onClick={() => openModal(book)}
                            className="group cursor-pointer"
                        >
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-0.5">
                                <div className="relative aspect-[3/4] rounded-lg mb-4 w-[70%] mx-auto overflow-hidden">
                                    {/* 이미지 URL 유효성 체크 필요할 수 있음 */}
                                    {book.cover ? (
                                        <Image 
                                            src={book.cover} 
                                            alt={book.title}
                                            fill  
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            unoptimized={true} 
                                            className="object-cover rounded-lg shadow-md transition-all duration-500 ease-out group-hover:scale-105" 
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">No Cover</div>
                                    )}
                                    <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                                </div>
                         
                                <div className="text-left px-1">
                                    <h3 className="font-bold text-[#1d1d1f] text-[15px] mb-1 line-clamp-1">
                                        {book.title}
                                    </h3>
                                    <p className="text-[13px] text-[#86868b] mb-3 line-clamp-1">
                                        {book.author}
                                    </p>

                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                        {/* 왼쪽: 상태 뱃지 (읽는 중 / 완독 / 읽고 싶은) */}
                                        <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${
                                                book.status?.toUpperCase() === 'READING' ? 'bg-blue-50 text-blue-600' :
                                                book.status?.toUpperCase() === 'COMPLETED' ? 'bg-green-50 text-green-600' :
                                                'bg-gray-100 text-gray-500' // WISH 등 나머지
                                            }`}>
                                            {book.status?.toUpperCase() === 'READING' && '읽는 중'}
                                            {book.status?.toUpperCase() === 'COMPLETED' && '완독'}
                                            {(!book.status || book.status?.toUpperCase() === 'WISH') && '읽고 싶은'}
                                        </span>

                                        {/* 오른쪽: 별점 표시 (항상 표시) */}
                                        <div className="flex items-center gap-1">
                                            <Star 
                                                size={12} 
                                                fill={book.rating > 0 ? "#FFCC00" : "#E5E5E7"} 
                                                className={book.rating > 0 ? "text-[#FFCC00]" : "text-[#E5E5E7]"} 
                                            />
                                            <span className="text-[12px] font-medium text-[#1d1d1f]">
                                                {book.rating ? book.rating.toFixed(1) : '0.0'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* 데이터가 없을 때 안내 문구 */}
                    {filteredBooks.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-400">
                            <p>해당하는 도서가 없습니다.</p>
                        </div>
                    )}
                </main>
            </Container>

            <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {selectedBook && <BookDetailForm initialData={selectedBook} onClose={() => setIsModalOpen(false)} />}
            </Dialog>
        </div>
    );
}