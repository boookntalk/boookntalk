'use client';

import React, { useState } from 'react';
import { Star, Calendar, Bookmark, Quote, Save } from 'lucide-react';

interface BookDetailFormProps {
    libraryId: number;
    initialData?: {
        status: string;
        rating: number;
        start_date: string | null;
        finish_date: string | null;
        short_review: string | null;
    };
}

export default function BookDetailForm({ libraryId, initialData }: BookDetailFormProps) {
    // 1. 상태 관리
    const [status, setStatus] = useState(initialData?.status || 'reading');
    const [rating, setRating] = useState(initialData?.rating || 0);
    const [startDate, setStartDate] = useState(initialData?.start_date?.split('T')[0] || '');
    const [finishDate, setFinishDate] = useState(initialData?.finish_date?.split('T')[0] || '');
    const [shortReview, setShortReview] = useState(initialData?.short_review || '');
    const [isSaving, setIsSaving] = useState(false);

    // 2. 저장 로직 (API 연동)
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = { 
                status, 
                rating, 
                start_date: startDate ? new Date(startDate).toISOString() : null, 
                finish_date: finishDate ? new Date(finishDate).toISOString() : null, 
                short_review: shortReview 
            };

            const response = await fetch(`http://localhost:8000/api/my-library/${libraryId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert("✅ 독서 기록이 저장되었습니다.");
            } else {
                alert("❌ 저장에 실패했습니다.");
            }
        } catch (error) {
            console.error("저장 오류:", error);
            alert("서버 연결에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-[24px] border border-[#f5f5f7] p-8 shadow-sm">
            <h3 className="text-[20px] font-bold text-[#1d1d1f] mb-8 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#0066cc]" /> 나만의 독서 기록
            </h3>

            <div className="space-y-8">
                {/* 독서 상태 */}
                <div>
                    <label className="text-[14px] font-semibold text-[#86868b] mb-3 block">현재 상태</label>
                    <div className="flex bg-[#f5f5f7] p-1 rounded-xl w-fit">
                        {['wish', 'reading', 'finished', 'paused'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatus(s)}
                                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                                    status === s ? 'bg-white shadow-sm text-[#0066cc]' : 'text-[#86868b]'
                                }`}
                            >
                                {s === 'wish' ? '읽고 싶음' : s === 'reading' ? '읽는 중' : s === 'finished' ? '완독' : '중단'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 별점 */}
                <div>
                    <label className="text-[14px] font-semibold text-[#86868b] mb-3 block">이 책의 점수 ({rating}점)</label>
                    <div className="flex gap-1 items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-8 h-8 cursor-pointer transition-colors ${
                                    rating >= star ? 'fill-[#ffcc00] text-[#ffcc00]' : 'text-[#e5e5e7]'
                                }`}
                                onClick={() => setRating(star)}
                            />
                        ))}
                    </div>
                </div>

                {/* 기간 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[14px] font-semibold text-[#86868b] mb-3 block">시작일</label>
                        <input 
                            type="date" 
                            className="w-full bg-[#f5f5f7] border-none rounded-xl px-4 py-3 text-[14px] outline-none"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-[14px] font-semibold text-[#86868b] mb-3 block">완독일</label>
                        <input 
                            type="date" 
                            className="w-full bg-[#f5f5f7] border-none rounded-xl px-4 py-3 text-[14px] outline-none"
                            value={finishDate}
                            onChange={(e) => setFinishDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* 한 줄 평 */}
                <div>
                    <label className="text-[14px] font-semibold text-[#86868b] mb-3 block">한 줄 평</label>
                    <div className="relative">
                        <Quote className="absolute left-4 top-4 w-4 h-4 text-[#86868b]/30" />
                        <textarea 
                            className="w-full bg-[#f5f5f7] border-none rounded-2xl px-10 py-4 text-[15px] min-h-[100px] outline-none resize-none"
                            placeholder="이 책을 한 마디로 정의한다면?"
                            value={shortReview}
                            onChange={(e) => setShortReview(e.target.value)}
                        />
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-[#0066cc] text-white py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 hover:bg-[#0055aa] disabled:bg-gray-400 transition-colors"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? '저장 중...' : '기록 저장하기'}
                </button>
            </div>
        </div>
    );
}