'use client';

import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { DESIGN_TOKEN } from '@/constants/styles';

export default function BookDetailForm({ initialData, onClose }: any) {
    const [status, setStatus] = useState(initialData?.status || 'reading');
    const [rating, setRating] = useState(initialData?.rating || 0);
    const [startDate, setStartDate] = useState(initialData?.start_date ? initialData.start_date.split('T')[0] : '');
    const [finishDate, setFinishDate] = useState(initialData?.finish_date ? initialData.finish_date.split('T')[0] : '');
    const [shortReview, setShortReview] = useState(initialData?.short_review || '');
    const [progress, setProgress] = useState(initialData?.progress || 0);
    const [isSaving, setIsSaving] = useState(false);

    const fullTitle = initialData?.title || "";
    const fullAuthor = initialData?.author || "";

    const renderStrictLines = (text: string) => {
        if (!text) return null;
        const line1 = text.slice(0, 20);
        const remaining = text.slice(20);
        const line2 = remaining.length > 15 ? remaining.slice(0, 15) + "..." : remaining;
        return (
            <div className="flex flex-col items-start w-full">
                <span className="block whitespace-nowrap leading-tight">{line1}</span>
                {line2 && <span className="block whitespace-nowrap leading-tight">{line2}</span>}
            </div>
        );
    };

    useEffect(() => {
        if (status === 'wish') { setStartDate(''); setFinishDate(''); }
    }, [status]);

    const handleStarClick = (e: React.MouseEvent<SVGSVGElement>, i: number) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setRating(i + (e.clientX - rect.left < rect.width / 2 ? 0.5 : 1));
    };

    const handleSave = async () => {
        setIsSaving(true);
        console.log("Saving...", { status, rating, progress });
        setTimeout(() => { setIsSaving(false); onClose(); }, 500);
    };

    return (
        <div className={`p-8 flex flex-col gap-6 bg-white ${DESIGN_TOKEN.ROUND.MODAL} shadow-2xl relative max-w-[500px] w-full`}>
            {/* 상단 정보 */}
            <div className="flex gap-5 items-start pb-5 border-b border-gray-50">
                <img src={initialData?.cover} className="w-20 h-28 rounded shadow-md object-contain flex-shrink-0" alt="" />
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <h3 className="text-[19px] font-bold text-[#1d1d1f]">{renderStrictLines(fullTitle)}</h3>
                    <p className="text-[#86868b] text-[15px] font-medium">{renderStrictLines(fullAuthor)}</p>
                </div>
            </div>

            {/* 폼 섹션 */}
            <div className="space-y-6">
                <section>
                    <label className="text-[13px] font-bold mb-2 block text-[#1d1d1f]">독서 상태</label>
                    <div className={`flex bg-[#f5f5f7] p-1 ${DESIGN_TOKEN.ROUND.ITEM}`}>
                        {['wish', 'reading', 'finished'].map((s) => (
                            <button key={s} onClick={() => setStatus(s)} className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${status === s ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>
                                {s === 'wish' ? '관심' : s === 'reading' ? '독서중' : '완독'}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="flex items-end justify-between gap-8">
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[13px] font-bold text-[#1d1d1f]">진척도</label>
                            <span className="text-xs text-blue-600 font-bold">{progress}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center mb-1 gap-3"><label className="text-[13px] font-bold text-[#1d1d1f]">평점</label><span className="text-[15px] font-black text-blue-600">{rating.toFixed(1)}</span></div>
                        <div className="flex gap-0.5">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div key={i} className="relative w-6 h-6">
                                    <Star className="w-full h-full text-[#e5e5e7] fill-[#e5e5e7]" />
                                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(100, (rating - i) * 100))}%` }}>
                                        <Star className="w-full h-full text-yellow-400 fill-yellow-400" />
                                    </div>
                                    <svg className="absolute inset-0 w-full h-full cursor-pointer" onClick={(e) => handleStarClick(e, i)}><rect width="100%" height="100%" fill="transparent" /></svg>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section>
                    <label className="text-[13px] font-bold mb-2 block">한 줄 평</label>
                    <textarea value={shortReview} onChange={(e) => setShortReview(e.target.value)} placeholder="사색을 한 줄로 남겨주세요." className="w-full bg-[#f5f5f7] p-4 rounded-xl h-24 resize-none text-[14px] outline-none border-none focus:ring-2 focus:ring-blue-500/10" />
                </section>
            </div>

            <div className="flex gap-3 pt-4">
                <button onClick={onClose} className="flex-1 bg-[#f5f5f7] py-4 rounded-xl font-bold text-sm text-[#86868b]">취소</button>
                <button onClick={handleSave} disabled={isSaving} className="flex-[2] bg-[#1d1d1f] text-white py-4 rounded-xl font-bold text-sm">기록 완료</button>
            </div>
        </div>
    );
}