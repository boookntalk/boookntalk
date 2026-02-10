'use client';

import React, { useState, useEffect } from 'react';
import { Star, Calendar, X } from 'lucide-react';
import { DESIGN_TOKEN } from '@/constants/styles';
import { useRouter } from 'next/navigation';

// 반쪽 별을 위한 SVG 그래디언트 (그대로 유지)
const StarGradientDef = () => (
    <svg width="0" height="0" className="absolute hidden">
        <defs>
            <linearGradient id="half-star" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="50%" stopColor="#FFCC00" />
                <stop offset="50%" stopColor="#E5E5E7" />
            </linearGradient>
        </defs>
    </svg>
);

export default function BookDetailForm({ initialData, onClose }: any) {
    const router = useRouter();

    const [status, setStatus] = useState(() => {
        const s = initialData?.status?.toLowerCase();
        if (s === 'completed') return 'finished';
        return s || 'reading';
    });
    
    const [rating, setRating] = useState(initialData?.rating || 0);
    const [startDate, setStartDate] = useState(initialData?.start_date ? initialData.start_date.split('T')[0] : '');
    const [finishDate, setFinishDate] = useState(initialData?.finish_date ? initialData.finish_date.split('T')[0] : '');
    const [shortReview, setShortReview] = useState(initialData?.short_review || '');
    
    const [isSaving, setIsSaving] = useState(false);

    const fullTitle = initialData?.title || "";
    const fullAuthor = initialData?.author || "";

    const renderStrictLines = (text: string) => {
        if (!text) return null;
        const line1 = text.slice(0, 18);
        const remaining = text.slice(18);
        const line2 = remaining.length > 15 ? remaining.slice(0, 15) + "..." : remaining;
        return (
            <div className="flex flex-col items-start w-full">
                <span className="block whitespace-nowrap leading-tight">{line1}</span>
                {line2 && <span className="block whitespace-nowrap leading-tight text-gray-500">{line2}</span>}
            </div>
        );
    };

    useEffect(() => {
        if (status === 'wish') { 
            setStartDate(''); 
            setFinishDate(''); 
        } else if (status === 'reading' && !startDate) {
            setStartDate(new Date().toISOString().split('T')[0]);
            setFinishDate('');
        } else if (status === 'finished' && !finishDate) {
            if (!startDate) setStartDate(new Date().toISOString().split('T')[0]);
            setFinishDate(new Date().toISOString().split('T')[0]);
        }
    }, [status]);

    // [핵심 수정] 별점 토글 로직 (Full -> Half -> Empty)
    const handleStarClick = (i: number) => {
        const clickedValue = i + 1; // 클릭한 별의 값 (예: 3번째 별 = 3점)
        
        if (rating === clickedValue) {
            // 1. 현재 꽉 찬 상태면 -> 반 개(0.5)로 줄임
            setRating(clickedValue - 0.5);
        } else if (rating === clickedValue - 0.5) {
            // 2. 현재 반 개 상태면 -> 비움 (이전 정수로 돌아감)
            setRating(clickedValue - 1);
        } else {
            // 3. 그 외(다른 별 클릭 or 비어있음) -> 꽉 채움
            setRating(clickedValue);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);

        let backendStatus = 'READING';
        if (status === 'finished') backendStatus = 'COMPLETED';
        if (status === 'wish') backendStatus = 'WISH';

        const payload = {
            status: backendStatus,
            rating: parseFloat(rating),
            short_review: shortReview,
            start_date: startDate || null,
            finish_date: finishDate || null,
        };

        try {
            const targetId = initialData.library_id || initialData.id;
            const res = await fetch(`http://localhost:8000/api/my-library/${targetId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.refresh();
                onClose();
            } else {
                alert("저장에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error saving book:", error);
            alert("서버 연결 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={`p-6 flex flex-col gap-5 bg-white ${DESIGN_TOKEN.ROUND.MODAL} shadow-2xl relative max-w-[620px] w-full max-h-[95vh] overflow-y-auto`}>
            <StarGradientDef />
            
            {/* 상단 헤더 */}
            <div className="flex justify-between items-start pb-5 border-b border-gray-50">
                <div className="flex gap-5 items-start flex-1 min-w-0">
                    {initialData?.cover ? (
                        <img src={initialData.cover} className="w-20 h-28 rounded shadow-md object-cover flex-shrink-0" alt="cover" />
                    ) : (
                        <div className="w-20 h-28 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Img</div>
                    )}
                    <div className="flex flex-col gap-1.5 pt-1">
                        <h3 className="text-[19px] font-bold text-[#1d1d1f] leading-tight">{renderStrictLines(fullTitle)}</h3>
                        <p className="text-[#86868b] text-[15px] font-medium">{renderStrictLines(fullAuthor)}</p>
                    </div>
                </div>
                
                <button 
                    onClick={onClose} 
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors -mr-2 -mt-2"
                >
                    <X size={24} />
                </button>
            </div>

            {/* 폼 섹션 */}
            <div className="space-y-5">
                {/* 1. 독서 상태 및 평점 */}
                <section className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <label className="text-[13px] font-bold mb-2 block text-[#1d1d1f]">독서 상태</label>
                        <div className={`flex bg-[#f5f5f7] p-1 ${DESIGN_TOKEN.ROUND.ITEM}`}>
                            {['wish', 'reading', 'finished'].map((s) => (
                                <button 
                                    key={s} 
                                    onClick={() => setStatus(s)} 
                                    className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                                        status === s 
                                        ? 'bg-white shadow-sm text-blue-600' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {s === 'wish' ? '읽고 싶은' : s === 'reading' ? '읽는 중' : '완독'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 별점 입력 영역 */}
                    <div className="flex flex-col items-end">
                        <div className="flex items-center mb-1 gap-3">
                            <label className="text-[13px] font-bold text-[#1d1d1f]">평점</label>
                            <span className="text-[15px] font-black text-blue-600">{rating.toFixed(1)}</span>
                        </div>
                        <div className="flex gap-0.5 cursor-pointer">
                            {[0, 1, 2, 3, 4].map((i) => {
                                let fill = "#E5E5E7";
                                // 별 색상 채우기 로직
                                if (rating >= i + 1) {
                                    fill = "#FFCC00"; // 꽉 찬 별
                                } else if (rating > i) {
                                    fill = "url(#half-star)"; // 반쪽 별
                                }

                                return (
                                    // [수정] onClick에서 event 객체 제거하고 index만 전달
                                    <Star 
                                        key={i}
                                        className="w-6 h-6 text-[#e5e5e7] transition-all active:scale-90" // 클릭 시 살짝 눌리는 효과 추가
                                        fill={fill}
                                        onClick={() => handleStarClick(i)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* 2. 날짜 입력 */}
                {status !== 'wish' && (
                    <section className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                        <div>
                            <label className="text-[12px] font-bold text-[#86868b] mb-1.5 flex items-center gap-1">
                                <Calendar size={12} /> 시작일
                            </label>
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-[#f5f5f7] px-3 py-2 rounded-lg text-[13px] font-medium outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-[12px] font-bold text-[#86868b] mb-1.5 flex items-center gap-1">
                                <Calendar size={12} /> 완독일
                            </label>
                            <input 
                                type="date" 
                                value={finishDate} 
                                onChange={(e) => setFinishDate(e.target.value)}
                                disabled={status !== 'finished'} 
                                className={`w-full bg-[#f5f5f7] px-3 py-2 rounded-lg text-[13px] font-medium outline-none focus:ring-1 focus:ring-blue-500 ${status !== 'finished' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                        </div>
                    </section>
                )}

                {/* 3. 한줄평 */}
                <section>
                    <label className="text-[13px] font-bold mb-2 block">한 줄 평</label>
                    <textarea 
                        value={shortReview} 
                        onChange={(e) => setShortReview(e.target.value)} 
                        placeholder="이 책에서 얻은 사색을 한 줄로 남겨주세요." 
                        className="w-full bg-[#f5f5f7] p-4 rounded-xl h-20 resize-none text-[14px] outline-none border-none focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400" 
                    />
                </section>
            </div>

            {/* 하단 버튼 */}
            <div className="flex gap-3 pt-4 border-t border-gray-50">
                <button onClick={onClose} className="flex-1 bg-[#f5f5f7] py-4 rounded-xl font-bold text-sm text-[#86868b] hover:bg-gray-200 transition-colors">
                    취소
                </button>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="flex-[2] bg-[#1d1d1f] text-white py-4 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg disabled:opacity-70 flex justify-center items-center gap-2"
                >
                    {isSaving ? "저장 중..." : "기록 완료"}
                </button>
            </div>
        </div>
    );
}