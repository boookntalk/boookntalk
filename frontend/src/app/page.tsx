'use client';

import React, { useRef, useState, useEffect } from 'react';
// import Header from "@/components/layout/Header";
// import Footer from "@/components/layout/Footer";

const QUOTES = [
    {
        id: 1,
        text: "우리가 읽는 책이 우리 머리를 주먹으로 한 대 쳐서 깨우지 않는다면, 무엇 때문에 읽는가?",
        author: "프란츠 카프카",
        book: "변신",
        image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000"
    },
    {
        id: 2,
        text: "독서는 완성된 생각의 조각을 모으는 여행이자, 자신만의 세계를 구축하는 과정이다.",
        author: "버지니아 울프",
        book: "자기만의 방",
        image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000"
    },
    {
        id: 3,
        text: "책은 얼어붙은 우리 안의 바다를 깨는 도끼여야 한다.",
        author: "프란츠 카프카",
        book: "판결",
        image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000"
    }
];

export default function Home() {
    const contentMaxWidth = "max-w-[1400px]";
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // 스크롤 위치에 따라 인덱스 업데이트
    const handleScroll = () => {
        if (scrollRef.current) {
            const width = scrollRef.current.offsetWidth;
            const index = Math.round(scrollRef.current.scrollLeft / width);
            setActiveIndex(index);
        }
    };

    // 검정색 원 클릭 시 해당 슬라이드로 이동
    const scrollTo = (index: number) => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                left: scrollRef.current.offsetWidth * index,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <main className={`flex-grow ${contentMaxWidth} mx-auto w-full px-6`}>
                
                {/* 1. Today's Quote Carousel (Hero Section) */}
                {/* 헤더와 1cm(38px) 간격 유지 */}
                <section className="mt-[19px] relative rounded-[10px] overflow-hidden group">
                    <div 
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-[280px]"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {QUOTES.map((quote) => (
                            <div 
                                key={quote.id}
                                className="min-w-full h-full snap-center relative flex flex-col items-center justify-center text-center px-10 md:px-20"
                            >
                                {/* 배경 이미지 및 다크 오버레이 */}
                                <div className="absolute inset-0 z-0">
                                    <img 
                                        src={quote.image} 
                                        className="w-full h-full object-cover transition-transform duration-700" 
                                        alt="Book Background"
                                    />
                                    {/* 글자가 잘 보이도록 밝은 배경에는 흰색 80% 오버레이 적용 (Apple 스타일) */}
                                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
                                </div>

                                {/* 인용구 컨텐츠 */}
                                <div className="relative z-10 max-w-3xl">
                                    <h2 className="text-[#1d1d1f] text-3xl md:text-4xl font-serif leading-[1.6] mb-8 break-keep font-medium">
                                        “{quote.text}”
                                    </h2>
                                    <p className="text-[#1d1d1f]/60 text-lg font-medium tracking-tight">
                                        — {quote.author}, 『{quote.book}』
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 하단 중앙 인디케이터 (Pagination Dots) */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                        {QUOTES.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => scrollTo(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                    activeIndex === i ? 'bg-black scale-150' : 'bg-black/20'
                                }`}
                            />
                        ))}
                    </div>
                </section>

                {/* 2. 실시간 광장 (Community) - 위와 폭 동일 */}
                <section className="pt-12 pb-24">
                    <div className="flex justify-between items-end mb-7">
                        <div>
                            <h3 className="text-[25px] font-semibold tracking-tight text-[#1d1d1f]">실시간 광장</h3>
                            <p className="text-[#86868b] mt-1 text-[17px]">지금 이 순간, 독자들이 나누는 이야기</p>
                        </div>
                        <button className="text-[#0066cc] text-[15px] font-medium hover:underline">모두 보기</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="group bg-[#f5f5f7] rounded-[24px] p-8 hover:bg-[#ebebef] transition-all duration-300 cursor-pointer">
                                <span className="text-4xl text-gray-300 font-serif">“</span>
                                <p className="text-[17px] font-medium text-[#1d1d1f] mt-2 mb-12 leading-snug">
                                    독서는 우리에게 생각할 수 있는 힘을 줍니다. 보오옥앤톡에서 그 경험을 나눠보세요.
                                </p>
                                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                                    <span className="text-[13px] font-semibold text-[#86868b]">지식탐험가</span>
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-black transition-colors duration-300">
                                        <div className="w-1.5 h-1.5 bg-black group-hover:bg-white rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
// 'use client';

// import React from 'react';
// import Header from "@/components/layout/Header";
// import Footer from "@/components/layout/Footer";

// export default function Home() {
//     // 공통 폭 설정을 위한 변수
//     const contentMaxWidth = "max-w-[1400px]";

//     return (
//         <div className="min-h-screen flex flex-col bg-white">
//             <Header />

//             <main className={`flex-grow ${contentMaxWidth} mx-auto w-full px-6`}>
                
//                 {/* 1. Hero Image: 헤더와 1cm(약 38px) 간격 유지 및 아래 컨텐츠와 폭 일치 */}
//                 <section className="mt-[38px] relative h-[500px] w-full rounded-[20px] overflow-hidden bg-[#f5f5f7]">
//                     <img 
//                         src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000" 
//                         className="w-full h-full object-cover"
//                         alt="Hero"
//                     />
//                     <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center text-center px-4">
//                         <h2 className="text-white text-4xl md:text-5xl font-bold tracking-tight mb-4 drop-shadow-sm">
//                             책과 대화가 머무는 시간
//                         </h2>
//                         <p className="text-white/90 text-lg font-medium opacity-90">
//                             당신의 독서 여정을 시작하세요.
//                         </p>
//                     </div>
//                 </section>

//                 {/* 2. 실시간 광장 (Community): 위 이미지와 폭이 동일하게 정렬됨 */}
//                 <section className="py-24">
//                     <div className="flex justify-between items-end mb-10">
//                         <div>
//                             <h3 className="text-[32px] font-semibold tracking-tight text-[#1d1d1f]">실시간 광장</h3>
//                             <p className="text-[#86868b] mt-1">지금 이 순간, 독자들이 나누는 이야기</p>
//                         </div>
//                         <button className="text-[#0066cc] text-sm hover:underline">모두 보기</button>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                         {[1, 2, 3, 4].map((i) => (
//                             <div key={i} className="group bg-[#f5f5f7] rounded-[24px] p-8 hover:bg-[#ebebef] transition-colors duration-300">
//                                 <span className="text-4xl text-gray-300 font-serif">“</span>
//                                 <p className="text-[17px] font-medium text-[#1d1d1f] mt-2 mb-12 leading-snug">
//                                     독서는 우리에게 생각할 수 있는 힘을 줍니다.
//                                 </p>
//                                 <div className="flex items-center justify-between border-t border-gray-200 pt-6">
//                                     <span className="text-[13px] font-semibold text-[#86868b]">지식탐험가</span>
//                                     <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
//                                         <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </section>
//             </main>

//             <Footer />
//         </div>
//     );
// }