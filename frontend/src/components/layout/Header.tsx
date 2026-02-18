'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, LogOut, Lock, X, ChevronRight } from 'lucide-react';
import { signIn, signOut, useSession } from "next-auth/react";
import { toast } from 'sonner';
import { DESIGN_TOKEN } from '@/constants/styles';

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();
    
    // [추가] 검색어 상태 관리
    const [keyword, setKeyword] = useState('');

    // [추가] 검색 핸들러
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault(); // 폼 제출 시 새로고침 방지
        if (!keyword.trim()) return;

        // 검색 결과 페이지로 이동 (쿼리 스트링 전달)
        // 실제 구현 시 /search/page.tsx가 필요합니다.
        router.push(`/search?q=${encodeURIComponent(keyword)}`);
    };

    const handleLibraryClick = () => {
        if (!session) {
            // [기존 코드 유지] 파스텔 톤 토스트
            toast.custom((t) => (
                <div className={`${DESIGN_TOKEN.ROUND.CARD} relative overflow-hidden bg-blue-50/95 backdrop-blur-md p-5 shadow-[0_8px_30px_rgba(0,102,204,0.15)] border border-blue-100 w-[340px] animate-in fade-in slide-in-from-top-2 duration-300`}>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100/50 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#0066cc]">
                            <Lock size={18} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 pt-0.5">
                            <h3 className="text-[16px] font-bold text-[#004080] mb-1">로그인이 필요해요</h3>
                            <p className="text-[13px] text-[#475569] leading-snug mb-4">
                                나의 서재는 회원님만의 공간입니다.<br />
                                3초 만에 시작하고 기록을 남겨보세요.
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => toast.dismiss(t)} className="px-4 py-2.5 rounded-xl bg-white text-[13px] font-semibold text-gray-500 hover:text-gray-700 hover:bg-white/80 transition-colors border border-blue-100/50">다음에</button>
                                <button onClick={() => { toast.dismiss(t); signIn('google'); }} className="flex-1 py-2.5 rounded-xl bg-[#0066cc] text-[13px] font-bold text-white hover:bg-[#0052a3] transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1 group">
                                    로그인 <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>
                        <button onClick={() => toast.dismiss(t)} className="text-blue-300 hover:text-blue-500 transition-colors -mt-1 -mr-2"><X size={18} /></button>
                    </div>
                </div>
            ), { duration: 5000, position: 'top-center' });
            return; 
        }
        router.push('/library');
    };

    return (
        <header className="sticky top-0 z-[100] w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
            <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
                
                {/* [1] 좌측: 로고 및 메뉴 그룹 (flex-1로 영역 확보) */}
                <div className="flex items-center gap-8 flex-1">
                    <Link href="/" className="flex items-center gap-2 cursor-pointer shrink-0 group">
                        <div className="relative w-8 h-8 transition-transform group-hover:scale-105"> 
                            <Image src="/logo.png" alt="BT Logo" fill className="object-contain" priority />
                        </div>
                        <span className="text-[17px] font-semibold tracking-tight text-[#1d1d1f]">boookntalk</span>
                    </Link>

                    {/* 데스크탑 메뉴 */}
                    <button 
                        onClick={handleLibraryClick}
                        className="hidden md:block text-[15px] font-medium text-[#1d1d1f]/80 hover:text-[#0066cc] transition-colors"
                    >
                        나의 서재
                    </button>
                </div>

                {/* [2] 중앙: 검색바 (새로운 영역) */}
                {/* flex-1로 남은 공간을 차지하되 max-w로 너비 제한 */}
                <div className="flex-1 flex justify-center max-w-[500px] px-4">
                    <form 
                        onSubmit={handleSearch}
                        className="relative w-full group"
                    >
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0066cc] transition-colors">
                            <Search size={16} />
                        </div>
                        <input 
                            type="text" 
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="도서명, 작가로 검색..." 
                            className="w-full h-10 bg-[#f5f5f7] border border-transparent hover:bg-white hover:border-[#0066cc] rounded-2xl pl-10 pr-4 text-[14px] text-[#1d1d1f] placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 focus:shadow-sm"
                        />
                    </form>
                </div>

                {/* [3] 우측: 유틸리티 영역 (flex-1로 좌측과 균형 맞춤 -> 우측 정렬) */}
                <div className="flex items-center justify-end gap-3 flex-1">
                    {session ? (
                        <div className="flex items-center gap-2 pl-2 ml-1">
                            {session.user?.image ? (
                                <img src={session.user.image} className="w-8 h-8 rounded-full border border-gray-100 shadow-sm" alt="profile" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200" />
                            )}
                             
                            <button onClick={() => signOut()} className="text-gray-400 hover:text-red-500 transition p-1.5 hover:bg-red-50 rounded-full ml-1" title="로그아웃">
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => signIn('google')}
                            className="text-[13px] font-medium bg-[#1d1d1f] text-white px-5 py-2 rounded-full hover:bg-[#333] transition-colors shadow-sm"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}