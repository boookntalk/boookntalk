'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
// ▼▼▼ [수정 1] 현재 경로를 추적하기 위해 usePathname 추가 ▼▼▼
import { useRouter, usePathname } from 'next/navigation';
import { Search, LogOut, Lock, X, ChevronRight, ArrowRight } from 'lucide-react';
import { signIn, signOut, useSession } from "next-auth/react";
import { toast } from 'sonner';
import { DESIGN_TOKEN } from '@/constants/styles';
import ProfileEditModal from '@/components/profile/ProfileEditModal';

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();
    // ▼▼▼ [수정 2] 현재 URL 경로 가져오기 ▼▼▼
    const pathname = usePathname() || '';
    
    // 검색어 상태 관리
    const [keyword, setKeyword] = useState('');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // 검색 핸들러
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault(); 
        if (!keyword.trim()) return;

        router.push(`/search?q=${encodeURIComponent(keyword)}`);
    };

    // 내 서재 클릭 핸들러 (비로그인 방어 로직)
    const handleLibraryClick = () => {
        if (!session) {
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
                                내 서재는 회원님만의 공간입니다.<br />
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
        <>
            <header className="sticky top-0 z-[100] w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
                    
                    {/* [1] 좌측: 로고 및 메뉴 그룹 */}
                    <div className="flex items-center gap-8 flex-1">
                        <Link href="/" className="flex items-center gap-2 cursor-pointer shrink-0 group">
                            <div className="relative w-8 h-8 transition-transform group-hover:scale-105"> 
                                <Image src="/logo.png" alt="BT Logo" fill className="object-contain" priority />
                            </div>
                            <span className="text-[17px] font-semibold tracking-tight text-[#1d1d1f]">BoooknTalk</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-6">
                            {/* ▼▼▼ [수정 3] 현재 URL에 따라 스타일 동적 변경 (Active State) ▼▼▼ */}
                            <button 
                                onClick={handleLibraryClick}
                                className={`text-[15px] transition-colors ${
                                    pathname.startsWith('/library') 
                                    ? 'font-bold text-[#0066cc]' 
                                    : 'font-medium text-[#1d1d1f]/80 hover:text-[#0066cc]'
                                }`}
                            >
                                내 서재
                            </button>
                            <button 
                                onClick={() => router.push('/square')}
                                className={`text-[15px] transition-colors ${
                                    pathname.startsWith('/square') 
                                    ? 'font-bold text-[#0066cc]' 
                                    : 'font-medium text-[#1d1d1f]/80 hover:text-[#0066cc]'
                                }`}
                            >
                                광장
                            </button>
                        </nav>
                    </div>

                    {/* [2] 중앙: 검색바 */}
                    <div className="flex-1 flex justify-center max-w-[500px] px-4">
                        <form 
                            onSubmit={handleSearch}
                            className="relative w-full group"
                        >
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0066cc] transition-colors pointer-events-none">
                                <Search size={16} />
                            </div>
                            <input 
                                type="text" 
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="도서명, 작가로 검색..." 
                                className="w-full h-10 bg-[#f5f5f7] border border-transparent hover:bg-white hover:border-[#0066cc] rounded-2xl pl-10 pr-12 text-[14px] text-[#1d1d1f] placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 focus:shadow-sm"
                            />
                            <button 
                                type="submit"
                                title="검색하기"
                                className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-xl transition-all duration-200 ${
                                    keyword.trim().length > 0 
                                    ? 'bg-[#0066cc] text-white shadow-sm hover:bg-[#0052a3] scale-100 opacity-100 cursor-pointer' 
                                    : 'bg-transparent text-gray-300 scale-95 opacity-50 pointer-events-none'
                                }`}
                            >
                                <ArrowRight size={14} strokeWidth={2.5} />
                            </button>
                        </form>
                    </div>

                    {/* [3] 우측: 유틸리티 영역 */}
                    <div className="flex items-center justify-end gap-3 flex-1">
                        {session ? (
                            <div className="flex items-center gap-1 pl-2 ml-1">
                                <button 
                                    onClick={() => router.push('/mypage')}
                                    className="w-8 h-8 rounded-full border border-gray-200 shadow-sm overflow-hidden hover:ring-2 hover:ring-[#0066cc]/50 transition-all cursor-pointer mr-1"
                                    title="나의 독서 통계 및 프로필"
                                >
                                    {session.user?.image ? (
                                        <img src={session.user.image} className="w-full h-full object-cover" alt="profile" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200" />
                                    )}
                                </button>

                                <button onClick={() => signOut()} className="text-gray-400 hover:text-red-500 transition p-1.5 hover:bg-red-50 rounded-full" title="로그아웃">
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

            <ProfileEditModal 
                isOpen={isProfileModalOpen} 
                onClose={() => setIsProfileModalOpen(false)} 
                session={session} 
            />
        </>
    );
}