'use client';

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import { 
    Home, ChevronRight, Search, 
    BookOpen, Users as UsersIcon, 
    MessageSquare, PenTool
} from 'lucide-react';
import FollowingFeed from '@/components/community/FollowingFeed';

import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";

import SquareWorkList from '@/components/square/SquareWorkList';

export default function SquarePage() {
    const [activeLnb, setActiveLnb] = useState<string>('books');
    const [activeTab, setActiveTab] = useState<string>('works');
    
    // 하위 컴포넌트에서 받아올 도서 개수 상태
    const [worksCount, setWorksCount] = useState<number>(0);

    const { data: session } = useSession();

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

    return (
        <SidebarProvider>
            <div className="flex w-full h-[calc(100vh-3.5rem)] bg-[#F5F5F7] overflow-hidden">
                
                {/* LNB 사이드바 영역 */}
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

                {/* 메인 콘텐츠 영역 */}
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
                                    {/* 하위 컴포넌트에서 전달받은 개수 렌더링 */}
                                    {activeTab === item.id && activeTab === 'works' && worksCount > 0 && (
                                        <span className="ml-1.5 text-[12px] text-[#0066cc]">{worksCount}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 하단 콘텐츠 바디 영역 */}
                    <div className="flex-1 p-[var(--spacing-1cm,32px)] pt-6 pb-32">
                        
                        {/* [1] 인기 작품 탭: 분리한 컴포넌트 딱 한 줄로 호출! */}
                        {activeTab === 'works' && (
                            <SquareWorkList onCountLoaded={setWorksCount} />
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
                        
                    </div>
                    <Footer />
                </main>
            </div>
        </SidebarProvider>
    );
}