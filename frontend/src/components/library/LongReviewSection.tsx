'use client';

import React, { useState } from 'react';
import { PenTool, Save, Eye } from 'lucide-react';

export default function LongReviewSection() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isEditing, setIsEditing] = useState(true);

    return (
        <div className="w-full bg-white rounded-[24px] p-8 md:p-12 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-gray-100 mt-[var(--spacing-1cm,32px)]">
            <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0066cc]">
                        <PenTool size={18} />
                    </div>
                    <div>
                        <h2 className="text-[20px] font-extrabold text-[#1d1d1f]">나의 리뷰</h2>
                        <p className="text-[13px] text-gray-400 font-medium mt-1">이 책이 남긴 깊은 여운을 한 편의 글로 완성해보세요.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all bg-[#1d1d1f] text-white hover:bg-black"
                >
                    {isEditing ? <><Save size={14} /> 저장하기</> : <><Eye size={14} /> 편집하기</>}
                </button>
            </div>

            {isEditing ? (
                <div className="flex flex-col gap-[var(--spacing-1cm,24px)]">
                    <input 
                        type="text"
                        placeholder="리뷰의 제목을 입력하세요 (예: 올해 만난 최고의 위로)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-[24px] font-bold text-[#1d1d1f] placeholder-gray-300 outline-none border-none bg-transparent"
                    />
                    <textarea 
                        placeholder="자유롭게 독후감을 작성해보세요. 인상 깊었던 점, 아쉬웠던 점, 내 삶에 적용할 점 등 무엇이든 좋습니다."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-[400px] text-[16px] leading-loose text-gray-700 placeholder-gray-300 outline-none border-none bg-transparent resize-none font-medium"
                    />
                </div>
            ) : (
                <div className="min-h-[400px]">
                    <h1 className="text-[28px] font-extrabold text-[#1d1d1f] mb-8">{title || "제목 없는 리뷰"}</h1>
                    <p className="text-[16px] leading-loose text-gray-700 whitespace-pre-wrap break-keep">
                        {content || "아직 작성된 리뷰 내용이 없습니다."}
                    </p>
                </div>
            )}
        </div>
    );
}