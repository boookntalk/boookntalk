'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/layout/Container';
import BookTopInfo from './BookTopInfo';
// [중요] MemoryLayer를 RecordFragments라는 이름으로 임포트 (역할 명확화)
import RecordFragments from './MemoryLayer'; 
import ShortReviewSection from './ShortReviewSection'; // 한줄평 컴포넌트
import MemoWriteModal from './MemoWriteModal';
import { ArrowLeft, Database, Quote, PenTool, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function BookDetailClient({ initialData, user }: { initialData: any, user: any }) {
    const router = useRouter();
    const { record, work, current_edition, my_editions } = initialData;

    // 탭 상태 (기본값: fragments)
    const [activeTab, setActiveTab] = useState<'fragments' | 'short-reviews' | 'sentences' | 'meta'>('fragments');
    
    // 모달 및 데이터 갱신 신호 상태
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // 자식 컴포넌트 새로고침용

    // 탭 메뉴 정의
    const tabs = [
        { id: 'fragments', label: '기록 조각 (Memo)' },
        { id: 'short-reviews', label: '독자 한줄평 (Reviews)' }, // 한줄평 탭
        { id: 'meta', label: '상세 정보 (Meta)' }
    ] as const;

    // 메모 저장 핸들러
    const handleSaveMemo = async (data: any) => {
        if (!user) {
            toast.error("로그인이 필요한 기능입니다.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:8000/api/memos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isbn: current_edition.isbn,
                    user_email: user.email,
                    sentence: data.sentence,
                    thought: data.thought,
                    page_number: data.page ? parseInt(data.page) : null,
                    is_public: data.isPublic
                })
            });

            if (response.ok) {
                toast.success('당신의 사색이 안전하게 보관되었습니다.');
                setIsWriteModalOpen(false);
                setRefreshTrigger(prev => prev + 1); // [핵심] 자식 컴포넌트(MemoryLayer)에게 새로고침 신호 전송
            } else {
                const errorData = await response.json();
                toast.error(errorData.detail || '저장에 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
            toast.error('서버 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] pb-32 relative"> 
            {/* 1. 상단 네비게이션 */}
            <div className="bg-white sticky top-0 z-[40]">
                <Container className="pt-6 pb-2 max-w-[1440px]">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#1d1d1f] shadow-sm transition-all group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                </Container>
            </div>

            {/* 2. 도서 핵심 정보 (BookTopInfo 사용) */}
            <BookTopInfo 
                record={record} edition={current_edition} work={work}
                myEditions={my_editions} onRecordChange={(id) => router.push(`/library/${id}`)}
            />

            {/* 3. 탭 메뉴바 */}
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

            {/* 4. 탭 컨텐츠 영역 */}
            <Container className="max-w-[1200px] min-h-[600px] pb-10 mt-8">
                
                {/* [Tab 1] 기록 조각 (MemoryLayer) */}
                <div className={activeTab === 'fragments' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                    {record ? (
                        <RecordFragments 
                            recordId={record.id} 
                            user={user} 
                            refreshTrigger={refreshTrigger} // 신호 전달
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <Quote size={48} className="text-gray-200 mb-4" />
                            <p className="text-gray-500 font-medium mb-4">아직 내 서재에 담기지 않은 책입니다.</p>
                            <p className="text-sm text-gray-400">첫 번째 사색을 남기면 자동으로 서재에 추가됩니다.</p>
                            <button 
                                onClick={() => setIsWriteModalOpen(true)}
                                className="mt-6 bg-[#1d1d1f] text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} /> 첫 기록 남기기
                            </button>
                        </div>
                    )}
                </div>

                {/* [Tab 2] 독자 한줄평 (ShortReviewSection) */}
                <div className={activeTab === 'short-reviews' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                    <ShortReviewSection workId={work.id} />
                </div>
                
                {/* [Tab 3] 메타 정보 */}
                <div className={activeTab === 'meta' ? 'block animate-in fade-in duration-300' : 'hidden'}>
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
                                <span className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-1">출판사</span>
                                <span className="text-[15px] font-medium text-[#1d1d1f]">{current_edition?.publisher || "정보 없음"}</span>
                            </div>
                             <div className="flex flex-col py-2 border-b border-gray-50">
                                <span className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-1">페이지</span>
                                <span className="text-[15px] font-medium text-[#1d1d1f]">{current_edition?.page_count}p</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>

            {/* 5. 플로팅 글쓰기 버튼 (FAB) */}
            <button
                onClick={() => setIsWriteModalOpen(true)}
                className="fixed bottom-8 right-6 md:right-12 w-14 h-14 bg-[#1d1d1f] hover:bg-[#0066cc] text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all duration-300 hover:scale-110 z-40 group"
                aria-label="사색 기록하기"
            >
                <PenTool size={24} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* 6. 작성 모달 */}
            <MemoWriteModal 
                isOpen={isWriteModalOpen}
                onClose={() => setIsWriteModalOpen(false)}
                bookTitle={work?.title || "도서 제목 없음"}
                onSubmit={handleSaveMemo}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}