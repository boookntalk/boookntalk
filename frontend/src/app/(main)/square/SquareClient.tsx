// 경로: frontend/src/app/(main)/square/SquareClient.tsx
// 역할 및 기능: 광장 메뉴의 실 데이터를 기반으로 렌더링하는 클라이언트 컴포넌트입니다. LNB(사이드바) 의존성과 강제 마진을 모두 제거하고 화면 전체를 활용하여 1뎁스 탭 구조로 피드를 출력합니다.

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Home, ChevronRight, Search, BookOpen } from 'lucide-react';
import SubPageLayout from '@/components/layout/SubPageLayout';

interface SquareClientProps {
    initialWorks: any[];
    user: any;
}

/**
 * SquareClient
 * 기능: 서버로부터 주입받은 도서 데이터를 기반으로 그리드 뷰를 생성하며, 1cm 간격 룰을 준수하여 상단 네비게이션 탭과 검색 바를 렌더링합니다.
 */
export default function SquareClient({ initialWorks, user }: SquareClientProps) {
    const [activeTab, setActiveTab] = useState<string>('works');

    const displayBooks = initialWorks || [];

    const squareTabs = [
        { id: 'works', label: '인기 작품' },
        { id: 'long_reviews', label: '리뷰 (긴줄평)' },
        { id: 'short_reviews', label: '통합 한줄평' },
        { id: 'notes', label: '독서노트' },
        { id: 'trending_authors', label: '주목받는 작가' },
        { id: 'feeds', label: '북토커 피드' },
    ];

    /**
     * renderBreadcrumb
     * 기능: 상단 경로 정보를 렌더링하여 유저의 현재 위치 탐색을 돕습니다.
     */
    const renderBreadcrumb = () => (
        <div className="flex items-center gap-2 text-[13px] font-bold text-gray-400">
            <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                <Home size={15} /> <span>홈</span>
            </Link>
            <ChevronRight size={14} className="opacity-50" />
            <span className="text-[#1d1d1f] font-bold">광장</span>
        </div>
    );

    /**
     * renderSearchAction
     * 기능: 광장 내 도서 및 피드 검색을 위한 우측 상단 검색 바를 렌더링합니다.
     */
    const renderSearchAction = () => (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
                type="text" 
                placeholder="광장 내 검색..." 
                className="pl-9 pr-4 py-1.5 w-full bg-white border border-gray-200 rounded-full text-[13px] outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/20 transition-all"
            />
        </div>
    );

    /**
     * renderTabs
     * 기능: 수평으로 나열된 1뎁스 메인 네비게이션 탭을 출력하며 클릭 시 상태를 변경합니다.
     */
    const renderTabs = () => (
        <>
            {squareTabs.map((tab) => (
                <button
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-[10px] text-[15px] font-bold transition-all whitespace-nowrap border-b-[2.5px] ${
                        activeTab === tab.id 
                            ? 'text-[#0066cc] border-[#0066cc]' 
                            : 'text-gray-400 border-transparent hover:text-[#1d1d1f]'
                    }`}
                >
                    {tab.label}
                    {activeTab === tab.id && activeTab === 'works' && displayBooks.length > 0 && (
                        <span className="ml-1.5 text-[12px] opacity-70">{displayBooks.length}</span>
                    )}
                </button>
            ))}
        </>
    );

    return (
        <div className="flex w-full min-h-screen relative bg-[var(--bg-main)]">
            <main className="flex-1 w-full min-w-0">
                <SubPageLayout 
                    breadcrumb={renderBreadcrumb()}
                    actionArea={renderSearchAction()}
                    titleOrTabs={renderTabs()}
                >
                    <div className="w-full animate-in fade-in duration-500">
                        {activeTab === 'works' && displayBooks.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-[var(--spacing-1cm,32px)] gap-y-10 pt-4">
                                {displayBooks.map((book: any, idx: number) => (
                                    <div key={book.id || idx} className="flex flex-col gap-3 group cursor-pointer">
                                        <div className="relative w-full aspect-[1/1.45] bg-[#F7F5F1] border border-[#E7E2D9] rounded-sm overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                            {book.cover ? (
                                                <img 
                                                    src={book.cover} 
                                                    alt={book.title || 'BoooknTalk 도서'} 
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#A0AABF]">
                                                    <BookOpen className="opacity-20 mb-2" size={40} />
                                                    <span className="text-[11px] font-medium">No Cover</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-0.5 px-0.5">
                                            <h3 className="text-[14px] font-bold text-[#1d1d1f] line-clamp-1 group-hover:text-[#0066cc] transition-colors">
                                                {book.title}
                                            </h3>
                                            <p className="text-[12px] text-[#A0AABF] font-medium line-clamp-1">
                                                {book.author}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'works' ? (
                            <div className="flex flex-col items-center justify-center py-40 bg-white rounded-lg border border-dashed border-gray-200 mt-2">
                                <BookOpen size={48} className="text-gray-200 mb-4" />
                                <p className="text-gray-400 font-medium">광장에 등록된 실시간 도서 데이터가 존재하지 않습니다.</p>
                            </div>
                        ) : null}

                        {activeTab !== 'works' && (
                            <div className="flex flex-col items-center justify-center py-40 bg-white rounded-lg border border-dashed border-gray-200 mt-2">
                                <BookOpen size={48} className="text-gray-200 mb-4" />
                                <p className="text-gray-400 font-medium">아직 준비 중인 공간입니다.<br />곧 멋진 사색 기록으로 찾아올게요!</p>
                            </div>
                        )}
                    </div>
                </SubPageLayout>
            </main>
        </div>
    );
}