'use client';

import React from 'react';
import Image from 'next/image';
import { Search, LogOut, User } from 'lucide-react';
import { signIn, signOut, useSession } from "next-auth/react";

export default function Header() {
    const { data: session } = useSession();

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
                
                {/* 로고 영역: BT 로고 이미지 적용 */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
                    <div className="relative w-8 h-8">
                        <Image src="/logo.png" alt="BT Logo" fill className="object-contain" priority />
                    </div>
                    <span className="text-[17px] font-semibold tracking-tight text-[#1d1d1f]">boookntalk</span>
                </div>

                {/* 중앙 네비게이션: Apple 스타일 텍스트 */}
                <nav className="hidden md:flex items-center gap-8 text-[12px] font-medium text-[#1d1d1f]/80">
                    <a href="#" className="hover:text-black transition-colors">도서광장</a>
                    <a href="#" className="hover:text-black transition-colors">커뮤니티</a>
                    <a href="#" className="hover:text-black transition-colors">서비스 소개</a>
                </nav>

                {/* 우측 유틸리티 */}
                <div className="flex items-center gap-5">
                    <Search className="w-4 h-4 text-[#1d1d1f]/70 cursor-pointer hover:text-black transition" />
                    
                    {session ? (
                        <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                            {session.user?.image && (
                                <img src={session.user.image} className="w-6 h-6 rounded-full" alt="profile" />
                            )}
                            <span className="text-[11px] font-medium text-gray-600">{session.user?.name}님</span>
                            <button onClick={() => signOut()} className="hover:text-red-500 transition"><LogOut className="w-4 h-4" /></button>
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
// 'use client';

// import React from 'react';
// import Image from 'next/image'; // Next.js의 최적화된 이미지 컴포넌트
// import { Search, Menu, LogOut, User } from 'lucide-react';
// import { signIn, signOut, useSession } from "next-auth/react";

// export default function Header() {
//     const { data: session } = useSession();

//     return (
//         <header className="bg-[#1a1c20] text-white border-b border-white/5 shadow-2xl">
//             <div className="max-w-[1440px] mx-auto px-8 h-20 flex items-center justify-between">
                
//                 {/* 로고 영역: 업로드하신 BT 로고 적용 */}
//                 <div className="flex-shrink-0 flex items-center cursor-pointer group" onClick={() => window.location.href = '/'}>
//                     <div className="relative w-12 h-12 mr-3 transition-transform duration-300 group-hover:scale-105">
//                         <Image 
//                             src="/logo.png" // public 폴더에 저장한 파일명
//                             alt="boookntalk 로고"
//                             fill // 부모 컨테이너 크기에 맞춤
//                             className="object-contain"
//                             priority // 로고는 가장 먼저 로딩되도록 설정
//                         />
//                     </div>
//                     <h1 className="text-xl font-bold tracking-tighter font-sans uppercase hidden sm:block">
//                         boookntalk
//                     </h1>
//                 </div>

//                 {/* 중앙 네비게이션: 미니멀 스타일 */}
//                 <nav className="hidden lg:flex items-center gap-12">
//                     {['LIBRARY', 'SQUARE', 'TALK', 'ABOUT'].map((item) => (
//                         <a key={item} href="#" className="text-[11px] font-bold tracking-[0.2em] text-gray-400 hover:text-[#4fd1c5] transition-colors">
//                             {item}
//                         </a>
//                     ))}
//                 </nav>

//                 {/* 우측 유틸리티 영역 */}
//                 <div className="flex items-center gap-6">
//                     <button className="p-2 hover:bg-white/5 rounded-full transition">
//                         <Search className="w-5 h-5 text-gray-400 hover:text-white" />
//                     </button>

//                     {session ? (
//                         <div className="flex items-center gap-3 pl-4 pr-1 py-1 rounded-full border border-white/10 bg-white/5">
//                             <span className="text-xs font-semibold text-gray-300">{session.user?.name}님</span>
//                             {session.user?.image ? (
//                                 <img src={session.user.image} className="w-7 h-7 rounded-full border border-[#4fd1c5]" alt="profile" />
//                             ) : (
//                                 <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center"><User className="w-4 h-4" /></div>
//                             )}
//                             <button onClick={() => signOut()} className="p-1 hover:text-red-400 transition">
//                                 <LogOut className="w-4 h-4" />
//                             </button>
//                         </div>
//                     ) : (
//                         <button 
//                             onClick={() => signIn('google')}
//                             className="px-7 py-2.5 border border-gray-600 rounded-md text-[10px] font-black tracking-[0.2em] uppercase hover:border-[#4fd1c5] hover:text-[#4fd1c5] transition-all duration-300"
//                         >
//                             SIGN IN
//                         </button>
//                     )}
//                     <Menu className="w-6 h-6 text-gray-400 cursor-pointer" />
//                 </div>
//             </div>
//         </header>
//     );
// }

//import Link from 'next/link';

// export default function Header() {
//   return (
//     <header className="border-b bg-white sticky top-0 z-50">
//       <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
//         <Link href="/" className="text-2xl font-bold text-indigo-600">
//           boookntalk
//         </Link>
//         <nav className="flex gap-4">
//           <Link href="/" className="text-slate-600 hover:text-indigo-600">홈</Link>
//           <Link href="/about" className="text-slate-600 hover:text-indigo-600">소개</Link>
//         </nav>
//       </div>
//     </header>
//   );
// }

