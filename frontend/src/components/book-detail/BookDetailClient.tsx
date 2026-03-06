// src/components/book-detail/BookDetailClient.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/layout/Container';
import BookTopInfo from './BookTopInfo';
import RecordFragments from './MemoryLayer'; 
import ShortReviewSection from './ShortReviewSection'; 
import LongReviewSection from '@/components/library/LongReviewSection';
import MemoWriteModal from './MemoWriteModal'; 
import ShortReviewWriteModal from './ShortReviewWriteModal'; 
import { ArrowLeft, Quote, PenTool, MessageSquare, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function BookDetailClient({ initialData, user }: { initialData: any, user: any }) {
    const router = useRouter();
    const { record, work, current_edition, my_editions } = initialData;

    const [activeTab, setActiveTab] = useState<'fragments' | 'short-reviews' | 'long-review'>('fragments');
    const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
    const [isShortReviewModalOpen, setIsShortReviewModalOpen] = useState(false);
    
    // ▼▼▼ [추가] 한줄평 '수정 모드'를 위한 상태값 관리 ▼▼▼
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
        { id: 'long-review', label: '서평' }
    ] as const;

    const handleSaveMemo = async (data: any) => {
        // ... 기존 메모 저장 로직 (생략 없이 원본 유지) ...
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

    // ▼▼▼ [추가] 목록에서 '수정' 버튼을 눌렀을 때 ▼▼▼
    const handleEditShortReviewClick = (review: any) => {
        setShortReviewMode('edit');
        setEditReviewId(review.id);
        setEditInitialContent(review.short_review);
        setIsShortReviewModalOpen(true);
    };

    // ▼▼▼ [추가] 목록에서 '삭제' 버튼을 눌렀을 때 ▼▼▼
    const handleDeleteShortReviewClick = async (reviewId: number) => {
        if (!confirm("정말 이 한줄평을 삭제하시겠습니까?")) return;
        try {
            // [백엔드 참고] 실제 삭제 API 주소에 맞게 확인이 필요합니다.
            const res = await fetch(`http://localhost:8000/api/short-reviews/${reviewId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('한줄평이 삭제되었습니다.');
                setRefreshTrigger(prev => prev + 1);
            } else { toast.error('삭제 실패'); }
        } catch (e) { toast.error('서버 오류'); }
    };

    // ▼▼▼ [수정] 작성 모드(create)와 수정 모드(edit)를 구분하여 저장합니다 ▼▼▼
    const handleSaveShortReview = async (data: { content: string }) => {
        if (!user) { toast.error("로그인 필요"); return; }
        setIsSubmitting(true);
        try {
             const url = shortReviewMode === 'create' 
                ? 'http://localhost:8000/api/short-reviews' 
                : `http://localhost:8000/api/short-reviews/${editReviewId}`;
             const method = shortReviewMode === 'create' ? 'POST' : 'PUT'; // 수정일 땐 PUT 요청

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
            // FAB(새로 쓰기 버튼)을 누르면 항상 'create' 모드로 초기화합니다.
            setShortReviewMode('create');
            setEditInitialContent('');
            setEditReviewId(null);
            setIsShortReviewModalOpen(true);
        } else if (activeTab === 'long-review') {
            toast.info("서평 작성 화면으로 이동합니다! (개발 연결 필요)"); 
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] pb-32 relative"> 
            <div className="bg-white sticky top-0 z-[40]">
                <Container className="pt-6 pb-2 max-w-[1440px]">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#1d1d1f] shadow-sm transition-all group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                </Container>
            </div>

            <BookTopInfo record={record} edition={current_edition} work={work} myEditions={my_editions} onRecordChange={(id) => router.push(`/library/${id}`)} />

            <div className="sticky top-[56px] z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <Container className="max-w-[1200px]">
                    <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide pt-4">
                        {tabs.map(tab => (
                            <button
                                key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-3 text-[15px] font-bold whitespace-nowrap transition-all border-b-[2px] flex items-center gap-1.5 ${activeTab === tab.id ? 'border-[#1d1d1f] text-[#1d1d1f]' : 'border-transparent text-gray-400 hover:text-[#1d1d1f]'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </Container>
            </div>

            <Container className="max-w-[1200px] min-h-[600px] pb-10 mt-8">
                
                {/* [1] 독서 노트 탭: 화면에 숨겨두더라도 데이터는 미리 가져와서 개수를 파악합니다 */}
                <div className={activeTab === 'fragments' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                    {record ? (
                        <RecordFragments 
                            recordId={record.id} 
                            user={user} 
                            refreshTrigger={refreshTrigger}
                            onDataLoaded={setMemoCount}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200 border-dashed">
                             <Quote size={40} className="text-gray-300 mb-4" />
                             <p className="text-gray-500 font-medium mb-4">내 서재에 없는 책입니다.</p>
                             <button onClick={() => setIsMemoModalOpen(true)} className="bg-[#1d1d1f] text-white px-5 py-2.5 rounded-md font-bold text-sm">+ 첫 기록 남기기</button>
                        </div>
                    )}
                </div>

                {/* [2] 한줄평 탭: 클릭 전에도 미리 로딩하여 탭에 정확한 개수를 띄웁니다 */}
                <div className={activeTab === 'short-reviews' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                    <ShortReviewSection 
                        key={refreshTrigger}
                        editionId={current_edition.id} 
                        onDataLoaded={setReviewCount}
                        currentUser={user}
                        onEditClick={handleEditShortReviewClick}
                        onDeleteClick={handleDeleteShortReviewClick}
                    />
                </div>
                
                {/* [3] 서평 탭 */}
                <div className={activeTab === 'long-review' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                    <LongReviewSection />
                </div>

            </Container>

            <button 
                onClick={handleFabClick} 
                className="fixed bottom-8 right-6 md:right-12 w-14 h-14 bg-[#FFEA00] hover:bg-[#F2D100] text-[#1d1d1f] rounded-full shadow-[0_8px_16px_rgba(255,234,0,0.25)] flex items-center justify-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 z-40"
            >
                {activeTab === 'fragments' && <PenTool size={24} className="animate-in zoom-in duration-200" />}
                {activeTab === 'short-reviews' && <MessageSquare size={24} className="animate-in zoom-in duration-200" />}
                {activeTab === 'long-review' && <BookOpen size={24} className="animate-in zoom-in duration-200" />}
            </button>
            
            <MemoWriteModal isOpen={isMemoModalOpen} onClose={() => setIsMemoModalOpen(false)} bookTitle={work?.title || ""} onSubmit={handleSaveMemo} isSubmitting={isSubmitting} />

            {/* ▼▼▼ [수정] 모달에 현재 '수정 모드'인지와 기존 내용을 알려줍니다 ▼▼▼ */}
            <ShortReviewWriteModal 
                isOpen={isShortReviewModalOpen} 
                onClose={() => setIsShortReviewModalOpen(false)} 
                bookTitle={work?.title || ""} 
                onSubmit={handleSaveShortReview} 
                isSubmitting={isSubmitting} 
                mode={shortReviewMode}
                initialContent={editInitialContent}
            />

        </div>
    );
}