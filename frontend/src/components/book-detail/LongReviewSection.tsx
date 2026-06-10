// 파일 경로: src/components/book-detail/LongReviewSection.tsx
// 역할 및 기능: 긴줄평 탭의 읽기 화면을 담당하며, 에디터를 모달로 분리하여 코드를 최적화했습니다.

'use client';

import React, { useState, useEffect } from 'react';
import { PenTool, Eye, Trash2, Globe, Lock, AlertTriangle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface LongReviewSectionProps {
    recordId?: number | string;
    user?: any;
    refreshTrigger: number;
    onWriteClick: (data: any | null) => void; 
}

export default function LongReviewSection({ recordId, user, refreshTrigger, onWriteClick }: LongReviewSectionProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); 
    const [hasReview, setHasReview] = useState(false); 
    const [isPublic, setIsPublic] = useState(false); 
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!recordId || isNaN(Number(recordId))) {
            setIsLoading(false);
            return;
        }
        
        const fetchLongReview = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/records/${recordId}/long-review`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.long_review_title || data.long_review_content) {
                        setTitle(data.long_review_title || '');
                        setContent(data.long_review_content || '');
                        setIsPublic(!data.is_long_review_draft); 
                        setIsSpoiler(data.is_spoiler || false);
                        setHasReview(true);
                    } else {
                        setHasReview(false);
                    }
                }
            } finally { 
                setIsLoading(false); 
            }
        };
        fetchLongReview();
    }, [recordId, refreshTrigger]); // 💡 refreshTrigger가 바뀔 때마다 자동 새로고침

    const handleDelete = async () => {
        if (!confirm("정말 이 긴줄평을 삭제하시겠습니까? (복구할 수 없습니다)")) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/records/${recordId}/long-review`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('긴줄평이 삭제되었습니다.');
                setTitle('');
                setContent('');
                setHasReview(false);
                setIsPublic(false);
                setIsSpoiler(false);
            } else {
                toast.error('삭제에 실패했습니다.');
            }
        } catch (error) {
            toast.error('서버 오류가 발생했습니다.');
        }
    };

    if (isLoading) {
        return <div className="w-full h-[300px] bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse mb-[var(--spacing-1cm,32px)]" />;
    }

    // 💡 조건 1: 기록된 리뷰가 없는 경우 (Empty State)
    if (!hasReview) {
        return (
            <div className="w-full bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center py-16 mb-[var(--spacing-1cm,32px)]">
                <div className="mb-4">
                    <MessageSquare size={36} className="text-gray-200" strokeWidth={1.5} />
                </div>
                <h3 className="text-[16px] font-bold text-[#1d1d1f] mb-2">아직 기록된 사색이 없습니다.</h3>
                <p className="text-[14px] text-gray-400 mb-6">
                    첫 번째 긴줄평을 남겨 BoooknTalk 광장을 빛내주세요.
                </p>
            </div>
        );
    }

    // 💡 조건 2: 기록된 리뷰가 있는 경우 (View Mode)
    return (
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-[var(--spacing-1cm,32px)]">
            {/* 상단 헤더 및 컨트롤 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-white">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-[#0066cc] rounded-full" /> 
                    <span className="text-[14px] font-bold text-[#1d1d1f]">나의 긴줄평</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 mr-1">
                        {isSpoiler && isPublic && (
                            <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">스포일러 포함</span>
                        )}
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-md border ${isPublic ? 'text-[#0066cc] bg-blue-50 border-blue-100' : 'text-gray-400 bg-gray-50 border-gray-100'}`}>
                            {isPublic ? '전체 공개' : '나만 보기'}
                        </span>
                    </div>

                    <button 
                        onClick={() => onWriteClick({ title, content, isPublic, isSpoiler })} // 수정 모드 데이터 전달
                        className="p-2 text-gray-400 hover:text-[#0066cc] hover:bg-blue-50 rounded-lg transition-colors title='수정하기'"
                    >
                        <Eye size={18} />
                    </button>
                    <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors title='삭제하기'">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* 본문 영역 */}
            <div className="px-6 md:px-12 py-10 min-h-[400px]">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h1 className="text-[28px] md:text-[32px] font-black text-[#1d1d1f] mb-10 leading-tight tracking-tight">
                        {title || "제목 없는 긴줄평"}
                    </h1>
                    <div 
                        className="sun-editor-editable max-w-none text-[14px] text-[#3a3a3c] leading-[1.8] break-keep p-0 border-none"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>
            </div>
        </div>
    );
}