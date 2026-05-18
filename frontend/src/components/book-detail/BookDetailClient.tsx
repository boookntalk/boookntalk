// 파일 경로: src/components/book-detail/BookDetailClient.tsx
// 역할 및 기능: 긴줄평 팝업(Modal) 상태를 관리하고, 각 탭 컴포넌트와 모달을 연결합니다.

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; 
import BookTopInfo from './BookTopInfo';
import RecordFragments from './MemoryLayer'; 
import ShortReviewSection from './ShortReviewSection'; 
import LongReviewSection from './LongReviewSection';
import MemoWriteModal from './MemoWriteModal'; 
import ShortReviewWriteModal from './ShortReviewWriteModal'; 
import LongReviewWriteModal from './LongReviewWriteModal'; // 💡 [추가] 긴줄평 모달 임포트
import { Quote, ChevronRight, Home } from 'lucide-react'; 
import { toast } from 'sonner';
import Link from 'next/link';

export default function BookDetailClient({ initialData, user }: { initialData: any, user: any }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const { record, work, current_edition, my_editions, authorInfo, authorOtherBooks } = initialData;

    const initialTab = searchParams.get('tab') === 'long_review' ? 'long-review' : 'fragments';
    const [activeTab, setActiveTab] = useState<'fragments' | 'short-reviews' | 'long-review'>(initialTab);

    const [totalLongReviewCount, setTotalLongReviewCount] = useState(0);
    
    const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
    const [isShortReviewModalOpen, setIsShortReviewModalOpen] = useState(false);
    
    // 💡 [추가] 긴줄평 모달 상태 관리
    const [isLongReviewModalOpen, setIsLongReviewModalOpen] = useState(false);
    const [longReviewEditData, setLongReviewEditData] = useState<any>(null);
    
    const [shortReviewMode, setShortReviewMode] = useState<'create' | 'edit'>('create');
    const [editReviewId, setEditReviewId] = useState<number | null>(null);
    const [editInitialContent, setEditInitialContent] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0); 
    const [memoCount, setMemoCount] = useState<number>(0);
    const [reviewCount, setReviewCount] = useState<number>(0);

    const tabs = [
        { id: 'fragments', label: `독서 노트 ${memoCount > 0 ? `(${memoCount})` : ''}` },
        { id: 'short-reviews', label: `한줄평 ${reviewCount > 0 ? `(${reviewCount})` : ''}` },
        { id: 'long-review', label: '긴줄평' }
    ] as const;

    useEffect(() => {
        if (work?.id) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/works/${work.id}/long-reviews/count`)
                .then(res => res.json())
                .then(data => {
                    setTotalLongReviewCount(data.count || 0);
                })
                .catch(err => console.error("긴줄평 개수 로드 실패", err));
        }
    }, [work?.id]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        
        if (tab === 'long_review') {
            setActiveTab('long-review');
            let attempts = 0;
            const scrollInterval = setInterval(() => {
                const element = document.getElementById('review-tabs-area');
                if (element) {
                    const y = element.getBoundingClientRect().top + window.scrollY - 56;
                    window.scrollTo({ top: y, behavior: 'instant' });
                }
                attempts++;
                if (attempts >= 10) clearInterval(scrollInterval);
            }, 100);
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
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isbn: current_edition.isbn, user_email: user.email,
                    sentence: data.sentence, thought: data.thought,
                    page_number: data.page ? parseInt(data.page) : null, is_public: data.isPublic
                })
            });
            if (response.ok) {
                toast.success('사색 보관 완료'); setIsMemoModalOpen(false); setRefreshTrigger(prev => prev + 1);
            } else { toast.error('저장 실패'); }
        } catch (error) { toast.error('서버 오류'); } finally { setIsSubmitting(false); }
    };

    const handleWriteShortReviewClick = () => {
        setShortReviewMode('create'); 
        setEditInitialContent(''); 
        setEditReviewId(null); 
        setIsShortReviewModalOpen(true);
    };

    const handleEditShortReviewClick = (review: any) => {
        setShortReviewMode('edit'); setEditReviewId(review.id); setEditInitialContent(review.short_review); setIsShortReviewModalOpen(true);
    };

    const handleDeleteShortReviewClick = async (reviewId: number) => {
        if (!confirm("정말 이 한줄평을 삭제하시겠습니까?")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/short-reviews/${reviewId}`, { method: 'DELETE' });
            if (res.ok) { toast.success('한줄평이 삭제되었습니다.'); setRefreshTrigger(prev => prev + 1); }
        } catch (e) { toast.error('서버 오류'); }
    };

    const handleSaveShortReview = async (data: { content: string }) => {
        if (!user) { toast.error("로그인 필요"); return; }
        setIsSubmitting(true);
        try {
             const url = shortReviewMode === 'create' ? 'http://localhost:8000/api/short-reviews' : `http://localhost:8000/api/short-reviews/${editReviewId}`;
             const method = shortReviewMode === 'create' ? 'POST' : 'PUT';
             const response = await fetch(url, {
                method: method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ edition_id: current_edition.id, user_email: user.email, short_review: data.content })
            });
            if (response.ok) {
                toast.success(shortReviewMode === 'create' ? '등록되었습니다!' : '수정되었습니다!');
                setIsShortReviewModalOpen(false); setRefreshTrigger(prev => prev + 1); 
            } else { toast.error('처리 실패'); }
        } catch (error) { toast.error('서버 오류'); } finally { setIsSubmitting(false); }
    };

    // 💡 [추가] 긴줄평 작성/수정 모달 트리거 함수
    const handleWriteLongReviewClick = (data: any = null) => {
        setLongReviewEditData(data);
        setIsLongReviewModalOpen(true);
    };

    return (
        <div className="flex flex-col w-full h-full min-h-screen bg-[#F5F5F7]"> 
            
            <div className="w-full bg-white relative">
                <div className="w-full max-w-[1200px] mx-auto px-[var(--spacing-1cm,32px)] pt-6 pb-2">
                    <div className="flex items-center gap-1.5 text-[13px] font-bold text-gray-400">
                        <Link href="/" className="flex items-center gap-1 hover:text-[#0066cc] transition-colors">
                            <Home size={14} /> 홈
                        </Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="cursor-default">내 서재</span>
                        <ChevronRight size={14} className="opacity-50" />
                        <Link href="/library" className="hover:text-[#0066cc] transition-colors">도서</Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-[#1d1d1f] truncate max-w-[200px] sm:max-w-md">
                            {work?.title || '도서 상세'}
                        </span>
                    </div>
                </div>
                
                <div className="w-full">
                    <BookTopInfo 
                        record={record} 
                        edition={current_edition} 
                        work={work} 
                        myEditions={my_editions} 
                        onRecordChange={(id) => router.push(`/library/${id}`)}
                        authorInfo={authorInfo} 
                        authorOtherBooks={authorOtherBooks}
                        currentUser={user}
                    />
                </div>

                <div id="review-tabs-area" className="sticky top-[56px] z-30 w-full px-[var(--spacing-1cm,32px)] bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm pt-4">
                    <div className="max-w-[1200px] mx-auto flex items-center gap-8 overflow-x-auto scrollbar-hide pb-0">
                        {tabs.map((tab) => (
                            <div key={tab.id} className={`flex items-center pb-3 border-b-[2px] transition-all ${activeTab === tab.id ? 'border-[#1d1d1f] text-[#1d1d1f]' : 'border-transparent text-gray-400 hover:text-[#1d1d1f]'}`}>
                                <button onClick={() => setActiveTab(tab.id as any)} className="text-[14px] font-bold whitespace-nowrap">
                                    {tab.label}
                                </button>
                                {tab.id === 'long-review' && totalLongReviewCount > 0 && (
                                    <Link href={`/work/${work?.id}?tab=long_review`} className="ml-1.5 text-[12px] font-bold text-[#0066cc] hover:text-blue-700 hover:underline flex items-center bg-blue-50 px-1.5 py-0.5 rounded">
                                        {totalLongReviewCount}건
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-full flex-1 px-[var(--spacing-1cm,32px)] pt-[var(--spacing-1cm,32px)] pb-32 max-w-[1200px] mx-auto">
                <div className="w-full">
                    
                    <div className={activeTab === 'fragments' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                        {record ? (
                            <RecordFragments recordId={record.id} user={user} refreshTrigger={refreshTrigger} onDataLoaded={setMemoCount} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
                                 <Quote size={40} className="text-gray-300 mb-4" />
                                 <p className="text-[14px] text-gray-500 font-medium mb-4">내 서재에 없는 책입니다.</p>
                                 <button onClick={() => setIsMemoModalOpen(true)} className="bg-[#1d1d1f] text-white px-5 py-2.5 rounded-xl font-bold text-[14px]">+ 첫 기록 남기기</button>
                            </div>
                        )}
                    </div>

                    <div className={activeTab === 'short-reviews' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                        <ShortReviewSection key={refreshTrigger} editionId={current_edition.id} onDataLoaded={setReviewCount} currentUser={user} onEditClick={handleEditShortReviewClick} onDeleteClick={handleDeleteShortReviewClick} onWriteClick={handleWriteShortReviewClick} />
                    </div>
                    
                    {/* 💡 [연결] 긴줄평 읽기 영역 렌더링 및 모달 호출 프롭 전달 */}
                    <div className={activeTab === 'long-review' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                        <LongReviewSection 
                            recordId={record?.id} 
                            user={user} 
                            refreshTrigger={refreshTrigger} 
                            onWriteClick={handleWriteLongReviewClick} 
                        />
                    </div>
                </div>
            </div>

            {/* 모든 모달(Popup) 렌더링을 이곳에 통합합니다. */}
            <MemoWriteModal isOpen={isMemoModalOpen} onClose={() => setIsMemoModalOpen(false)} bookTitle={work?.title || ""} onSubmit={handleSaveMemo} isSubmitting={isSubmitting} />
            
            <ShortReviewWriteModal isOpen={isShortReviewModalOpen} onClose={() => setIsShortReviewModalOpen(false)} bookTitle={work?.title || ""} onSubmit={handleSaveShortReview} isSubmitting={isSubmitting} mode={shortReviewMode} initialContent={editInitialContent} />
            
            {/* 💡 [추가] 긴줄평 모달 마운트 */}
            <LongReviewWriteModal 
                isOpen={isLongReviewModalOpen}
                onClose={() => setIsLongReviewModalOpen(false)}
                recordId={record?.id}
                user={user}
                initialData={longReviewEditData}
                onSuccess={() => {
                    setIsLongReviewModalOpen(false);
                    setRefreshTrigger(prev => prev + 1); // 저장 성공 시 부모 트리거를 올려 본문을 재조회시킵니다.
                }}
            />

        </div>
    );
}