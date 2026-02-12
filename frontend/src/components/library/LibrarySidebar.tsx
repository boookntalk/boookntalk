'use client';

import React from 'react';
import { 
    Book, BookOpen, Heart, CheckCircle, 
    PauseCircle, MessageSquare, BarChart2 
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const menuItems = [
    { title: "전체 도서", icon: Book, code: "ALL" },
    { title: "읽고 싶은", icon: Heart, code: "WISH" },
    { title: "읽는 중", icon: BookOpen, code: "READING" },
    { title: "완독", icon: CheckCircle, code: "COMPLETED" },
    { title: "중단", icon: PauseCircle, code: "STOPPED" },
];

const analyticsItems = [
    { title: "독서 통계", icon: BarChart2, code: "STATS" },
    { title: "기록 조각 (리뷰)", icon: MessageSquare, code: "REVIEW" },
];

export function LibrarySidebar() {
    // [임시] 활성화 상태 테스트용
    const activeTab = "ALL"; 

    return (
        // [수정] mt-16으로 헤더 높이만큼 정확히 내리고, top-0을 주어 위치 고정
        // border-r은 유지하되 색상을 연하게 조정
        <Sidebar 
            className="!fixed top-0 mt-14 h-[calc(100vh-4rem)] border-r border-gray-100 bg-white z-30" 
            collapsible="none"
        >
            <SidebarHeader className="p-6 pb-2">
                <div className="flex items-center gap-3 px-2">
                     <Avatar className="h-10 w-10 border border-gray-100">
                        <AvatarImage src="/placeholder-user.jpg" alt="User" />
                        <AvatarFallback className="bg-gray-50 text-xs font-bold text-gray-500">ME</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#1d1d1f]">나의 서재</span>
                        <span className="text-xs text-gray-500">독서 기록장</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-4 py-2">
                <SidebarGroup>
                    <SidebarGroupLabel className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">
                        보관함
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.code}>
                                    <SidebarMenuButton 
                                        isActive={activeTab === item.code}
                                        // [수정] 배경색 제거 & 텍스트 중심 스타일링
                                        className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-[14px] font-medium text-gray-600 bg-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors rounded-lg data-[active=true]:text-blue-600 data-[active=true]:font-bold data-[active=true]:bg-blue-50/50"
                                    >
                                        <item.icon className={`h-[18px] w-[18px] ${activeTab === item.code ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <span>{item.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">
                        분석 및 기록
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {analyticsItems.map((item) => (
                                <SidebarMenuItem key={item.code}>
                                    <SidebarMenuButton 
                                        className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-[14px] font-medium text-gray-600 bg-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors rounded-lg"
                                    >
                                        <item.icon className="h-[18px] w-[18px] text-gray-400" />
                                        <span>{item.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}