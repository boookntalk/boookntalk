// src/components/book-detail/ShortReviewWriteModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, MessageSquare, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

// ▼▼▼ 바로 이 부분(설계도)에 mode와 initialContent가 꼭 있어야 합니다! ▼▼▼
interface ShortReviewWriteModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookTitle: string;
    onSubmit: (data: { content: string }) => Promise<void>;
    isSubmitting: boolean;
    initialContent?: string; // [추가됨] 기존 글
    mode?: 'create' | 'edit'; // [추가됨] 작성/수정 모드
}

export default function ShortReviewWriteModal({ 
    isOpen, 
    onClose, 
    bookTitle, 
    onSubmit, 
    isSubmitting, 
    initialContent = '', 
    mode = 'create' 
}: ShortReviewWriteModalProps) {
    const [content, setContent] = useState('');
    const maxLength = 100;

    useEffect(() => {
        if (isOpen) {
            setContent(initialContent);
        }
    }, [isOpen, initialContent]);

    if (!isOpen) return null;

    const handleClose = () => {
        setContent('');
        onClose();
    };

    const handleSubmit = () => {
        if (!content.trim()) {
            toast.error("한줄평 내용을 입력해 주세요!");
            return;
        }
        onSubmit({ content });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full md:w-[500px] bg-white md:rounded-[4px] rounded-t-[4px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in slide-in-from-bottom-10 duration-300 border border-gray-200">
                
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h3 className="text-[16px] font-bold text-[#1d1d1f] truncate max-w-[360px] font-serif tracking-tight">
                        {bookTitle}
                    </h3>
                    <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-[4px] hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                    <div className="flex flex-col gap-2 mt-2">
                        <label className="text-[13px] font-bold text-[#1d1d1f] flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                {mode === 'edit' ? <Edit3 size={14} className="text-[#0066cc]" /> : <MessageSquare size={14} className="text-[#1d1d1f]" />} 
                                {mode === 'edit' ? '한줄평 수정하기' : '한줄평 남기기'}
                            </span>
                            <span className={`text-[11px] font-mono ${content.length >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
                                {content.length} / {maxLength}
                            </span>
                        </label>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
                            placeholder="이 책에 대한 짧은 감상을 남겨주세요."
                            className="w-full p-4 bg-white rounded-md text-[15px] leading-relaxed border border-gray-300 focus:border-black focus:ring-1 focus:ring-black/10 outline-none transition-all resize-none h-[120px] placeholder:text-gray-400 shadow-sm"
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex gap-3">
                    <button onClick={handleClose} className="flex-1 h-[52px] bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-md font-bold text-[14px] transition-colors">
                        취소
                    </button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="flex-[2] h-[52px] bg-[#1d1d1f] text-white rounded-md font-bold text-[14px] hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm">
                        {isSubmitting ? '저장 중...' : (
                            <>{mode === 'edit' ? <Edit3 size={16} /> : <Save size={16} />} {mode === 'edit' ? '수정 완료' : '한줄평 등록'}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}