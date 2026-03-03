'use client';

import React, { useState } from 'react';
import { X, Save, Quote, PenTool, Globe, Lock, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface MemoWriteModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookTitle: string;
    onSubmit: (data: any) => Promise<void>;
    isSubmitting: boolean;
}

export default function MemoWriteModal({ isOpen, onClose, bookTitle, onSubmit, isSubmitting }: MemoWriteModalProps) {
    const [sentence, setSentence] = useState('');
    const [thought, setThought] = useState('');
    const [page, setPage] = useState('');
    const [isPublic, setIsPublic] = useState(true);

    if (!isOpen) return null;

    const handleSubmit = () => {
        // 유효성 검사: 문장이나 생각 중 하나는 있어야 함
        if (!sentence.trim() && !thought.trim()) {
            toast.error("문장이나 생각 중 하나는 반드시 입력해야 합니다.");
            return;
        }
        onSubmit({ sentence, thought, page, isPublic });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* 모달 박스 */}
            <div className="w-full md:w-[600px] bg-white md:rounded-[24px] rounded-t-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in slide-in-from-bottom-10 duration-300">
                
                {/* 1. 헤더 */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <span className="text-[12px] font-bold text-[#0066cc] flex items-center gap-1 mb-1">
                            <PenTool size={12} /> 사색 기록하기
                        </span>
                        <h3 className="text-[18px] font-extrabold text-[#1d1d1f] truncate max-w-[240px] md:max-w-md leading-tight">
                            {bookTitle}
                        </h3>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 2. 입력 폼 (스크롤 영역) */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 bg-[#F5F5F7]/30">
                    
                    {/* (1) 문장 수집 */}
                    <div className="space-y-2 group">
                        <label className="text-[13px] font-bold text-gray-500 flex items-center gap-1.5 group-focus-within:text-[#0066cc] transition-colors">
                            <Quote size={14} /> 문장 수집 (Sentence)
                        </label>
                        <div className="relative">
                            <textarea 
                                value={sentence}
                                onChange={(e) => setSentence(e.target.value)}
                                placeholder="책 속에서 발견한 보석 같은 문장을 적어주세요."
                                className="w-full p-5 bg-white rounded-2xl text-[15px] leading-relaxed border border-gray-200 focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 transition-all resize-none min-h-[140px] font-serif placeholder:font-sans placeholder:text-gray-300 shadow-sm"
                            />
                            {/* 장식용 따옴표 */}
                            <Quote className="absolute top-4 left-4 text-gray-100 pointer-events-none" size={40} fill="currentColor" />
                        </div>
                    </div>

                    {/* (2) 나의 사색 */}
                    <div className="space-y-2 group">
                        <label className="text-[13px] font-bold text-gray-500 flex items-center gap-1.5 group-focus-within:text-[#0066cc] transition-colors">
                            <BookOpen size={14} /> 나의 사색 (Thought)
                        </label>
                        <textarea 
                            value={thought}
                            onChange={(e) => setThought(e.target.value)}
                            placeholder="이 문장이 당신에게 어떤 파동을 주었나요? 자유롭게 남겨보세요."
                            className="w-full p-5 bg-white border border-gray-200 rounded-2xl text-[15px] leading-relaxed focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 transition-all resize-none min-h-[120px] placeholder:text-gray-300 shadow-sm"
                        />
                    </div>

                    {/* (3) 메타 정보 (페이지 & 공개 설정) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-400 pl-1">페이지 (선택)</label>
                            <input 
                                type="number" 
                                value={page}
                                onChange={(e) => setPage(e.target.value)}
                                placeholder="p."
                                className="w-full p-3.5 bg-white rounded-xl text-[14px] font-medium border border-gray-200 focus:border-[#0066cc] outline-none transition-all text-center placeholder:text-gray-300 shadow-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-400 pl-1">공개 설정</label>
                            <button 
                                onClick={() => setIsPublic(!isPublic)}
                                className={`w-full p-3.5 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition-all border shadow-sm ${
                                    isPublic 
                                    ? 'bg-[#eaf4fd] text-[#0066cc] border-[#0066cc]/20' 
                                    : 'bg-gray-100 text-gray-500 border-transparent'
                                }`}
                            >
                                {isPublic ? <Globe size={14} /> : <Lock size={14} />}
                                {isPublic ? '전체 공개' : '나만 보기'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. 하단 액션 버튼 */}
                <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-[15px] transition-colors"
                    >
                        취소
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-[2] py-3.5 bg-[#1d1d1f] text-white rounded-xl font-bold text-[15px] hover:bg-[#0066cc] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/5"
                    >
                        {isSubmitting ? '저장 중...' : <><Save size={18} /> 사색 보관하기</>}
                    </button>
                </div>
            </div>
        </div>
    );
}