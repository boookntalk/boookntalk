// frontend/src/app/library/LibraryClient.tsx
'use client'; // 1. 지시어는 반드시 첫 줄에!

import React, { useState } from 'react';
import BookDetailForm from './BookDetailForm'; // 2. import는 지시어 아래에 위치

type ViewMode = 'list' | 'card';

interface Book {
    library_id: number;
    title: string;
    author: string;
    cover: string;
    status: string;
    page_count: number;
    added_at: string;
}

export default function LibraryClient({ initialBooks }: { initialBooks: Book[] }) {
    const [viewMode, setViewMode] = useState<ViewMode>('card');

    return (
        <main className="max-w-[1400px] mx-auto px-6 pt-10 pb-20">
            {/* 상단 헤더 섹션 */}
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-[32px] font-bold tracking-tight text-[#1d1d1f]">나의 서재</h2>
                    <p className="text-[#86868b] mt-1 text-[17px]">수집한 지식과 문장들이 머무는 곳</p>
                </div>
                
                <div className="flex bg-[#f5f5f7] p-1 rounded-xl shadow-inner">
                    {(['list', 'card'] as ViewMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                                viewMode === mode ? 'bg-white shadow-sm text-black' : 'text-[#86868b] hover:text-black'
                            }`}
                        >
                            {mode === 'list' ? '리스트' : '카드'}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- 📝 추가 정보 입력 폼 (테스트를 위해 상단 배치) --- */}
            <div className="mb-16">
                {/* 실제로는 리스트에서 클릭한 책의 library_id를 넘겨야 하지만, 
                   우선 DB에 있는 데이터 중 하나(예: 1번)로 테스트해 보세요. 
                */}
                <BookDetailForm libraryId={1} />
            </div>
            {/* -------------------------------------------------- */}

            {/* 도서 목록 렌더링 */}
            {viewMode === 'card' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-12">
                    {initialBooks.map((book) => (
                        <div key={book.library_id} className="group cursor-pointer">
                            <div className="aspect-[2/3] overflow-hidden rounded-2xl bg-[#f5f5f7] mb-4 shadow-sm group-hover:shadow-xl transition-all duration-300">
                                <img 
                                    src={book.cover} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    alt={book.title}
                                />
                            </div>
                            <h4 className="font-bold text-[16px] text-[#1d1d1f] truncate leading-tight">{book.title}</h4>
                            <p className="text-[14px] text-[#86868b] mt-1">{book.author}</p>
                            <div className="mt-3 flex items-center">
                                <span className="px-2 py-0.5 bg-[#f5f5f7] text-[#0066cc] text-[11px] font-bold rounded-full uppercase">
                                    {book.status === 'reading' ? '읽는 중' : '완독'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {initialBooks.map((book) => (
                        <div key={book.library_id} className="flex items-center p-4 bg-white hover:bg-[#f5f5f7] border border-[#f5f5f7] rounded-2xl transition-all cursor-pointer group">
                            <div className="w-16 h-24 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                                <img src={book.cover} className="w-full h-full object-cover" alt={book.title} />
                            </div>
                            <div className="ml-8 flex-grow">
                                <h4 className="text-xl font-bold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors">{book.title}</h4>
                                <p className="text-[#86868b] font-medium">{book.author}</p>
                                <div className="mt-2 flex gap-3 text-[12px] text-[#86868b]">
                                    <span>{new Date(book.added_at).toLocaleDateString()} 등록</span>
                                    <span>•</span>
                                    <span>{book.page_count} 페이지</span>
                                </div>
                            </div>
                            <div className="text-right min-w-[120px]">
                                <span className="text-[#0066cc] font-bold text-sm">진행률 0%</span>
                                <div className="w-24 h-1.5 bg-[#e5e5e7] rounded-full mt-2 overflow-hidden ml-auto">
                                    <div className="bg-[#0066cc] h-full w-[0%]"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}