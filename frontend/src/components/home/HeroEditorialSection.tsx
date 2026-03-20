'use client';

import React from 'react';
import Image from 'next/image';
import { Quote, TrendingUp, Award, ArrowRight, BookOpen } from 'lucide-react';

export default function HeroEditorialSection() {
    return (
        <section className="w-full bg-[#F5F5F7] pb-8 pt-8">
            <div className="max-w-[1440px] mx-auto px-8">
                
                {/* [핵심] 12그리드를 활용한 8:4 비대칭 레이아웃 (1cm 간격 규격 적용) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--spacing-1cm,32px)] items-stretch min-h-[460px]">
                    
                    {/* 1. 좌측 메인 캔버스 (8칸 차지): 압도적인 감성의 '오늘의 문장' */}
                    <div className="lg:col-span-8 relative bg-[#1d1d1f] rounded-[24px] p-10 md:p-14 flex flex-col justify-between overflow-hidden group cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                        {/* 은은하고 고급스러운 오로라 배경 블러 효과 */}
                        <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-[#0066cc]/10 rounded-full blur-[100px] transition-transform duration-1000 group-hover:scale-110 group-hover:bg-[#0066cc]/20"></div>
                        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-teal-500/10 rounded-full blur-[80px]"></div>
                        
                        <div className="relative z-10 mb-12">
                            <div className="flex items-center gap-2 mb-8 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                                <Quote size={16} className="text-[#0066cc]" />
                                <span className="text-[12px] font-extrabold text-white tracking-widest">TODAY'S SENTENCE</span>
                            </div>
                            <h2 className="text-[28px] md:text-[38px] lg:text-[42px] font-extrabold text-white leading-[1.4] break-keep tracking-tight">
                                "우리는 허구를 믿는 능력을 통해 비로소 서로 연대할 수 있었다. 그것이 인류의 가장 강력한 무기다."
                            </h2>
                        </div>
                        
                        <div className="relative z-10 flex items-end justify-between w-full">
                            <div className="flex items-center gap-4">
                                <div className="w-[52px] h-[76px] relative rounded-md overflow-hidden shadow-lg border border-white/10">
                                    <Image src="https://shopping-phinf.pstatic.net/main_3246654/32466540638.20230920081628.jpg?type=w1200" alt="사피엔스" fill className="object-cover" unoptimized />
                                </div>
                                <div>
                                    <p className="text-[16px] font-bold text-gray-100 mb-1">사피엔스</p>
                                    <p className="text-[14px] text-gray-400 font-medium">유발 하라리</p>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white transition-colors duration-300 border border-white/10">
                                <ArrowRight size={20} className="text-white group-hover:text-[#1d1d1f] transition-colors -translate-x-1 group-hover:translate-x-0 duration-300" />
                            </div>
                        </div>
                    </div>

                    {/* 2. 우측 정보의 탑 (4칸 차지): 전문성과 활성도를 상하로 분할 */}
                    <div className="lg:col-span-4 flex flex-col gap-[var(--spacing-1cm,32px)] h-full">
                        
                        {/* 상단: 이주의 시선 (전문성) */}
                        <div className="flex-1 bg-[#EAF6F4] rounded-[24px] p-8 border border-teal-50 flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all duration-300">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Award size={16} className="text-teal-600" />
                                    <span className="text-[12px] font-extrabold text-teal-700 tracking-wider">이주의 시선</span>
                                </div>
                                <h3 className="text-[20px] font-extrabold text-[#1d1d1f] leading-snug mb-3 line-clamp-3 group-hover:text-teal-700 transition-colors">
                                    "성공이라는 욕망 뒤에 감춰진 인간의 나약함에 대하여"
                                </h3>
                                <p className="text-[14px] text-gray-600 font-medium line-clamp-2 break-keep">
                                    시드니 셀던이 그려낸 인물들은 완벽해 보이지만, 그 균열 속에서 우리는 깊은 동질감을 느낀다.
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-teal-100/60">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm border border-teal-50">
                                    <Image src="https://api.dicebear.com/7.x/notionists/svg?seed=Alice" alt="에디터" width={32} height={32} unoptimized />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-bold text-teal-900">김서연</span>
                                    <span className="text-[11px] text-teal-600 font-medium">Book Enthusiast</span>
                                </div>
                            </div>
                        </div>

                        {/* 하단: 실시간 사색 트렌드 (활성도) */}
                        <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={16} className="text-red-500" />
                                    <span className="text-[13px] font-extrabold text-[#1d1d1f] tracking-wider">실시간 사색 트렌드</span>
                                </div>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            </div>
                            
                            <div className="flex flex-col gap-5">
                                {[
                                    { rank: 1, title: '불편한 편의점', tags: ['#위로', '#힐링'], isNew: true },
                                    { rank: 2, title: '100년 동안 너를 찾았어', tags: ['#추리소설'], isNew: false },
                                    { rank: 3, title: '도둑맞은 집중력', tags: ['#인사이트'], isNew: false },
                                ].map((item) => (
                                    <div key={item.rank} className="flex justify-between items-center group cursor-pointer hover:bg-gray-50 -mx-3 px-3 py-1.5 rounded-xl transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[15px] font-black w-3 text-center ${item.rank === 1 ? 'text-[#0066cc]' : 'text-gray-300'}`}>{item.rank}</span>
                                            <span className="text-[15px] font-bold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors truncate max-w-[150px]">{item.title}</span>
                                            {item.isNew && <span className="text-[9px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-full mb-2">NEW</span>}
                                        </div>
                                        <div className="flex gap-1">
                                            {item.tags.map(tag => (
                                                <span key={tag} className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}