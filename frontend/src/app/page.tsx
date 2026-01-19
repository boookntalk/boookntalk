'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { signIn, signOut, useSession } from "next-auth/react";

// ✅ 해결 1: 별도의 컴포넌트는 export default 대신 일반 const로 선언합니다.
const GoogleLoginButton = () => {
    const handleGoogleLogin = () => {
        console.log("구글 로그인 시도 중...");
        signIn("google");
    };

    return (
        <button onClick={handleGoogleLogin}
            className="flex items-center gap-3 bg-white border border-gray-300 px-4 py-2 rounded-md shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 group">
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-[13px] font-semibold text-gray-700 group-hover:text-black font-sans">
                구글 로그인
            </span>
        </button>
    );
};

export default function Home() {
    return (
        <div className="min-h-screen bg-[#F9F9F7]">
            {/* 1. Header: 검색바 중앙 정렬 및 테두리 강화 */}
            <header className="bg-[#D9D9D9] border-b border-gray-300">
                <div className="max-w-[1440px] mx-auto px-10 h-20 flex items-center justify-between">
                    {/* 로고 영역 */}
                    <div className="flex-shrink-0 w-40">
                        <h1 className="text-2xl font-serif font-bold text-black tracking-tight">BooknTalk</h1>
                    </div>

                    {/* 검색 영역: 가로 가운데 정렬 및 테두리 색상 강화 */}
                    <div className="flex-grow flex justify-center">
                        <div className="relative w-full max-w-xl">
                            <input 
                                type="text" 
                                placeholder="ISBN, 제목, 저자 통합 검색"
                                // ✅ border-gray-400 부분을 수정하여 테두리 가시성을 높였습니다.
                                className="w-full bg-[#F3F3F3] border border-gray-400 rounded-full py-2.5 px-12 text-sm focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600 shadow-inner text-gray-700 placeholder:text-gray-400 transition-all"
                            />
                            <Search className="absolute left-4 top-2.5 text-gray-600 w-4 h-4" />
                        </div>
                    </div>

                    {/* 우측 메뉴 영역 */}
                    <div className="flex items-center gap-6 flex-shrink-0 w-80 justify-end">
                        <div className="flex gap-4 text-[12px] font-bold text-gray-600">
                            <span className="text-black cursor-pointer border-b border-black">KO</span>
                            <span className="cursor-pointer hover:text-black transition">EN</span>
                            <span className="cursor-pointer hover:text-black transition">JA</span>
                        </div>

                        <GoogleLoginButton />

                        <div className="flex flex-col gap-1.5 cursor-pointer ml-2 group">
                            <div className="w-6 h-[1.5px] bg-black group-hover:bg-orange-500 transition"></div>
                            <div className="w-6 h-[1.5px] bg-black group-hover:bg-orange-500 transition"></div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. Hero Section: 고도화된 Today's Quote 디자인 적용 */}
            <section className="relative h-[260px] flex items-center justify-center bg-[#1a1512]">
                <div className="absolute inset-0 overflow-hidden">
                    <img 
                        src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=2000" 
                        alt="Library"
                        className="w-full h-full object-cover opacity-60" 
                    />
                    <div className="absolute inset-0 bg-black/30"></div>
                </div>

                <div className="relative text-center z-10 px-4">
                    {/* ✅ 디자인적인 Today's Quote 배지 */}
                    <div className="relative inline-flex items-center justify-center mb-6">
                        <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-yellow-500/40"></div>
                        <div className="mx-3 px-5 py-1 border border-yellow-500/30 rounded-full bg-black/20 backdrop-blur-sm">
                            <span className="text-yellow-500/90 text-[10px] font-bold tracking-[0.4em] uppercase">Today's Quote</span>
                        </div>
                        <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-yellow-500/40"></div>
                    </div>

                    <h2 className="text-white text-2xl md:text-[32px] font-serif leading-[1.4] mb-4 break-keep font-medium tracking-tight drop-shadow-md">
                        “우리가 읽는 책이 우리 머리를 주먹으로<br/>
                        한 대 쳐서 깨우지 않는다면, 무엇 때문에 읽는가?”
                    </h2>

                    <p className="text-gray-300 font-serif text-base opacity-80 italic">
                        — 프란츠 카프카, 『변신』
                    </p>
                </div>
            </section>

            {/* 3. 실시간 광장 */}
            <main className="max-w-[1400px] mx-auto px-8 py-20">
                <div className="flex justify-between items-center mb-12">
                    <h3 className="text-3xl font-bold text-[#1a1512]">실시간 광장 하이라이트</h3>
                    <button className="text-gray-400 text-sm hover:text-black transition underline underline-offset-4">더 보기</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-[24px] p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] border border-gray-50 hover:shadow-md transition-shadow">
                            <span className="text-4xl text-orange-200 font-serif opacity-60">“</span>
                            <p className="text-[17px] font-medium text-gray-800 mt-2 mb-8 leading-snug h-20 overflow-hidden">
                                모든 책은 독자가 그것을 읽을 때 비로소 완성된다.
                            </p>
                            <div className="bg-[#FBFBF9] border-l-2 border-orange-200 p-4 rounded-r-lg mb-6">
                                <p className="text-xs text-gray-500 leading-relaxed italic">상용 서비스의 첫 테스트 데이터입니다.</p>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                <div className="text-[13px]">
                                    <span className="font-bold text-gray-700">지식탐험가</span>
                                    <span className="text-gray-400 ml-2">★ 4.8</span>
                                </div>
                                <div className="flex gap-3 text-[11px] font-bold text-gray-300">
                                    <span>❤️ 12</span>
                                    <span>💬 4</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}