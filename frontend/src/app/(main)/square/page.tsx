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
import FollowingFeed from '@/components/community/FollowingFeed';

// ▼▼▼ [핵심 1] 내 서재와 100% 동일한 LNB 구조를 위해 shadcn UI 임포트 ▼▼▼
import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";

export default function SquarePage() {
    const router = useRouter();
    const { data: session, status } = useSession(); 
    
    const [activeLnb, setActiveLnb] = useState<string>('books');
    const [activeTab, setActiveTab] = useState<string>('works');
    
    const [works, setWorks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const menuGroups = [
        {
            id: 'books',
            label: '도서',
            icon: BookOpen,
            title: '도서 탐험',
            items: [
                { id: 'works', label: '인기 작품' },
                { id: 'long_reviews', label: '리뷰 (긴줄평)' },
                { id: 'short_reviews', label: '한줄평' },
                { id: 'notes', label: '독서노트' },
            ]
        },
        {
            id: 'authors',
            label: '작가',
            icon: PenTool,
            title: '작가 발견',
            items: [
                { id: 'trending_authors', label: '주목받는 작가' },
            ]
        },
        {
            id: 'booktalkers',
            label: '북토커',
            icon: UsersIcon,
            title: '북토커 커뮤니티',
            items: [
                { id: 'following', label: '팔로잉 피드' },
                { id: 'recommended', label: '추천 북토커' },
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

    // [1] 인기 작품 데이터 로딩
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
        <SidebarProvider>
            <div className="flex w-full h-[calc(100vh-3.5rem)] bg-[#F5F5F7] overflow-hidden">
                
                {/* ▼▼▼ [핵심 3] 내 서재 코드(LibrarySidebar)와 100% 동일한 컴포넌트/클래스 적용 ▼▼▼ */}
                <Sidebar 
                    className="!fixed top-14 left-0 h-[calc(100vh-3.5rem)] border-r border-gray-100 bg-white z-40 shadow-sm" 
                    collapsible="none"
                >
                    <SidebarContent className="px-4 pb-2 pt-5">
                        <SidebarGroup>
                            <SidebarMenu className="gap-1.5">
                                {menuGroups.map((group) => {
                                    const isActive = activeLnb === group.id;
                                    return (
                                        <SidebarMenuItem key={group.id}>
                                            <SidebarMenuButton 
                                                isActive={isActive}
                                                onClick={() => handleLnbClick(group.id)}
                                                className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-[15px] font-bold text-[#1d1d1f] bg-transparent hover:bg-gray-50 transition-colors rounded-xl data-[active=true]:text-[#0066cc] data-[active=true]:bg-blue-50 cursor-pointer"
                                            >
                                                <group.icon className={`h-5 w-5 ${isActive ? 'text-[#0066cc]' : 'text-gray-400'}`} />
                                                <span>{group.label}</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>

                {/* ▼▼▼ [핵심 4] LNB가 '고정(fixed)'이므로, 메인 콘텐츠가 가려지지 않게 좌측 여백(ml-64) 256px 확보 ▼▼▼ */}
                <main className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide relative ml-64">
                    
                    {/* 상단 Sticky Header */}
                    <div className="sticky top-0 z-20 bg-[#F5F5F7]/90 backdrop-blur-md pt-4 px-[var(--spacing-1cm,32px)] border-b border-gray-200 transition-all">
                        
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-[13px] font-bold text-gray-400">
                                <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                                    <Home size={15} /> <span>홈</span>
                                </Link>
                                <ChevronRight size={14} className="opacity-50" />
                                <span>{activeGroupData.title}</span>
                                <ChevronRight size={14} className="opacity-50" />
                                <span className="text-[#1d1d1f]">{activeItemLabel}</span>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="text" placeholder="광장 내 검색..." 
                                    className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-[14px] w-64 focus:w-80 transition-all duration-300 outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] shadow-sm"
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide -mb-[1px]">
                            {activeGroupData.items.map((item) => (
                                <button
                                    key={item.id} onClick={() => setActiveTab(item.id)}
                                    className={`pb-2 text-[15px] font-bold transition-all whitespace-nowrap border-b-2 ${
                                        activeTab === item.id ? 'text-[#0066cc] border-[#0066cc]' : 'text-gray-400 border-transparent hover:text-[#1d1d1f]'
                                    }`}
                                >
                                    {item.label}
                                    {activeTab === item.id && activeTab === 'works' && (
                                        <span className="ml-1.5 text-[12px] text-[#0066cc]">{works.length}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 하단 콘텐츠 바디 영역 */}
                    <div className="flex-1 p-[var(--spacing-1cm,32px)] pt-6 pb-32">
                        {isLoading && activeTab === 'works' ? (
                            <div className="flex justify-center items-center py-32">
                                <Loader2 className="animate-spin text-[#0066cc]" size={40} />
                            </div>
                        ) : (
                            <>
                                {/* [1] 인기 작품 탭 */}
                                {activeTab === 'works' && (
                                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
                                        {works.map((work, index) => (
                                            <div 
                                                key={work.edition_id} 
                                                onClick={() => router.push(`/work/${work.work_id}`)}
                                                className="group cursor-pointer flex flex-col h-full bg-white rounded-sm p-4 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative"
                                            >
                                                <div className="relative aspect-[1/1.4] w-[80%] mx-auto rounded-sm overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-3 bg-gray-50 flex items-center justify-center border border-gray-100 transition-all duration-300 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
                                                    {work.cover ? (
                                                        <Image src={work.cover} alt={work.title} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover group-hover:scale-105 transition-transform duration-500" priority={index < 10} />
                                                    ) : ( 
                                                        <span className="text-[10px] text-gray-400 font-bold">No Cover</span> 
                                                    )}
                                                </div>

                                                <div className="flex flex-col flex-1">
                                                    <h3 className="font-bold text-[#1d1d1f] text-[14px] line-clamp-1 mb-1 group-hover:text-[#0066cc] transition-colors">{work.title}</h3>
                                                    <p className="text-[11px] text-gray-400 line-clamp-1 mb-3">{work.author}</p>
                                                    
                                                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
                                                        <Badge className="bg-rose-50 text-rose-500 hover:bg-rose-50 border-0 h-5 px-1.5 text-[10px] font-bold">
                                                            인기 작품
                                                        </Badge>

                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-0.5 text-gray-400" title="BoooknTalk 서재에 담긴 횟수">
                                                                <Users size={12} />
                                                                <span className="text-[10px] font-bold pt-[1px]">{work.added_count}</span>
                                                            </div>
                                                            {work.average_rating > 0 && (
                                                                <div className="flex items-center gap-0.5 text-amber-400" title="평균 별점">
                                                                    <Star size={10} fill="currentColor" />
                                                                    <span className="text-[10px] font-bold text-gray-500 pt-[1px]">{work.average_rating}</span>
                                                                </div>
                                                            )}
                                                            <button 
                                                                onClick={(e) => handleAddWishlist(e, work.edition_id, work.title)}
                                                                className="flex items-center justify-center w-5 h-5 rounded-full text-gray-400 hover:bg-[#0066cc] hover:text-white transition-colors ml-1"
                                                                title="내 서재에 담기"
                                                            >
                                                                <BookmarkPlus size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* [2] 팔로잉 피드 탭 */}
                                {activeTab === 'following' && (
                                    <FollowingFeed currentUserEmail={session?.user?.email} />
                                )}
                                
                                {/* [3] 기타 미구현 탭 */}
                                {activeTab !== 'works' && activeTab !== 'following' && (
                                    <div className="flex flex-col justify-center items-center py-32 text-gray-400 font-medium text-[15px] bg-white rounded-lg border border-dashed border-gray-200 mt-4">
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
        </SidebarProvider>
    );
}