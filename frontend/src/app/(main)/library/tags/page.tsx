'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tags, Home, ChevronRight, BookOpen, Loader2, Hash } from 'lucide-react';
import { formatCardAuthor } from '@/utils/formatters';
import { Badge } from "@/components/ui/badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function MyTagsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    const [tagsData, setTagsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // 특정 태그만 필터링해서 볼 수 있는 상태값 ('ALL'이면 전체 그룹 노출)
    const [activeTag, setActiveTag] = useState<string>('ALL');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/'); // 비로그인 시 홈으로 밀어내기
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

    // 선택된 태그에 따라 화면에 보여줄 데이터 필터링
    const displayedTags = activeTag === 'ALL' 
        ? tagsData 
        : tagsData.filter(t => t.tag_name === activeTag);

    if (isLoading) {
        return (
            <div className="w-full h-full bg-[#F5F5F7] flex justify-center items-center">
                <Loader2 className="animate-spin text-[#0066cc]" size={40} />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-[#F5F5F7]">
            {/* 상단 네비게이션 및 태그 필터 영역 (1cm 규격 적용) */}
            <div className="flex-none bg-[#F5F5F7]/90 backdrop-blur-md z-30 pt-4 px-[var(--spacing-1cm,32px)] border-b border-gray-200 sticky top-0 transition-all">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[13px] font-bold text-gray-400">
                        <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                            <Home size={15} /> <span>홈</span>
                        </Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <Link href="/library" className="hover:text-[#0066cc] transition-colors">내 서재</Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-[#1d1d1f] flex items-center gap-1"><Tags size={14}/> 나의 태그</span>
                    </div>
                </div>

                {/* 태그 칩(Chip) 가로 스크롤 메뉴 */}
                {tagsData.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-4">
                        <button
                            onClick={() => setActiveTag('ALL')}
                            className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap border ${
                                activeTag === 'ALL' 
                                ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-md' 
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            전체 보기
                        </button>
                        {tagsData.map((tag) => (
                            <button
                                key={tag.tag_name}
                                onClick={() => setActiveTag(tag.tag_name)}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap border ${
                                    activeTag === tag.tag_name 
                                    ? 'bg-[#0066cc] text-white border-[#0066cc] shadow-md' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#0066cc]/50 hover:text-[#0066cc]'
                                }`}
                            >
                                <Hash size={12} className={activeTag === tag.tag_name ? "text-white/70" : "text-gray-400"} />
                                {tag.tag_name}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-1 ${
                                    activeTag === tag.tag_name ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                                }`}>
                                    {tag.count}
                                </span>
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
                                    <h2 className="text-[20px] font-black text-[#1d1d1f] flex items-center gap-1.5">
                                        <Hash size={20} className="text-[#0066cc]" />
                                        {group.tag_name}
                                    </h2>
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[11px] font-bold">
                                        {group.count}권
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
                                    {group.books.map((book: any, index: number) => (
                                        <div 
                                            key={book.library_id || index} 
                                            onClick={() => handleBookClick(book.library_id)} 
                                            className="group cursor-pointer flex flex-col h-full bg-white rounded-sm p-4 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                                        >
                                            <div className="relative aspect-[1/1.4] w-[80%] mx-auto rounded-sm overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-3 bg-gray-50 flex items-center justify-center border border-gray-100 transition-all duration-300 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
                                                {book.cover ? (
                                                    <Image src={book.cover} alt={book.title} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : ( 
                                                    <span className="text-[10px] text-gray-400 font-bold">No Cover</span> 
                                                )}
                                            </div>

                                            <div className="flex flex-col flex-1 text-center">
                                                <h3 className="font-bold text-[#1d1d1f] text-[13px] line-clamp-1 mb-1 group-hover:text-[#0066cc] transition-colors">{book.title}</h3>
                                                <p className="text-[11px] text-gray-400 line-clamp-1">{formatCardAuthor(book.author)}</p>
                                            </div>
                                        </div>
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