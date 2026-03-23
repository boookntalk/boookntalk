// 파일 경로: src/components/layout/LibrarySidebar.tsx
// 역할 및 기능: BoooknTalk 서비스의 좌측 네비게이션(LNB) 컴포넌트로, 사용자가 서재, 기록, 작가(및 옮긴이), 인사이트 등의 주요 기능으로 이동할 수 있도록 라우팅 메뉴를 제공합니다.

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    Library, 
    Edit3, 
    MessageSquare, 
    ScrollText, 
    BarChart2, 
    Globe,
    BookOpen,
    Tags,
    Bookmark,
    PenTool,
    PieChart,
    Users, 
    Clock,
    Languages // ▼ '옮긴이 타임라인' 하위 메뉴용 아이콘 추가
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
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
            { title: '작가', href: '/my-authors/timeline', icon: Clock },
            // ▼▼▼ [NEW] 작가 하위에 '옮긴이 타임라인' 메뉴 추가 ▼▼▼
            { title: '옮긴이(번역))', href: '/my-translators/timeline', icon: Languages },
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

// 함수 기능: 현재 URL 경로(pathname)와 메뉴의 href를 비교하여 해당 메뉴가 활성화 상태인지 판별합니다.
export function LibrarySidebar() {
    const pathname = usePathname();

    const isActiveRoute = (href: string) => {
        if (!href) return false;
        if (href === '/' && pathname !== '/') return false;
        
        // '도서(/library)' 메뉴 예외 처리: 하위 메뉴인 tags, wish로 이동했을 때는 도서 메뉴의 활성화를 강제로 끕니다.
        if (href === '/library') {
            if (pathname.startsWith('/library/tags') || pathname.startsWith('/library/wish')) {
                return false;
            }
        }
        
        // 정확히 일치하거나, 해당 경로의 하위 상세 페이지일 때만 활성화
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    return (
        <Sidebar 
            className="!fixed top-14 left-0 h-[calc(100vh-3.5rem)] border-r border-gray-100 bg-white z-40 shadow-sm" 
            collapsible="none"
        >
            <SidebarContent className="px-4 pb-2 pt-5">
                <SidebarGroup>
                    <SidebarMenu className="gap-1.5">
                        {navItems.map((item, index) => {
                            if (item.subItems) {
                                const isGroupActive = item.subItems.some(sub => isActiveRoute(sub.href));
                                return (
                                    <SidebarMenuItem key={index}>
                                        <SidebarMenuButton 
                                            asChild
                                            className={`w-full justify-start gap-3 px-3 py-2.5 h-auto text-[15px] font-bold rounded-none cursor-default hover:bg-transparent hover:text-inherit active:bg-transparent ${isGroupActive ? 'text-[#0066cc]' : 'text-[#1d1d1f]'}`}
                                        >
                                            <div>
                                                <item.icon className={`h-5 w-5 ${isGroupActive ? 'text-[#0066cc]' : 'text-gray-400'}`} />
                                                <span>{item.title}</span>
                                            </div>
                                        </SidebarMenuButton>
                                        
                                        <SidebarMenuSub className="ml-2 border-l-gray-100 pl-2 my-1">
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
                                        className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-[15px] font-bold text-[#1d1d1f] transition-all duration-200 rounded-none cursor-pointer hover:bg-gray-100 data-[active=true]:bg-[#e6f0fa] data-[active=true]:text-[#0066cc] data-[active=true]:shadow-none data-[active=true]:hover:bg-[#e6f0fa]"
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