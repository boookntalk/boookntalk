'use client';

import React, { useRef, useState } from 'react';
import { DESIGN_TOKEN } from '@/constants/styles';
import Container from '@/components/layout/Container';

const QUOTES = [
    { id: 1, text: "우리가 읽는 책이 우리 머리를 주먹으로 한 대 쳐서 깨우지 않는다면, 무엇 때문에 읽는가?", author: "프란츠 카프카", book: "변신", image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000" },
    { id: 2, text: "독서는 완성된 생각의 조각을 모으는 여행이자, 자신만의 세계를 구축하는 과정이다.", author: "버지니아 울프", book: "자기만의 방", image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000" }
];

export default function Home() {
    return (
        // [수정 1] 헤더 아래 영역에서 독립 스크롤이 발생하도록 래퍼를 씌움
        <div className="w-full h-full overflow-y-auto bg-[#F5F5F7] scrollbar-hide">
            
            {/* Container에서는 하단 여백(pb-20)만 담당 */}
            <Container className="pb-20">
                
                {/* ▼▼▼ [핵심 픽스] Tailwind 파싱 실패를 방지하기 위한 인라인 스타일 강제 적용 ▼▼▼ */}
                {/* 브라우저가 직접 1cm 간격 변수를 해석하며, 만약 변수가 없을 경우 40px의 대체(Fallback) 여백을 안전하게 확보함 */}
                <div style={{ paddingTop: 'var(--spacing-1cm, 40px)' }}>
                    
                    {/* 1. Carousel 영역 */}
                    <section className={`relative ${DESIGN_TOKEN.ROUND.CARD || 'rounded-3xl'} overflow-hidden shadow-sm bg-gray-100 h-[320px]`}>
                        <div className="flex h-full overflow-x-hidden">
                            {QUOTES.slice(0, 1).map((quote) => (
                                <div key={quote.id} className="w-full flex-shrink-0 relative flex flex-col items-center justify-center text-center px-10">
                                    <img src={quote.image} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="bg" />
                                    <div className="relative z-10">
                                        <h2 className="text-2xl md:text-3xl font-bold mb-4">“{quote.text}”</h2>
                                        <p className="text-lg opacity-80">— {quote.author}, {quote.book}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 2. 실시간 광장 영역 */}
                    {/* 섹션 간의 수직 간격에도 동일하게 안전한 인라인 스타일 적용 */}
                    <section style={{ marginTop: 'var(--spacing-1cm, 40px)' }}>
                        <h3 className="text-3xl font-bold mb-8">실시간 광장</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <p className="text-gray-800 mb-4">독서는 생각의 힘을 줍니다. BoooknTalk에서 경험을 나눠보세요.</p>
                                    <span className="text-sm text-gray-400">지식탐험가</span>
                                </div>
                            ))}
                        </div>
                    </section>
                    
                </div>
            </Container>
        </div>
    );
}