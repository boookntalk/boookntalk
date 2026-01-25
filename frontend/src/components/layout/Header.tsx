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
                
                {/* [1] 로고 영역 */}
                <div 
                    className="flex items-center gap-2 cursor-pointer shrink-0" 
                    onClick={() => window.location.href = '/'}
                >
                    <div className="relative w-8 h-8">
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
                </div>

                {/* [2] 나의 서재 메뉴 영역 */}
                {/* [여백 조절 안내] 
                    - ml-[115px]가 로고 끝에서 메뉴 시작점까지 약 3cm 간격입니다.
                    - 이 수치를 조정하여 메뉴의 위치를 원하는 대로 옮길 수 있습니다.
                */}
                <div className="flex items-center ml-[115px]"> 
                    <Link 
                        href="/library" 
                        className="text-[16px] font-medium text-[#1d1d1f]/80 hover:text-blue-600 transition-colors"
                    >
                        나의 서재
                    </Link>
                </div>

                {/* [3] 우측 유틸리티 영역 (검색 및 유저) */}
                <div className="flex items-center gap-5 ml-auto">
                    <Search className="w-4 h-4 text-[#1d1d1f]/70 cursor-pointer hover:text-black transition" />
                    
                    {session ? (
                        <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                            {session.user?.image && (
                                <img 
                                    src={session.user.image} 
                                    className="w-6 h-6 rounded-full border border-gray-100" 
                                    alt="profile" 
                                />
                            )}
                            <span className="text-[11px] font-medium text-gray-600">
                                {session.user?.name}님
                            </span>
                            <button 
                                onClick={() => signOut()} 
                                className="hover:text-red-500 transition px-1"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => signIn('google')}
                            className="text-[12px] font-medium text-[#0066cc] hover:underline"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}