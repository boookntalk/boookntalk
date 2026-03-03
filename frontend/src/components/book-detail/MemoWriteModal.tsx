'use client';

import React, { useState } from 'react';
import { X, Save, Quote, BookOpen, Globe, Lock } from 'lucide-react';
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
        if (!sentence.trim() && !thought.trim()) {
            toast.error("문장이나 생각 중 하나는 반드시 입력해야 합니다.");
            return;
        }
        onSubmit({ sentence, thought, page, isPublic });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* [Layout] 모달 컨테이너: 책(Book)과 같은 단단한 사각형 
               rounded-[4px] 적용 
            */}
            <div className="w-full md:w-[500px] bg-white md:rounded-[4px] rounded-t-[4px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in slide-in-from-bottom-10 duration-300 border border-gray-200">
                
                {/* 1. 헤더 */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h3 className="text-[16px] font-bold text-[#1d1d1f] truncate max-w-[360px] font-serif tracking-tight">
                        {bookTitle}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 flex items-center justify-center rounded-[4px] hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 2. 입력 폼 영역 */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                    
                    {/* [1] 우측 상단 컨트롤: 페이지 & 공개 설정 */}
                    <div className="flex justify-end items-center gap-3 mb-[-10px]">
                        
                        {/* 페이지 입력 */}
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Page</span>
                            <input 
                                type="number" 
                                value={page}
                                onChange={(e) => setPage(e.target.value)}
                                placeholder="0"
                                // [수정] w-[70px]로 3자리 넉넉하게 / rounded-md (입력박스는 라운드)
                                className="w-[70px] h-[30px] px-2 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-right focus:border-black focus:ring-1 focus:ring-black/10 outline-none transition-all placeholder:text-gray-300"
                            />
                        </div>

                        {/* 구분선 */}
                        <div className="w-px h-3 bg-gray-300"></div>

                        {/* 공개 설정 (아이콘 + 텍스트) */}
                        <button 
                            onClick={() => setIsPublic(!isPublic)}
                            // [수정] w-[90px]로 너비 확보 / rounded-md (버튼은 라운드)
                            className="flex items-center justify-end gap-1.5 group outline-none w-[90px] h-[30px] rounded-md transition-colors hover:bg-gray-50 px-1" 
                            title={isPublic ? "전체 공개" : "나만 보기"}
                        >
                            {isPublic ? (
                                <>
                                    <Globe size={15} className="text-[#0066cc] transition-transform group-hover:scale-110 shrink-0" />
                                    <span className="text-[12px] font-bold text-[#0066cc] whitespace-nowrap">전체 공개</span>
                                </>
                            ) : (
                                <>
                                    <Lock size={15} className="text-gray-400 transition-transform group-hover:scale-110 shrink-0" />
                                    <span className="text-[12px] font-bold text-gray-400 whitespace-nowrap">나만 보기</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* [2] 문장 수집 */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-[#1d1d1f] flex items-center gap-1.5">
                            <Quote size={14} className="text-[#1d1d1f]" /> 문장 수집
                        </label>
                        {/* [수정] rounded-md 적용 (부드러운 입력창) */}
                        <textarea 
                            value={sentence}
                            onChange={(e) => setSentence(e.target.value)}
                            placeholder="기억하고 싶은 문구를 ..."
                            className="w-full p-4 bg-white rounded-md text-[15px] leading-relaxed border border-gray-300 focus:border-black focus:ring-1 focus:ring-black/10 outline-none transition-all resize-none min-h-[140px] placeholder:text-gray-400 font-serif shadow-sm"
                        />
                    </div>

                    {/* [3] 나의 생각 */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-[#1d1d1f] flex items-center gap-1.5">
                            <BookOpen size={14} className="text-[#1d1d1f]" /> 나의 생각
                        </label>
                        {/* [수정] rounded-md 적용 (부드러운 입력창) */}
                        <textarea 
                            value={thought}
                            onChange={(e) => setThought(e.target.value)}
                            placeholder="이 문장에 대한 나만의 생각을 남겨보세요."
                            className="w-full p-4 bg-white rounded-md text-[15px] leading-relaxed border border-gray-300 focus:border-black focus:ring-1 focus:ring-black/10 outline-none transition-all resize-none min-h-[120px] placeholder:text-gray-400 shadow-sm"
                        />
                    </div>

                </div>

                {/* 3. 하단 액션 버튼 */}
                <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex gap-3">
                    {/* [수정] rounded-md 적용 (버튼도 입력창과 같은 라운드) */}
                    <button 
                        onClick={onClose}
                        className="flex-1 h-[52px] bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-md font-bold text-[14px] transition-colors"
                    >
                        취소
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-[2] h-[52px] bg-[#1d1d1f] text-white rounded-md font-bold text-[14px] hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        {isSubmitting ? '저장 중...' : <><Save size={16} /> 기록하기</>}
                    </button>
                </div>
            </div>
        </div>
    );
}