// 파일 경로: src/components/library/LibrarySidebar.tsx
// 역할 및 기능: BoooknTalk 서비스의 내 서재 전용 좌측 네비게이션(LNB). 메인 컨텐츠 영역의 브레드크럼(pt-4, min-h-[40px])과 수학적으로 완벽하게 동일한 높이를 갖도록 pt-4 및 h-10 클래스를 적용하여 영점 조절을 완료했습니다.

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    Library, Edit3, MessageSquare, ScrollText, 
    BarChart2, Globe, BookOpen, Tags, Bookmark,
    PenTool, PieChart, Users, Clock, Languages
} from 'lucide-react';
import {
    Sidebar, SidebarContent, SidebarGroup, SidebarMenu,
    SidebarMenuButton, SidebarMenuItem, SidebarMenuSub,
    SidebarMenuSubItem, SidebarMenuSubButton,
} from "@/components/ui/sidebar";

const navItems = [
    {
        title: "내 서재", icon: Library,
        subItems: [
            { title: '도서', href: '/library', icon: BookOpen },
            { title: '나의 태그', href: '/library/tags', icon: Tags },
            { title: '읽고 싶은 도서', href: '/library/wish', icon: Bookmark }
        ]
    },
    {
        title: "나의 기록", icon: Edit3,
        subItems: [
            { title: '독서노트', href: '/my-records/notes', icon: ScrollText },
            { title: '한줄평', href: '/my-records/short-reviews', icon: MessageSquare },
            { title: '긴줄평', href: '/my-records/long-reviews', icon: PenTool },
        ]
    },
    {
        title: "나의 작가", icon: Users,
        subItems: [
            { title: '작가', href: '/my-authors/writer', icon: Clock },
            { title: '옮긴이(번역)', href: '/my-authors/translator', icon: Languages },
        ]
    },
    {
        title: "인사이트", icon: BarChart2,
        subItems: [
            { title: '서재 인사이트', href: '/my-records/insights', icon: PieChart },
        ]
    },
    { title: "사색 라운지", href: "/community", icon: Globe }
];

export function LibrarySidebar() {
    const pathname = usePathname();

    const isActiveRoute = (href: string) => {
        if (!href) return false;
        if (href === '/' && pathname !== '/') return false;
        if (href === '/library') {
            if (pathname.startsWith('/library/tags') || pathname.startsWith('/library/wish')) {
                return false;
            }
        }
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    return (
        <Sidebar 
            className="!fixed top-14 left-0 h-[calc(100vh-3.5rem)] border-r border-gray-100 bg-white z-40 shadow-sm" 
            collapsible="none"
        >
            {/* 💡 [영점 조절 1] pt-5 -> pt-4 로 변경하여 메인 콘텐츠 상단 여백(16px)과 일치시킴 */}
            <SidebarContent className="px-4 pb-2 pt-4">
                {/* 💡 [완벽 영점 조절] shadcn/ui가 몰래 가지고 있던 기본 패딩을 강제로 없앱니다 (!p-0) */}
                <SidebarGroup className="!p-0 !m-0">
                    <SidebarMenu className="gap-1.5 !mt-0">
                        {navItems.map((item, index) => {
                            if (item.subItems) {
                                const isGroupActive = item.subItems.some(sub => isActiveRoute(sub.href));
                                return (
                                    <SidebarMenuItem key={index}>
                                        <SidebarMenuButton 
                                            asChild
                                            // 높이 40px(h-10) 유지
                                            className={`w-full justify-start gap-3 px-3 h-10 text-[15px] font-bold rounded-none cursor-default hover:bg-transparent hover:text-inherit active:bg-transparent ${isGroupActive ? 'text-[#0066cc]' : 'text-[#1d1d1f]'}`}
                                        >
                                            <div>
                                                <item.icon className={`h-5 w-5 ${isGroupActive ? 'text-[#0066cc]' : 'text-gray-400'}`} />
                                                <span>{item.title}</span>
                                            </div>
                                        </SidebarMenuButton>
                                        
                                        <SidebarMenuSub className="ml-2 border-l-gray-100 pl-2 my-1">
                                            {/* ... 하위 메뉴 렌더링 (기존 동일) ... */}
                                            {item.subItems.map((subItem, subIndex) => {
                                                 const isSubActive = isActiveRoute(subItem.href);
                                                 return (
                                                    <SidebarMenuSubItem key={subIndex}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={isSubActive}
                                                            className="text-[14px] font-medium h-auto py-2 transition-all duration-200 rounded-none cursor-pointer hover:bg-gray-100 data-[active=true]:bg-[#e6f0fa] data-[active=true]:text-[#0066cc] data-[active=true]:font-bold data-[active=true]:shadow-none data-[active=true]:hover:bg-[#e6f0fa]"
                                                        >
                                                            <Link href={subItem.href} className="flex items-center gap-3">
                                                                <subItem.icon className={`h-[18px] w-[18px] transition-colors ${isSubActive ? 'text-[#0066cc]' : 'text-gray-400 opacity-80'}`} />
                                                                <span>{subItem.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                );
                                            })}
                                        </SidebarMenuSub>
                                    </SidebarMenuItem>
                                );
                            }

                            const isSingleActive = isActiveRoute(item.href || '');
                            return (
                                <SidebarMenuItem key={index}>
                                    <SidebarMenuButton 
                                        asChild
                                        isActive={isSingleActive}
                                        className="w-full justify-start gap-3 px-3 h-10 text-[15px] font-bold text-[#1d1d1f] transition-all duration-200 rounded-none cursor-pointer hover:bg-gray-100 data-[active=true]:bg-[#e6f0fa] data-[active=true]:text-[#0066cc] data-[active=true]:shadow-none data-[active=true]:hover:bg-[#e6f0fa]"
                                    >
                                        <Link href={item.href || '#'}>
                                            <item.icon className={`h-5 w-5 transition-colors ${isSingleActive ? 'text-[#0066cc]' : 'text-gray-400'}`} />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}