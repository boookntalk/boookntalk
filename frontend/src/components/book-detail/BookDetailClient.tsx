'use client';

import React, { useState, useEffect } from 'react';
// ▼▼▼ [수정 1] URL의 꼬리표(?tab=...)를 읽기 위해 useSearchParams 추가 ▼▼▼
import { useRouter, useSearchParams } from 'next/navigation'; 
import Container from '@/components/layout/Container';
import BookTopInfo from './BookTopInfo';
import RecordFragments from './MemoryLayer'; 
import ShortReviewSection from './ShortReviewSection'; 
import LongReviewSection from './LongReviewSection';
import LongReviewListSection from './LongReviewListSection';
import MemoWriteModal from './MemoWriteModal'; 
import ShortReviewWriteModal from './ShortReviewWriteModal'; 
import { ArrowLeft, Quote, PenTool, MessageSquare, Globe, ArrowRight } from 'lucide-react'; 
import { toast } from 'sonner';
import Link from 'next/link'; // Link 컴포넌트도 필요합니다.

export default function BookDetailClient({ initialData, user }: { initialData: any, user: any }) {
    const router = useRouter();
    const searchParams = useSearchParams(); // 안테나 장착!
    
    const { record, work, current_edition, my_editions } = initialData;

    // ▼▼▼ [수정 2] 접속하자마자 URL을 확인하고 초기 탭을 결정합니다 ▼▼▼
    const initialTab = searchParams.get('tab') === 'long_review' ? 'long-review' : 'fragments';
    const [activeTab, setActiveTab] = useState<'fragments' | 'short-reviews' | 'long-review'>(initialTab);

    const [totalLongReviewCount, setTotalLongReviewCount] = useState(0);
    
    const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
    const [isShortReviewModalOpen, setIsShortReviewModalOpen] = useState(false);
    
    const [shortReviewMode, setShortReviewMode] = useState<'create' | 'edit'>('create');
    const [editReviewId, setEditReviewId] = useState<number | null>(null);
    const [editInitialContent, setEditInitialContent] = useState('');

    const [longReviewMode, setLongReviewMode] = useState<'community' | 'mine'>('community');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0); 
    const [memoCount, setMemoCount] = useState<number>(0);
    const [reviewCount, setReviewCount] = useState<number>(0);

    const tabs = [
        { id: 'fragments', label: `독서 노트 ${memoCount > 0 ? `(${memoCount})` : ''}` },
        { id: 'short-reviews', label: `한줄평 ${reviewCount > 0 ? `(${reviewCount})` : ''}` },
        { id: 'long-review', label: '긴줄평' }
    ] as const;

    // ▼▼▼ [핵심 2] 컴포넌트가 마운트될 때 긴줄평 개수만 살짝 가져옵니다 ▼▼▼
    useEffect(() => {
        if (work?.id) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/works/${work.id}/long-reviews`)
                .then(res => res.json())
                .then(data => setTotalLongReviewCount(data.length || 0))
                .catch(err => console.error("긴줄평 개수 로드 실패", err));
        }
    }, [work?.id]);

    // URL이 변경될 때 탭을 동기화하는 로직 (강력한 다중 스크롤 보정)
    useEffect(() => {
        const tab = searchParams.get('tab');
        
        if (tab === 'long_review') {
            setActiveTab('long-review');
            
            // ▼▼▼ Next.js의 방해를 이겨내는 '집요한 스크롤' 타이머 ▼▼▼
            let attempts = 0;
            const scrollInterval = setInterval(() => {
                const element = document.getElementById('review-tabs-area');
                if (element) {
                    // 상단 고정 헤더(56px) 오프셋 계산
                    const y = element.getBoundingClientRect().top + window.scrollY - 56;
                    window.scrollTo({ top: y, behavior: 'instant' });
                }
                
                attempts++;
                // 0.1초마다 총 10번(1초간) 확인하며 스크롤을 강제로 꽂아넣은 뒤 타이머 종료
                if (attempts >= 10) { 
                    clearInterval(scrollInterval);
                }
            }, 100);

            // 컴포넌트가 언마운트되거나 탭이 바뀌면 타이머 청소
            return () => clearInterval(scrollInterval);
            
        } else {
            if (tab === 'short_reviews') setActiveTab('short-reviews');
            else setActiveTab('fragments');
            
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [searchParams]);

    const handleSaveMemo = async (data: any) => {
        if (!user) { toast.error("로그인 필요"); return; }
        setIsSubmitting(true);
        try {
             const response = await fetch('http://localhost:8000/api/memos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isbn: current_edition.isbn, user_email: user.email,
                    sentence: data.sentence, thought: data.thought,
                    page_number: data.page ? parseInt(data.page) : null, is_public: data.isPublic
                })
            });
            if (response.ok) {
                toast.success('사색 보관 완료');
                setIsMemoModalOpen(false);
                setRefreshTrigger(prev => prev + 1);
            } else { toast.error('저장 실패'); }
        } catch (error) { toast.error('서버 오류'); } 
        finally { setIsSubmitting(false); }
    };

    const handleEditShortReviewClick = (review: any) => {
        setShortReviewMode('edit');
        setEditReviewId(review.id);
        setEditInitialContent(review.short_review);
        setIsShortReviewModalOpen(true);
    };

    const handleDeleteShortReviewClick = async (reviewId: number) => {
        if (!confirm("정말 이 한줄평을 삭제하시겠습니까?")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/short-reviews/${reviewId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('한줄평이 삭제되었습니다.');
                setRefreshTrigger(prev => prev + 1);
            } else { toast.error('삭제 실패'); }
        } catch (e) { toast.error('서버 오류'); }
    };

    const handleSaveShortReview = async (data: { content: string }) => {
        if (!user) { toast.error("로그인 필요"); return; }
        setIsSubmitting(true);
        try {
             const url = shortReviewMode === 'create' 
                ? 'http://localhost:8000/api/short-reviews' 
                : `http://localhost:8000/api/short-reviews/${editReviewId}`;
             const method = shortReviewMode === 'create' ? 'POST' : 'PUT';

             const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    edition_id: current_edition.id,
                    user_email: user.email,
                    short_review: data.content 
                })
            });
            if (response.ok) {
                toast.success(shortReviewMode === 'create' ? '한줄평이 등록되었습니다!' : '한줄평이 수정되었습니다!');
                setIsShortReviewModalOpen(false); 
                setRefreshTrigger(prev => prev + 1); 
            } else { toast.error('처리 실패'); }
        } catch (error) { toast.error('서버 오류가 발생했습니다.'); } 
        finally { setIsSubmitting(false); }
    };

    const handleFabClick = () => {
        if (activeTab === 'fragments') {
            setIsMemoModalOpen(true);
        } else if (activeTab === 'short-reviews') {
            setShortReviewMode('create');
            setEditInitialContent('');
            setEditReviewId(null);
            setIsShortReviewModalOpen(true);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] pb-32 relative"> 
            <div className="bg-white sticky top-0 z-[40]">
                <Container className="pt-5 pb-2 max-w-[1440px]">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#1d1d1f] shadow-sm transition-all group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                </Container>
            </div>

            <BookTopInfo record={record} edition={current_edition} work={work} myEditions={my_editions} onRecordChange={(id) => router.push(`/library/${id}`)} />

            <div id="review-tabs-area" className="sticky top-[56px] z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <Container className="max-w-[1200px]">
                    <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide pt-4">
                        
                        {/* 배열을 순회하는 map 함수 시작 */}
                        {tabs.map((tab) => (
                            <div 
                                key={tab.id} 
                                className={`flex items-center pb-3 border-b-[2px] transition-all ${activeTab === tab.id ? 'border-[#1d1d1f] text-[#1d1d1f]' : 'border-transparent text-gray-400 hover:text-[#1d1d1f]'}`}
                            >
                                {/* 1. 탭 전환 버튼 */}
                                <button
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className="text-[15px] font-bold whitespace-nowrap"
                                >
                                    {tab.label}
                                </button>
                                
                                {/* 2. 긴줄평 탭일 때만 옆에 파란색 건수(링크) 표시 */}
                                {tab.id === 'long-review' && totalLongReviewCount > 0 && (
                                    <Link 
                                        href={`/work/${work?.id}?tab=long_review`}
                                        className="ml-1.5 text-[12px] font-bold text-[#0066cc] hover:text-blue-700 hover:underline flex items-center bg-blue-50 px-1.5 py-0.5 rounded"
                                        title="광장의 도서 상세 긴줄평으로 이동"
                                    >
                                        {totalLongReviewCount}건
                                    </Link>
                                )}
                            </div>
                        ))}
                        {/* map 함수 끝 */}

                    </div>
                </Container>
            </div>

            <Container className="max-w-[1200px] min-h-[600px] pb-10 mt-8">
                <div className={activeTab === 'fragments' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                    {record ? (
                        <RecordFragments recordId={record.id} user={user} refreshTrigger={refreshTrigger} onDataLoaded={setMemoCount} />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200 border-dashed">
                             <Quote size={40} className="text-gray-300 mb-4" />
                             <p className="text-gray-500 font-medium mb-4">내 서재에 없는 책입니다.</p>
                             <button onClick={() => setIsMemoModalOpen(true)} className="bg-[#1d1d1f] text-white px-5 py-2.5 rounded-md font-bold text-sm">+ 첫 기록 남기기</button>
                        </div>
                    )}
                </div>

                <div className={activeTab === 'short-reviews' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                    <ShortReviewSection key={refreshTrigger} editionId={current_edition.id} onDataLoaded={setReviewCount} currentUser={user} onEditClick={handleEditShortReviewClick} onDeleteClick={handleDeleteShortReviewClick} />
                </div>
                
                {/* 3. 긴줄평 탭 (광장 배너는 지우고 오직 나의 에디터만 깔끔하게 노출) */}
                <div className={activeTab === 'long-review' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                    <LongReviewSection recordId={record?.id} user={user} />
                </div>
            </Container>

            {activeTab !== 'long-review' && (
                <button onClick={handleFabClick} className="fixed bottom-8 right-6 md:right-12 w-14 h-14 bg-[#FFEA00] hover:bg-[#F2D100] text-[#1d1d1f] rounded-full shadow-[0_8px_16px_rgba(255,234,0,0.25)] flex items-center justify-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 z-40 animate-in zoom-in">
                    {activeTab === 'fragments' && <PenTool size={24} className="animate-in zoom-in duration-200" />}
                    {activeTab === 'short-reviews' && <MessageSquare size={24} className="animate-in zoom-in duration-200" />}
                </button>
            )}
            
            <MemoWriteModal isOpen={isMemoModalOpen} onClose={() => setIsMemoModalOpen(false)} bookTitle={work?.title || ""} onSubmit={handleSaveMemo} isSubmitting={isSubmitting} />

            <ShortReviewWriteModal isOpen={isShortReviewModalOpen} onClose={() => setIsShortReviewModalOpen(false)} bookTitle={work?.title || ""} onSubmit={handleSaveShortReview} isSubmitting={isSubmitting} mode={shortReviewMode} initialContent={editInitialContent} />

        </div>
    );
}