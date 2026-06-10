// 경로: frontend/src/app/(main)/square/SquareClient.tsx
// 역할 및 기능: 광장 메뉴의 LNB 사이드바 제어 및 탭 네비게이션을 담당하며, 서버에서 받아온 실 데이터를 기반으로 내 서재와 완벽히 일치하는 레이아웃을 렌더링합니다.

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
    Home, ChevronRight, Search, 
    BookOpen, Users as UsersIcon, 
    PenTool
} from 'lucide-react';

import SubPageLayout from '@/components/layout/SubPageLayout';
import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";

interface SquareClientProps {
    initialWorks: any[];
    user: any;
}

export default function SquareClient({ initialWorks, user }: SquareClientProps) {
    const [activeLnb, setActiveLnb] = useState<string>('books');
    const [activeTab, setActiveTab] = useState<string>('works');

    // 실 데이터 바인딩
    const displayBooks = initialWorks || [];

    // LNB 메뉴 명시적 생성
    const menuGroups = [
        {
            id: 'books', label: '도서', icon: BookOpen, title: '도서 탐험',
            items: [
                { id: 'works', label: '인기 작품' },
                { id: 'long_reviews', label: '리뷰 (긴줄평)' },
                { id: 'short_reviews', label: '한줄평' },
                { id: 'notes', label: '독서노트' },
            ]
        },
        {
            id: 'authors', label: '작가', icon: PenTool, title: '작가 발견',
            items: [
                { id: 'trending_authors', label: '주목받는 작가' },
            ]
        },
        {
            id: 'booktalkers', label: '북토커', icon: UsersIcon, title: '북토커 커뮤니티',
            items: [
                { id: 'following', label: '팔로잉 피드' },
                { id: 'recommended', label: '추천 북토커' },
            ]
        }
    ];

    const activeGroupData = menuGroups.find(g => g.id === activeLnb) || menuGroups[0];
    const activeItemLabel = activeGroupData.items.find(i => i.id === activeTab)?.label || '';

    /**
     * @function handleLnbClick
     * @description LNB 메뉴 그룹(도서, 작가, 북토커) 간 이동 시 활성화 상태를 제어하고 하위 첫 번째 탭으로 화면을 동기화합니다.
     */
    const handleLnbClick = (groupId: string) => {
        setActiveLnb(groupId);
        const group = menuGroups.find(g => g.id === groupId);
        if (group && group.items.length > 0) {
            setActiveTab(group.items[0].id);
        }
    };

    /**
     * @function renderBreadcrumb
     * @description 현재 활성화된 LNB 및 탭 상태를 반영하여 상단 경로 정보를 렌더링합니다.
     */
    const renderBreadcrumb = () => (
        <div className="flex items-center gap-2 text-[13px] font-bold text-gray-400">
            <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                <Home size={15} /> <span>홈</span>
            </Link>
            <ChevronRight size={14} className="opacity-50" />
            <span>{activeGroupData.title}</span>
            <ChevronRight size={14} className="opacity-50" />
            <span className="text-[#1d1d1f] font-bold">{activeItemLabel}</span>
        </div>
    );

    /**
     * @function renderSearchAction
     * @description 글로벌 레이아웃 규격에 맞춘 우측 상단 광장 통합 검색 바를 정의합니다.
     */
    const renderSearchAction = () => (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
                type="text" 
                placeholder="광장 내 검색..." 
                className="pl-9 pr-4 py-1.5 w-full bg-white border border-gray-200 rounded-full text-[13px] outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/20 transition-all"
            />
        </div>
    );

    /**
     * @function renderTabs
     * @description 활성화된 LNB 메뉴 그룹에 소속된 서브 탭 메뉴들을 상단에 고정 출력합니다.
     */
    const renderTabs = () => (
        <>
            {activeGroupData.items.map((item) => (
                <button
                    key={item.id} 
                    onClick={() => setActiveTab(item.id)}
                    /* 💡 [핵심 수정 1] pb-2를 pb-[10px] 또는 pb-1.5로 미세 조정하여 내 서재의 밑줄 위치와 완벽히 맞춥니다. */
                    /* border-b-2 대신 border-b-[2.5px]를 사용하여 시각적 안정감을 줄 수도 있습니다. */
                    className={`pb-[10px] text-[15px] font-bold transition-all whitespace-nowrap border-b-2 ${
                        activeTab === item.id 
                            ? 'text-[#0066cc] border-[#0066cc]' 
                            : 'text-gray-400 border-transparent hover:text-[#1d1d1f]'
                    }`}
                >
                    {item.label}
                    {activeTab === item.id && activeTab === 'works' && displayBooks.length > 0 && (
                        <span className="ml-1.5 text-[12px] opacity-70">{displayBooks.length}</span>
                    )}
                </button>
            ))}
        </>
    );

    return (
        <SidebarProvider>
            <div className="flex w-full min-h-screen relative bg-[var(--bg-main)]">
                
                {/* 💡 [LNB 컴포넌트 완전 통제] globals.css에 정의된 --sidebar-width (260px)를 정확히 호출합니다. */}
                <Sidebar 
                    className="!fixed top-[var(--header-height,64px)] left-0 h-[calc(100vh-var(--header-height,64px))] border-r border-[var(--border-light)] bg-white z-40 w-[var(--sidebar-width)]" 
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

                {/* 💡 [핵심 수정 2] fixed된 사이드바의 너비(260px)만큼 main 요소에 좌측 마진(ml-[var(--sidebar-width)])을 주어 겹침을 방지합니다. */}
                <main className="flex-1 w-full min-w-0 ml-[var(--sidebar-width)]">
                    <SubPageLayout 
                        breadcrumb={renderBreadcrumb()}
                        actionArea={renderSearchAction()}
                        titleOrTabs={renderTabs()}
                    >
                        <div className="w-full animate-in fade-in duration-500">
                            {activeTab === 'works' && displayBooks.length > 0 ? (
                                /* 💡 [핵심 수정 3] xl:grid-cols-5를 lg:grid-cols-5로 변경하고, 간격을 --spacing-1cm 변수로 통일했습니다. */
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-[var(--spacing-1cm,38px)] gap-y-10 pt-4">
                                    {displayBooks.map((book: any, idx: number) => (
                                        <div key={book.id || idx} className="flex flex-col gap-3 group cursor-pointer">
                                            
                                            {/* 도서 실 표지 이미지 렌더링 파이프라인 */}
                                            <div className="relative w-full aspect-[1/1.45] bg-[#F7F5F1] border border-[#E7E2D9] rounded-sm overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                                {book.cover ? (
                                                    <img 
                                                        src={book.cover} 
                                                        alt={book.title || 'BoooknTalk 도서'} 
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#A0AABF]">
                                                        <BookOpen className="opacity-20 mb-2" size={40} />
                                                        <span className="text-[11px] font-medium">No Cover</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* 실 메타데이터 연동 (도서명 / 저자명) */}
                                            <div className="flex flex-col gap-0.5 px-0.5">
                                                <h3 className="text-[14px] font-bold text-[#1d1d1f] line-clamp-1 group-hover:text-[#0066cc] transition-colors">
                                                    {book.title}
                                                </h3>
                                                <p className="text-[12px] text-[#A0AABF] font-medium line-clamp-1">
                                                    {book.author}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : activeTab === 'works' ? (
                                <div className="flex flex-col items-center justify-center py-40 bg-white rounded-lg border border-dashed border-gray-200 mt-2">
                                    <BookOpen size={48} className="text-gray-200 mb-4" />
                                    <p className="text-gray-400 font-medium">광장에 등록된 실시간 도서 데이터가 존재하지 않습니다.</p>
                                </div>
                            ) : null}

                            {activeTab !== 'works' && (
                                <div className="flex flex-col items-center justify-center py-40 bg-white rounded-lg border border-dashed border-gray-200 mt-2">
                                    <BookOpen size={48} className="text-gray-200 mb-4" />
                                    <p className="text-gray-400 font-medium">아직 준비 중인 공간입니다.<br />곧 멋진 사색 기록으로 찾아올게요!</p>
                                </div>
                            )}
                        </div>
                    </SubPageLayout>
                </main>
            </div>
        </SidebarProvider>
    );
}