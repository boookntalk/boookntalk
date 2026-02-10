'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // [추가] 페이지 이동을 위해 필요
import { Search, LogOut } from 'lucide-react';
import { signIn, signOut, useSession } from "next-auth/react";
import { toast } from 'sonner'; // [추가] 토스트 라이브러리

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();

    // [로직 추가] 나의 서재 클릭 핸들러
    const handleLibraryClick = () => {
        // 1. 로그인이 안 되어 있다면?
        if (!session) {
            toast("로그인하고 나만의 서재를 채워보세요!", {
                description: "나의 서재는 회원 전용 공간입니다.",
                duration: 5000, // 3초 뒤 사라짐
                action: {
                    label: 'OK',
                    // OK 버튼 누르면 로그인 창 띄우기 (원치 않으시면 onClick 제거 가능)
                    onClick: () => signIn('google'), 
                },
            });
            return; // 페이지 이동 중단
        }

        // 2. 로그인이 되어 있다면 정상 이동
        router.push('/library');
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
            {/* 가로 중앙 정렬을 위한 컨테이너 수정 (justify-between 활용 추천) */}
            <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
                
                {/* [1] 좌측: 로고 영역 */}
                <div className="flex items-center">
                    <Link href="/" className="flex items-center gap-2 cursor-pointer shrink-0 group">
                        <div className="relative w-8 h-8 transition-transform group-hover:scale-105"> 
                            {/* 로고 크기는 헤더 높이(h-14) 고려하여 w-8~10 정도가 적당합니다 */}
                            <Image 
                                src="/logo.png" 
                                alt="BT Logo" 
                                fill 
                                className="object-contain" 
                                priority 
                            />
                        </div>
                        <span className="text-[17px] font-semibold tracking-tight text-[#1d1d1f]">
                            boookntalk
                        </span>
                    </Link>

                    {/* [2] 중앙(좌측 치우침): 나의 서재 메뉴 */}
                    {/* 기존 ml-[115px] 대신 마진을 적절히 주어 배치 */}
                    <div className="ml-10"> 
                        <button 
                            onClick={handleLibraryClick}
                            className="text-[15px] font-medium text-[#1d1d1f]/80 hover:text-[#0066cc] transition-colors"
                        >
                            나의 서재
                        </button>
                    </div>
                </div>

                {/* [3] 우측: 유틸리티 영역 (검색, 로그인) */}
                <div className="flex items-center gap-4">
                    {/* 검색 아이콘 */}
                    <button className="p-2 hover:bg-gray-100 rounded-full transition text-[#1d1d1f]/70 hover:text-black">
                        <Search className="w-4 h-4" />
                    </button>
                    
                    {session ? (
                        /* 로그인 성공 시: 유저 프로필 및 로그아웃 */
                        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 ml-1">
                            {session.user?.image ? (
                                <img 
                                    src={session.user.image} 
                                    className="w-7 h-7 rounded-full border border-gray-100 shadow-sm" 
                                    alt="profile" 
                                />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-gray-200" />
                            )}
                            
                            <span className="text-[12px] font-medium text-gray-700 hidden sm:block">
                                {session.user?.name}님
                            </span>
                            
                            <button 
                                onClick={() => signOut()} 
                                className="text-gray-400 hover:text-red-500 transition p-1 hover:bg-red-50 rounded-full ml-1"
                                title="로그아웃"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        /* 로그인 전: Sign In 버튼 */
                        <button 
                            onClick={() => signIn('google')}
                            className="text-[13px] font-medium bg-[#1d1d1f] text-white px-4 py-1.5 rounded-full hover:bg-[#333] transition-colors"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}