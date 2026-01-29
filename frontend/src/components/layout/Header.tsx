'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, LogOut } from 'lucide-react';
import { signIn, signOut, useSession } from "next-auth/react";

export default function Header() {
    const { data: session } = useSession();

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center">
                
                {/* [1] 로고 영역 - Link 컴포넌트로 변경하여 새로고침 없는 이동 구현 */}
                <Link href="/" className="flex items-center gap-2 cursor-pointer shrink-0 group">
                    <div className="relative w-12 h-12 transition-transform group-hover:scale-105">
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

                {/* [2] 나의 서재 메뉴 영역 */}
                <div className="flex items-center ml-[115px]"> 
                    <Link 
                        href="/library" 
                        className="text-[16px] font-medium text-[#1d1d1f]/80 hover:text-[#0066cc] transition-colors"
                    >
                        나의 서재
                    </Link>
                </div>

                {/* [3] 우측 유틸리티 영역 */}
                <div className="flex items-center gap-5 ml-auto">
                    {/* 검색 기능 아이콘 */}
                    <button className="p-1 hover:bg-gray-100 rounded-full transition">
                        <Search className="w-4 h-4 text-[#1d1d1f]/70 cursor-pointer hover:text-black" />
                    </button>
                    
                    {session ? (
                        /* 로그인 성공 시: 유저 프로필 및 로그아웃 */
                        <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                            {session.user?.image && (
                                <img 
                                    src={session.user.image} 
                                    className="w-6 h-6 rounded-full border border-gray-100 shadow-sm" 
                                    alt="profile" 
                                />
                            )}
                            <span className="text-[11px] font-medium text-gray-600">
                                {session.user?.name}님
                            </span>
                            <button 
                                onClick={() => signOut()} 
                                className="text-gray-400 hover:text-red-500 transition px-1"
                                title="로그아웃"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        /* 로그인 전: Sign In 버튼 */
                        <button 
                            onClick={() => signIn('google')}
                            className="text-[12px] font-medium text-[#0066cc] hover:underline px-2 py-1"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}