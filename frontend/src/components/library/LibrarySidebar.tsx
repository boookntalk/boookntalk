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
    Globe
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
    { title: "내 서재", href: "/library", icon: Library },
    {
        title: "나의 기록", icon: Edit3,
        subItems: [
            { title: '나의 한줄평', href: '/my-records/short-reviews', icon: MessageSquare },
            { title: '나의 메모', href: '/my-records/memos', icon: ScrollText },
        ]
    },
    { title: "독서 통계", href: "/statistics", icon: BarChart2 },
    { title: "사색 라운지", href: "/community", icon: Globe }
];

export function LibrarySidebar() {
    const pathname = usePathname();

    const isActiveRoute = (href: string) => {
        if (!href) return false;
        if (href === '/' && pathname !== '/') return false;
        return pathname.startsWith(href);
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
                                            className={`w-full justify-start gap-3 px-3 py-2.5 h-auto text-[15px] font-bold transition-colors rounded-xl ${isGroupActive ? 'text-[#0066cc]' : 'text-[#1d1d1f] hover:bg-gray-50'}`}
                                        >
                                            <item.icon className={`h-5 w-5 ${isGroupActive ? 'text-[#0066cc]' : 'text-gray-400'}`} />
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                        <SidebarMenuSub className="ml-2 border-l-gray-100 pl-2 my-1">
                                            {item.subItems.map((subItem, subIndex) => {
                                                 const isSubActive = isActiveRoute(subItem.href);
                                                 return (
                                                    <SidebarMenuSubItem key={subIndex}>
                                                        {/* [수정 1] passHref, legacyBehavior 제거 및 asChild 내부에 Link 배치 */}
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={isSubActive}
                                                            className="text-[14px] font-medium h-auto py-2 data-[active=true]:text-[#0066cc] data-[active=true]:font-bold data-[active=true]:bg-blue-50/50 rounded-lg"
                                                        >
                                                            <Link href={subItem.href} className="flex items-center gap-3">
                                                                <subItem.icon className={`h-[18px] w-[18px] ${isSubActive ? 'text-[#0066cc]' : 'text-gray-400 opacity-80'}`} />
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
                                    {/* [수정 2] SidebarMenuButton을 최상위 부모로 두고 asChild 속성 활용 */}
                                    <SidebarMenuButton 
                                        asChild
                                        isActive={isSingleActive}
                                        className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-[15px] font-bold text-[#1d1d1f] bg-transparent hover:bg-gray-50 transition-colors rounded-xl data-[active=true]:text-[#0066cc] data-[active=true]:bg-blue-50"
                                    >
                                        {/* Link가 a 태그 역할을 수행하므로 불필요한 a 태그를 삭제했습니다. */}
                                        <Link href={item.href || '#'}>
                                            <item.icon className={`h-5 w-5 ${isSingleActive ? 'text-[#0066cc]' : 'text-gray-400'}`} />
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