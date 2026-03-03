'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/layout/Container';
import BookTopInfo from './BookTopInfo';
import { ArrowLeft, Database, Copy, Check, Quote } from 'lucide-react';
import RecordFragments from '@/components/library/RecordFragments'; 
import LongReviewSection from '@/components/library/LongReviewSection'; // ▼ 신규 추가된 컴포넌트 임포트

export default function BookDetailClient({ initialData, user }: { initialData: any, user: any }) {
    const router = useRouter();
    const { record, work, current_edition, my_editions } = initialData;

    // ▼ 탭 상태 관리에 'long-review' 추가
    const [activeTab, setActiveTab] = useState<'fragments' | 'long-review' | 'sentences' | 'meta'>('fragments');
    const [copiedItem, setCopiedItem] = useState<string | null>(null);

    const handleCopy = (text: string, type: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedItem(type);
        setTimeout(() => setCopiedItem(null), 2000);
    };

    // ▼ 탭 메뉴 배열에 나의 리뷰 추가
    const tabs = [
        { id: 'fragments', label: '기록 조각 (Memo)' },
        { id: 'long-review', label: '나의 리뷰 (Review)' },
        { id: 'sentences', label: '문장 수집 (Sentences)' },
        { id: 'meta', label: '상세 정보 (Meta)' }
    ] as const;

    return (
        <div className="min-h-screen bg-[#F5F5F7] pb-32">
            <div className="bg-white sticky top-0 z-[40]">
                <Container className="pt-6 pb-2 max-w-[1440px]">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#1d1d1f] shadow-sm transition-all group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                </Container>
            </div>

            <BookTopInfo 
                record={record} edition={current_edition} work={work}
                myEditions={my_editions} onRecordChange={(id) => router.push(`/library/${id}`)}
            />

            <div className="sticky top-[56px] z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <Container className="max-w-[1200px]">
                    <div className="flex items-center gap-10 overflow-x-auto scrollbar-hide pt-4">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-3 text-[16px] font-bold whitespace-nowrap transition-all border-b-[3px] flex items-center gap-1.5 ${
                                    activeTab === tab.id ? 'border-[#0066cc] text-[#0066cc]' : 'border-transparent text-gray-400 hover:text-[#1d1d1f]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </Container>
            </div>

            <Container className="max-w-[1200px] min-h-[600px] pb-10">
                
                <div className={activeTab === 'fragments' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                    <RecordFragments />
                </div>

                {/* ▼▼▼ 새로 추가된 장문 리뷰 탭 렌더링 영역 ▼▼▼ */}
                <div className={activeTab === 'long-review' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                    <LongReviewSection />
                </div>
                
                <div className={activeTab === 'sentences' ? 'block animate-in fade-in duration-300 mt-[var(--spacing-1cm,32px)]' : 'hidden'}>
                    <div className="bg-white rounded-[24px] p-16 border border-gray-100 flex flex-col items-center justify-center text-gray-400 shadow-sm">
                        <Quote size={48} className="mb-4 opacity-30" />
                        <p className="font-bold text-lg mb-2 text-gray-600">수집된 문장이 없습니다.</p>
                        <button className="mt-4 bg-[#1d1d1f] hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm flex items-center gap-2">
                            + 새 문장 남기기
                        </button>
                    </div>
                </div>

                <div className={activeTab === 'meta' ? 'block animate-in fade-in duration-300 mt-[var(--spacing-1cm,32px)]' : 'hidden'}>
                    {/* 기존 메타 정보 코드 유지 */}
                    <div className="bg-white rounded-[24px] p-10 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-[#1d1d1f] flex items-center gap-2 mb-8 pb-4 border-b border-gray-100">
                            <Database size={18} className="text-[#0066cc]" /> 서지 메타 정보
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                            <div className="flex flex-col py-2 border-b border-gray-50">
                                <span className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-1">ISBN-13</span>
                                <span className="font-mono text-[15px] font-medium text-[#1d1d1f]">{current_edition?.isbn || "정보 없음"}</span>
                            </div>
                            <div className="flex flex-col py-2 border-b border-gray-50">
                                <span className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-1">출간 언어</span>
                                <span className="text-[15px] font-medium text-[#1d1d1f]">{current_edition?.language || "한국어"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}