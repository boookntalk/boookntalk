// 경로: frontend/src/app/(main)/library/tags/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tags, Home, ChevronRight, Loader2, Hash } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

import { BookItemCard } from '@/components/common/BookItemCard';
import StandardContainer from '@/components/layout/StandardContainer'; 
import SubPageLayout from '@/components/layout/SubPageLayout';

// 💡 shadcn/ui Tabs 도입
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            <StandardContainer size="wide" className="min-h-screen flex justify-center items-center">
                <Loader2 className="animate-spin text-[#0066cc]" size={40} />
            </StandardContainer>
        );
    }

    return (
        // 💡 Tabs로 전체를 감싸서 상태 관리를 shadcn에 위임합니다.
        <Tabs value={activeTag} onValueChange={setActiveTag} className="w-full">
            <SubPageLayout
                breadcrumb={
                    <>
                        <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                            <Home size={15} /> <span>홈</span>
                        </Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <Link href="/library" className="hover:text-[#0066cc] transition-colors">
                            내 서재
                        </Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-[#1d1d1f] flex items-center gap-1">
                            <Tags size={14}/> 나의 태그
                        </span>
                    </>
                }
                titleOrTabs={
                    tagsData.length > 0 && (
                        // 💡 태그 칩(Pill) 스타일을 위한 커스텀 TabsList
                        <TabsList className="bg-transparent p-0 h-auto gap-3 justify-start flex-nowrap w-full overflow-x-auto scrollbar-hide pb-2">
                            <TabsTrigger 
                                value="ALL"
                                className="px-4 py-1.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap border bg-white text-gray-500 border-gray-200 hover:border-gray-300 data-[state=active]:bg-[#1d1d1f] data-[state=active]:text-white data-[state=active]:border-[#1d1d1f] data-[state=active]:shadow-md"
                            >
                                전체 보기
                            </TabsTrigger>
                            {tagsData.map((tag) => (
                                <TabsTrigger 
                                    key={tag.tag_name} 
                                    value={tag.tag_name}
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap border bg-white text-gray-600 border-gray-200 hover:border-[#0066cc]/50 hover:text-[#0066cc] data-[state=active]:bg-[#0066cc] data-[state=active]:text-white data-[state=active]:border-[#0066cc] data-[state=active]:shadow-md"
                                >
                                    <Hash size={12} className={activeTag === tag.tag_name ? "text-white/70" : "text-gray-400"} /> 
                                    {tag.tag_name}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-1 ${activeTag === tag.tag_name ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        {tag.count}
                                    </span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    )
                }
            >
                <div className="flex flex-col gap-10">
                    {displayedTags.length > 0 ? (
                        displayedTags.map((group) => (
                            <section key={group.tag_name} className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                                    <h2 className="text-[20px] font-black text-[#1d1d1f] flex items-center gap-1.5">
                                        <Hash size={20} className="text-[#0066cc]" /> {group.tag_name}
                                    </h2>
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[11px] font-bold">
                                        {group.count}권
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                    {group.books.map((book: any, index: number) => (
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
                        </div>
                    )}
                </div>
            </SubPageLayout>
        </Tabs>
    );
}