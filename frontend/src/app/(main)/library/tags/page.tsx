'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tags, Home, ChevronRight, Loader2, Hash } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

// ▼ [핵심] 우리가 만든 도서 전용 공통 카드 임포트
import { BookItemCard } from '@/components/common/BookItemCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function MyTagsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    const [tagsData, setTagsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTag, setActiveTag] = useState<string>('ALL');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/'); 
        }
        if (session?.user?.email) {
            fetchTagsData(session.user.email);
        }
    }, [session, status, router]);

    const fetchTagsData = async (email: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/users/${email}/tags`);
            if (res.ok) {
                const data = await res.json();
                setTagsData(data);
            }
        } catch (error) {
            console.error("태그 데이터 로딩 실패:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBookClick = (libraryId: number) => {
        router.push(`/library/${libraryId}`);
    };

    const displayedTags = activeTag === 'ALL' ? tagsData : tagsData.filter(t => t.tag_name === activeTag);

    if (isLoading) {
        return (
            <div className="w-full h-full bg-[#F5F5F7] flex justify-center items-center">
                <Loader2 className="animate-spin text-[#0066cc]" size={40} />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-[#F5F5F7]">
            {/* 상단 네비게이션 및 태그 필터 영역 */}
            <div className="flex-none bg-[#F5F5F7]/90 backdrop-blur-md z-30 pt-4 px-[var(--spacing-1cm,32px)] border-b border-gray-200 sticky top-0 transition-all">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[13px] font-bold text-gray-400">
                        <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors"><Home size={15} /> <span>홈</span></Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <Link href="/library" className="hover:text-[#0066cc] transition-colors">내 서재</Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-[#1d1d1f] flex items-center gap-1"><Tags size={14}/> 나의 태그</span>
                    </div>
                </div>

                {/* 태그 칩(Chip) 가로 스크롤 메뉴 유지 */}
                {tagsData.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-4">
                        <button onClick={() => setActiveTag('ALL')} className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap border ${activeTag === 'ALL' ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>전체 보기</button>
                        {tagsData.map((tag) => (
                            <button key={tag.tag_name} onClick={() => setActiveTag(tag.tag_name)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap border ${activeTag === tag.tag_name ? 'bg-[#0066cc] text-white border-[#0066cc] shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0066cc]/50 hover:text-[#0066cc]'}`}>
                                <Hash size={12} className={activeTag === tag.tag_name ? "text-white/70" : "text-gray-400"} /> {tag.tag_name}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-1 ${activeTag === tag.tag_name ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>{tag.count}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 본문: 태그별 도서 목록 렌더링 영역 */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="p-[var(--spacing-1cm,32px)] pt-6 pb-32 flex flex-col gap-12">
                    {displayedTags.length > 0 ? (
                        displayedTags.map((group) => (
                            <section key={group.tag_name} className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                                    <h2 className="text-[20px] font-black text-[#1d1d1f] flex items-center gap-1.5"><Hash size={20} className="text-[#0066cc]" /> {group.tag_name}</h2>
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[11px] font-bold">{group.count}권</Badge>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
                                    {group.books.map((book: any, index: number) => (
                                        // ▼▼▼ [적용 완료] 예전 div를 지우고 BookItemCard 하나로 깔끔하게 교체 ▼▼▼
                                        // 이제 카드 자체는 움직이지 않고, 내장된 로직에 의해 표지만 둥실 떠오릅니다!
                                        <BookItemCard 
                                            key={book.library_id || index}
                                            onClick={() => handleBookClick(book.library_id)}
                                            cover={book.cover}
                                            title={book.title}
                                            author={book.author}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 mt-4">
                            <Tags size={40} strokeWidth={1.5} className="mb-3 opacity-30 text-[#0066cc]" />
                            <p className="font-bold text-[14px] text-gray-500 mb-1">아직 등록된 태그가 없습니다.</p>
                            <p className="text-[12px] text-gray-400">도서를 서재에 담고 나만의 태그를 추가해 보세요!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}