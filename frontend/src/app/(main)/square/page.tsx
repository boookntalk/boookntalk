'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from "next-auth/react";
import Footer from '@/components/layout/Footer';
import { 
    Loader2, BookmarkPlus, Star, Users, 
    Home, ChevronRight, Search, 
    BookOpen, Hash, Users as UsersIcon, 
    MessageSquare, PenTool
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";

export default function SquarePage() {
    const router = useRouter();
    const { data: session, status } = useSession(); 
    
    // 상태 관리 (LNB & Tab)
    const [activeLnb, setActiveLnb] = useState<string>('explore');
    const [activeTab, setActiveTab] = useState<string>('works');
    
    const [works, setWorks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // LNB 및 서브 탭 구조 정의 (구조는 유지하되 스타일을 내 서재에 맞춤)
    const menuGroups = [
        {
            id: 'explore',
            label: '도서 탐험',
            icon: BookOpen,
            title: '도서 탐험',
            items: [
                { id: 'works', label: '인기 작품' },
                { id: 'authors', label: '주목받는 작가' },
                { id: 'long_reviews', label: '리뷰 (긴줄평)' },
                { id: 'short_reviews', label: '한줄평' },
                { id: 'notes', label: '독서노트' },
            ]
        },
        {
            id: 'community',
            label: '커뮤니티',
            icon: Users,
            title: '커뮤니티',
            items: [
                { id: 'following', label: '팔로잉 피드' },
                { id: 'recommended', label: '추천 기록자' },
            ]
        }
    ];

    const activeGroupData = menuGroups.find(g => g.id === activeLnb) || menuGroups[0];
    const activeItemLabel = activeGroupData.items.find(i => i.id === activeTab)?.label || '';

    const handleLnbClick = (groupId: string) => {
        setActiveLnb(groupId);
        const group = menuGroups.find(g => g.id === groupId);
        if (group && group.items.length > 0) {
            setActiveTab(group.items[0].id);
        }
    };

    // [1] 인기 작품(Work) 데이터 로딩
    useEffect(() => {
        if (activeTab !== 'works') return;
        
        const fetchTrendingWorks = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/square/works`);
                if (res.ok) {
                    const data = await res.json();
                    setWorks(data);
                }
            } catch (error) {
                console.error("인기 도서 로딩 실패:", error);
                toast.error("도서 정보를 불러오지 못했습니다.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchTrendingWorks();
    }, [activeTab]); 

    // [2] 빠른 서재 담기 핸들러
    const handleAddWishlist = async (e: React.MouseEvent, editionId: number, bookTitle: string) => {
        e.stopPropagation();
        if (status === 'unauthenticated') return signIn('google');
        try {
            const res = await fetch(`http://localhost:8000/api/library/wishlist/quick`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ user_email: session!.user!.email, edition_id: editionId })
            });
            const data = await res.json();
            if (data.status === 'success') toast.success(`'${bookTitle}' 내 서재에 담겼습니다!`);
            else if (data.status === 'exists') toast.info(data.message);
        } catch (error) {
            toast.error("오류가 발생했습니다.");
        }
    };

    return (
        <div className="flex w-full h-[calc(100vh-64px)] bg-[#F5F5F7] overflow-hidden">
            
            {/* 좌측 고정 LNB (이미지 스타일 적용: 활성화 시 하늘색 배경) */}
            <aside className="w-[260px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full z-10 pt-8">
                <nav className="flex-1 px-4 space-y-1">
                    {menuGroups.map((group) => (
                        <button 
                            key={group.id}
                            onClick={() => handleLnbClick(group.id)}
                            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all duration-300 font-bold ${
                                activeLnb === group.id 
                                ? 'bg-blue-50 text-[#0066cc]' // ▼ 이미지와 동일한 활성화 스타일
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <group.icon size={18} className={`mr-3 ${activeLnb === group.id ? 'text-[#0066cc]' : 'text-gray-400'}`} />
                            <span className="text-[14px]">{group.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* 우측 메인 스크롤 콘텐츠 영역 */}
            <main className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide relative">
                
                {/* ▼▼▼ 상단 Sticky Header (이미지의 내 서재 구조 완벽 이식) ▼▼▼ */}
                <div className="sticky top-0 z-20 bg-[#F5F5F7]/90 backdrop-blur-md pt-8 px-[var(--spacing-1cm,32px)] border-b border-gray-200 transition-all">
                    
                    {/* 1. 경로(Breadcrumb)와 검색창 */}
                    <div className="flex items-center justify-between mb-8">
                        {/* 좌측: 홈 > 도서 탐험 > 인기 작품 */}
                        <div className="flex items-center gap-2 text-[13px] font-bold text-gray-400">
                            <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                                <Home size={15} /> <span>홈</span>
                            </Link>
                            <ChevronRight size={14} className="opacity-50" />
                            <span>{activeGroupData.title}</span>
                            <ChevronRight size={14} className="opacity-50" />
                            <span className="text-[#1d1d1f]">{activeItemLabel}</span>
                        </div>

                        {/* 우측: 내 서재 스타일의 둥근 검색창 */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="광장 내 검색..." 
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-[14px] w-64 focus:w-80 transition-all duration-300 outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] shadow-sm"
                            />
                        </div>
                    </div>
                    
                    {/* 2. 밑줄 탭 메뉴 (Underline Tabs) */}
                    <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide -mb-[1px]">
                        {activeGroupData.items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`pb-3 text-[15px] font-bold transition-all whitespace-nowrap border-b-2 ${
                                    activeTab === item.id 
                                    ? 'text-[#0066cc] border-[#0066cc]' 
                                    : 'text-gray-400 border-transparent hover:text-[#1d1d1f]'
                                }`}
                            >
                                {item.label}
                                {/* 활성화된 탭 옆에 아이템 갯수 표시 (예시) */}
                                {activeTab === item.id && activeTab === 'works' && (
                                    <span className="ml-1.5 text-[12px] text-[#0066cc]">{works.length}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 하단 콘텐츠 바디 영역 */}
                <div className="flex-1 p-[var(--spacing-1cm,32px)] pt-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-32">
                            <Loader2 className="animate-spin text-[#0066cc]" size={40} />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'works' && (
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
                                    {works.map((work, index) => (
                                        // ▼▼▼ 이미지와 동일한 카드 스타일 이식 ▼▼▼
                                        <div 
                                            key={work.edition_id} 
                                            onClick={() => router.push(`/book/${work.isbn}`)}
                                            className="group cursor-pointer flex flex-col h-full bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative"
                                        >
                                            {/* 책 표지 (카드 패딩 안쪽을 꽉 채우는 비율) */}
                                            <div className="relative aspect-[1/1.4] w-full mx-auto rounded overflow-hidden shadow-sm mb-4 bg-gray-50 flex items-center justify-center border border-gray-100">
                                                {work.cover ? (
                                                    <Image src={work.cover} alt={work.title} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover group-hover:scale-105 transition-transform duration-500" priority={index < 10} />
                                                ) : ( 
                                                    <span className="text-[10px] text-gray-400 font-bold">No Cover</span> 
                                                )}
                                            </div>

                                            {/* 책 텍스트 정보 */}
                                            <div className="flex flex-col flex-1">
                                                <h3 className="font-bold text-[#1d1d1f] text-[15px] line-clamp-1 mb-1 group-hover:text-[#0066cc] transition-colors">{work.title}</h3>
                                                <p className="text-[12px] text-gray-500 line-clamp-1 mb-4">{work.author}</p>
                                                
                                                {/* 하단 뱃지 및 액션 아이콘 (이미지와 동일한 배치) */}
                                                <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
                                                    {/* 좌측: 상태 뱃지 */}
                                                    <Badge className="bg-rose-50 text-rose-500 hover:bg-rose-50 border-0 h-6 px-2 text-[11px] font-bold">
                                                        인기 작품
                                                    </Badge>

                                                    {/* 우측: 아이콘 모음 */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-0.5 text-gray-400" title="BoooknTalk 서재에 담긴 횟수">
                                                            <Users size={14} />
                                                            <span className="text-[11px] font-bold pt-[1px]">{work.added_count}</span>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => handleAddWishlist(e, work.edition_id, work.title)}
                                                            className="flex items-center justify-center w-6 h-6 rounded-full text-emerald-500 hover:bg-emerald-50 transition-colors"
                                                            title="내 서재에 담기"
                                                        >
                                                            <BookmarkPlus size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {activeTab !== 'works' && (
                                <div className="flex flex-col justify-center items-center py-32 text-gray-400 font-medium text-[15px] bg-white rounded-lg border border-dashed border-gray-200">
                                    <BookOpen size={40} className="mb-4 opacity-20" />
                                    아직 준비 중인 공간입니다.<br/>곧 멋진 큐레이션으로 찾아올게요!
                                </div>
                            )}
                        </>
                    )}
                </div>

                <Footer />
            </main>
        </div>
    );
}