// src/app/(main)/library/[id]/BookDetailClient.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; 
import BookTopInfo from './BookTopInfo';
import RecordFragments from './MemoryLayer'; 
import ShortReviewSection from './ShortReviewSection'; 
import LongReviewSection from './LongReviewSection';
import MemoWriteModal from './MemoWriteModal'; 
import ShortReviewWriteModal from './ShortReviewWriteModal'; 
// 💡 [추가] 브레드크럼용 Home, ChevronRight 아이콘 추가 (ArrowLeft 제거)
import { Quote, PenTool, MessageSquare, ChevronRight, Home } from 'lucide-react'; 
import { toast } from 'sonner';
import Link from 'next/link';

export default function BookDetailClient({ initialData, user }: { initialData: any, user: any }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const { record, work, current_edition, my_editions } = initialData;

    const initialTab = searchParams.get('tab') === 'long_review' ? 'long-review' : 'fragments';
    const [activeTab, setActiveTab] = useState<'fragments' | 'short-reviews' | 'long-review'>(initialTab);

    const [totalLongReviewCount, setTotalLongReviewCount] = useState(0);
    
    const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
    const [isShortReviewModalOpen, setIsShortReviewModalOpen] = useState(false);
    
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

    const DUMMY_AUTHOR_INFO = {
        id: "author_1",
        name: work?.author?.split(',')[0] || "작가 이름",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Keigo_Higashino.jpg/220px-Keigo_Higashino.jpg",
        bio: "이 작가는 놀라운 필력으로 독자들을 사로잡는 베스트셀러 작가입니다."
    };

    const DUMMY_OTHER_BOOKS = [
        { id: 'work_1', title: "다른 책 1", cover: "https://via.placeholder.com/150x200" },
        { id: 'work_2', title: "다른 책 2", cover: "https://via.placeholder.com/150x200" },
        { id: 'work_3', title: "다른 책 3", cover: "https://via.placeholder.com/150x200" }
    ];

    useEffect(() => {
        if (work?.id) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/works/${work.id}/long-reviews`)
                .then(res => res.json())
                .then(data => setTotalLongReviewCount(data.length || 0))
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

    const handleFabClick = () => {
        if (activeTab === 'fragments') setIsMemoModalOpen(true);
        else if (activeTab === 'short-reviews') { setShortReviewMode('create'); setEditInitialContent(''); setEditReviewId(null); setIsShortReviewModalOpen(true); }
    };

    return (
        <div className="flex flex-col w-full h-full min-h-screen bg-[#F5F5F7]"> 
            
            {/* ========================================================= */}
            {/* 💡 [흰색 통합 영역] 브레드크럼 ~ 도서 정보 ~ 탭 메뉴 (bg-white) */}
            {/* ========================================================= */}
            <div className="w-full bg-white relative">
                
                {/* 1. 상단 브레드크럼 (화살표 대체) */}
                <div className="w-full max-w-[1200px] mx-auto px-[var(--spacing-1cm,32px)] pt-6 pb-2">
                    <div className="flex items-center gap-1.5 text-[13px] font-bold text-gray-400">
                        <Link href="/" className="flex items-center gap-1 hover:text-[#0066cc] transition-colors">
                            <Home size={14} /> 홈
                        </Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <Link href="/library" className="hover:text-[#0066cc] transition-colors">
                            내 서재
                        </Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-[#1d1d1f] truncate max-w-[200px] sm:max-w-md">
                            {work?.title || '도서 상세'}
                        </span>
                    </div>
                </div>
                
                {/* 2. 도서 상세 정보 */}
                <div className="w-full">
                    <BookTopInfo 
                        record={record} 
                        edition={current_edition} 
                        work={work} 
                        myEditions={my_editions} 
                        onRecordChange={(id) => router.push(`/library/${id}`)}
                        authorInfo={DUMMY_AUTHOR_INFO}
                        authorOtherBooks={DUMMY_OTHER_BOOKS}
                    />
                </div>

                {/* 3. 스크롤 시 상단 고정 탭 영역 */}
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
            {/* 흰색 통합 영역 끝 */}

            {/* ========================================================= */}
            {/* 💡 [회색 배경 영역] 탭 메뉴 하단 콘텐츠 (bg-[#F5F5F7]) */}
            {/* ========================================================= */}
            <div className="w-full flex-1 px-[var(--spacing-1cm,32px)] pt-[var(--spacing-1cm,32px)] pb-32 max-w-[1200px] mx-auto">
                <div className="w-full">
                    {/* 독서 노트 탭 */}
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

                    {/* 한줄평 탭 */}
                    <div className={activeTab === 'short-reviews' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                        <ShortReviewSection key={refreshTrigger} editionId={current_edition.id} onDataLoaded={setReviewCount} currentUser={user} onEditClick={handleEditShortReviewClick} onDeleteClick={handleDeleteShortReviewClick} />
                    </div>
                    
                    {/* 긴줄평 탭 */}
                    <div className={activeTab === 'long-review' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                        <LongReviewSection recordId={record?.id} user={user} />
                    </div>
                </div>
            </div>

            {/* 플로팅 버튼 */}
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