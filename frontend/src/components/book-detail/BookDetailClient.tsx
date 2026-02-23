// frontend/src/components/book-detail/BookDetailClient.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/layout/Container';
import BookTopInfo from './BookTopInfo'; // 위에서 만든 컴포넌트 import
import { ChevronLeft, Database, Copy, Check } from 'lucide-react';
import MemoryLayer from './MemoryLayer';
import ShortReviewSection from './ShortReviewSection';

export default function BookDetailClient({ initialData, user }: { initialData: any, user: any }) {
    const router = useRouter();
    const { record, work, current_edition, my_editions } = initialData;

    // 하단 콘텐츠 영역 탭 상태 관리
    const [activeTab, setActiveTab] = useState<'memory' | 'review' | 'report' | 'bibliography'>('memory');
    // 복사 완료 상태 관리 (ISBN 등)
    const [copiedItem, setCopiedItem] = useState<string | null>(null);

    // [추가] 클립보드 복사 핸들러
    const handleCopy = (text: string, type: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedItem(type);
        setTimeout(() => setCopiedItem(null), 2000);
    };

    // [핸들러] 에디션 변경 (다른 기록 ID로 페이지 이동)
    const handleRecordChange = (targetRecordId: string) => {
        router.push(`/library/${targetRecordId}`);
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7]">
            {/* 1. 글로벌 네비게이션 대용 (뒤로가기) */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-[40]">
                <Container className="h-16 flex items-center">
                    <button 
                        onClick={() => router.back()} 
                        className="flex items-center gap-2 text-[14px] font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="tracking-tight font-semibold">서재 목록으로 돌아가기</span>
                    </button>
                </Container>
            </div>

            {/* 2. [Top Section] 책 정보 + 나의 핵심 기록 */}
            <BookTopInfo 
                record={record}
                edition={current_edition}
                work={work}
                myEditions={my_editions}
                onRecordChange={handleRecordChange}
            />

            {/* 3. [Bottom Section] 사용자 콘텐츠 및 고급 서지정보 (Level 3) */}
            <Container className="py-12 max-w-[1440px]">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    
                    {/* 왼쪽: 콘텐츠 네비게이션 (Sticky Menu) */}
                    <div className="hidden md:block md:col-span-3">
                        <div className="sticky top-24">
                            <h4 className="font-bold text-gray-400 mb-4 text-xs uppercase tracking-wider">Contents</h4>
                            <ul className="space-y-4 text-sm text-gray-600 border-l border-gray-200 pl-4 font-medium">
                                <li 
                                    onClick={() => setActiveTab('memory')}
                                    className={`cursor-pointer transition-all ${activeTab === 'memory' ? 'font-bold text-[#1d1d1f] -ml-[17px] border-l-2 border-black pl-3.5' : 'hover:text-gray-800'}`}
                                >
                                    기억의 지층
                                </li>
                                <li 
                                    onClick={() => setActiveTab('review')}
                                    className={`cursor-pointer transition-all ${activeTab === 'review' ? 'font-bold text-[#1d1d1f] -ml-[17px] border-l-2 border-black pl-3.5' : 'hover:text-gray-800'}`}
                                >
                                    한줄평
                                </li>
                                <li 
                                    onClick={() => setActiveTab('report')}
                                    className={`cursor-pointer transition-all ${activeTab === 'report' ? 'font-bold text-[#1d1d1f] -ml-[17px] border-l-2 border-black pl-3.5' : 'hover:text-gray-800'}`}
                                >
                                    독서 리포트
                                </li>
                                
                                {/* Level 3: 서지 상세 정보 탭 */}
                                <div className="pt-4 mt-4 border-t border-gray-100">
                                    <li 
                                        onClick={() => setActiveTab('bibliography')}
                                        className={`cursor-pointer transition-all flex items-center gap-2 ${activeTab === 'bibliography' ? 'font-bold text-[#0066cc] -ml-[17px] border-l-2 border-[#0066cc] pl-3.5' : 'hover:text-[#0066cc]'}`}
                                    >
                                        <Database size={14} /> 서지 상세 정보
                                    </li>
                                </div>
                            </ul>
                        </div>
                    </div>

                    {/* 오른쪽: 실제 콘텐츠 영역 (Dynamic Rendering) */}
                    <div className="md:col-span-9 flex flex-col gap-8">
                        
                        {/* 탭: 기억의 지층 */}
                        {activeTab === 'memory' && (
                            <MemoryLayer recordId={record.id} user={user} />
                        )}

                        {/* 탭: 심층 리뷰 */}
                        {activeTab === 'review' && (
                            <div className="animate-in fade-in duration-300">
                                <ShortReviewSection workId={work.id} />
                            </div>
                        )}

                        {/* 탭: 독서 리포트 */}
                        {activeTab === 'report' && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 min-h-[400px] flex items-center justify-center text-gray-300 font-bold animate-in fade-in duration-300">
                                독서 리포트 & 통계
                            </div>
                        )}

                        {/* [Level 3] 탭: 서지 상세 정보 (도서 데이터베이스) */}
                        {activeTab === 'bibliography' && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="mb-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-[#1d1d1f] flex items-center gap-2">
                                            <Database size={18} className="text-[#0066cc]" /> 
                                            도서 데이터베이스
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">이 에디션에 대한 고유 서지 정보입니다.</p>
                                    </div>
                                </div>

                                {/* 모노스페이스 기반의 관리용 테이블 UI */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                    <div className="flex flex-col py-2 border-b border-gray-50">
                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">ISBN-13</span>
                                        <div className="flex items-center justify-between group">
                                            <span className="font-mono text-sm font-medium text-gray-800">{current_edition.isbn || "정보 없음"}</span>
                                            {current_edition.isbn && (
                                                <button onClick={() => handleCopy(current_edition.isbn, 'isbn13')} className="text-gray-300 hover:text-[#0066cc] transition-colors">
                                                    {copiedItem === 'isbn13' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col py-2 border-b border-gray-50">
                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">도서 분류 (KDC)</span>
                                        <span className="font-mono text-sm font-medium text-gray-800">{current_edition.kdc_code || "정보 없음"}</span>
                                    </div>

                                    <div className="flex flex-col py-2 border-b border-gray-50">
                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">원서명</span>
                                        <span className="text-sm font-medium text-gray-800">{work.original_title || "해당 없음"}</span>
                                    </div>

                                    <div className="flex flex-col py-2 border-b border-gray-50">
                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">출간 언어</span>
                                        <span className="text-sm font-medium text-gray-800">{current_edition.language || "한국어"}</span>
                                    </div>

                                    <div className="flex flex-col py-2 border-b border-gray-50">
                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">물리적 형태 (판형)</span>
                                        <span className="font-mono text-sm font-medium text-gray-800">{current_edition.size_mm || "정보 없음"}</span>
                                    </div>

                                    <div className="flex flex-col py-2 border-b border-gray-50">
                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">정가</span>
                                        <span className="font-mono text-sm font-medium text-gray-800">
                                            {current_edition.price ? `₩${current_edition.price.toLocaleString()}` : "정보 없음"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </Container>
        </div>
    );
}