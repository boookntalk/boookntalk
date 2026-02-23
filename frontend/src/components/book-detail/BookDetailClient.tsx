'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/layout/Container';
import BookTopInfo from './BookTopInfo';
import { ChevronLeft, Database, Copy, Check, Quote, BarChart2 } from 'lucide-react';
import MemoryLayer from './MemoryLayer';
import ShortReviewSection from './ShortReviewSection';

export default function BookDetailClient({ initialData, user }: { initialData: any, user: any }) {
    const router = useRouter();
    const { record, work, current_edition, my_editions } = initialData;

    // 하단 탭 상태 관리
    const [activeTab, setActiveTab] = useState<'memory' | 'review' | 'report' | 'bibliography'>('memory');
    const [copiedItem, setCopiedItem] = useState<string | null>(null);

    const handleCopy = (text: string, type: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedItem(type);
        setTimeout(() => setCopiedItem(null), 2000);
    };

    const tabs = [
        { id: 'memory', label: '기억의 지층', icon: Quote },
        { id: 'review', label: '한줄평', icon: null },
        { id: 'report', label: '독서 리포트', icon: BarChart2 },
        { id: 'bibliography', label: '서지 상세 정보', icon: Database }
    ] as const;

    return (
        <div className="min-h-screen bg-[#F5F5F7] pb-32">
            {/* 1. 뒤로가기 네비게이션 */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-[40]">
                <Container className="h-14 flex items-center max-w-[1440px]">
                    <button 
                        onClick={() => router.back()} 
                        className="flex items-center gap-1.5 text-[14px] font-semibold text-[#86868b] hover:text-[#1d1d1f] transition-colors group"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>서재로 돌아가기</span>
                    </button>
                </Container>
            </div>

            {/* 2. 도서 핵심 정보 (Top Section) */}
            <BookTopInfo 
                record={record} edition={current_edition} work={work}
                myEditions={my_editions} onRecordChange={(id) => router.push(`/library/${id}`)}
            />

            {/* 3. [NEW] 스티키 가로형 탭 메뉴 */}
            <div className="sticky top-[56px] z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <Container className="max-w-[1000px]">
                    <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide pt-4">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-3 text-[15px] font-bold whitespace-nowrap transition-all border-b-[3px] flex items-center gap-1.5 ${
                                    activeTab === tab.id 
                                    ? 'border-[#0066cc] text-[#0066cc]' 
                                    : 'border-transparent text-gray-400 hover:text-[#1d1d1f]'
                                }`}
                            >
                                {tab.icon && <tab.icon size={15} />}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </Container>
            </div>

            {/* 4. 메인 콘텐츠 영역 (중앙 정렬 및 넓이 최적화) */}
            {/* min-h-[600px]를 주어 로딩 시에도 푸터가 위로 딸려 올라오지 않게 방어합니다. */}
            <Container className="py-10 max-w-[1000px] min-h-[600px]">
                
                {/* 조건부 렌더링(&&) 대신 className을 통한 숨김(hidden) 처리 적용 */}
                <div className={activeTab === 'memory' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                    <MemoryLayer recordId={record.id} user={user} />
                </div>
                
                <div className={activeTab === 'review' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                    <ShortReviewSection workId={work.id} />
                </div>
                
                <div className={activeTab === 'report' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                    <div className="bg-white rounded-3xl p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-400">
                        <BarChart2 size={48} className="mb-4 opacity-50" />
                        <p className="font-bold text-lg">독서 리포트 & 통계</p>
                        <p className="text-sm mt-2">곧 제공될 예정입니다.</p>
                    </div>
                </div>

                <div className={activeTab === 'bibliography' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-[#1d1d1f] flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                            <Database size={18} className="text-[#0066cc]" /> 도서 데이터베이스
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            <div className="flex flex-col py-2 border-b border-gray-50">
                                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">ISBN-13</span>
                                <div className="flex items-center justify-between group">
                                    <span className="font-mono text-sm font-medium text-gray-800">{current_edition.isbn || "정보 없음"}</span>
                                    {current_edition.isbn && (
                                        <button onClick={() => handleCopy(current_edition.isbn, 'isbn')} className="text-gray-300 hover:text-[#0066cc]">
                                            {copiedItem === 'isbn' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col py-2 border-b border-gray-50">
                                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">출간 언어</span>
                                <span className="text-sm font-medium text-gray-800">{current_edition.language || "한국어"}</span>
                            </div>
                            <div className="flex flex-col py-2 border-b border-gray-50">
                                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">원서명</span>
                                <span className="text-sm font-medium text-gray-800">{work.original_title || "해당 없음"}</span>
                            </div>
                            <div className="flex flex-col py-2 border-b border-gray-50">
                                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">정가</span>
                                <span className="font-mono text-sm font-medium text-gray-800">
                                    {current_edition.price ? `₩${current_edition.price.toLocaleString()}` : "정보 없음"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}