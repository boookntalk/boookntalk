'use client';

import React, { useState } from 'react';
import { Star, Calendar, Bookmark, Quote } from 'lucide-react';

export default function BookDetailForm({ libraryId }: { libraryId: number }) {
    // 상태 관리 (DB의 UserLibrary 컬럼과 매칭)
    const [status, setStatus] = useState('reading');
    const [rating, setRating] = useState(0);
    const [startDate, setStartDate] = useState('');
    const [finishDate, setFinishDate] = useState('');
    const [shortReview, setShortReview] = useState('');

    // 저장 함수 (Process 6: 백엔드 연동 준비)
    const handleSave = async () => {
        const payload = { status, rating, start_date: startDate, finish_date: finishDate, short_review: shortReview };
        console.log("저장 데이터:", payload);
        // fetch(`/api/my-library/${libraryId}`, { method: 'PATCH', ... })
        alert("독서 기록이 저장되었습니다.");
    };

    return (
        <div className="bg-white rounded-[24px] border border-[#f5f5f7] p-8 shadow-sm max-w-2xl mx-auto">
            <h3 className="text-[20px] font-bold text-[#1d1d1f] mb-8 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#0066cc]" /> 나만의 독서 기록
            </h3>

            <div className="space-y-8">
                {/* 1. 독서 상태 토글 */}
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

                {/* 2. 별점 입력 */}
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

                {/* 3. 독서 기간 */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[14px] font-semibold text-[#86868b] mb-3 block">시작일</label>
                        <input 
                            type="date" 
                            className="w-full bg-[#f5f5f7] border-none rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-[#0066cc]/20 outline-none"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-[14px] font-semibold text-[#86868b] mb-3 block">완독일</label>
                        <input 
                            type="date" 
                            className="w-full bg-[#f5f5f7] border-none rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-[#0066cc]/20 outline-none"
                            value={finishDate}
                            onChange={(e) => setFinishDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* 4. 한 줄 평 */}
                <div>
                    <label className="text-[14px] font-semibold text-[#86868b] mb-3 block">한 줄 평</label>
                    <div className="relative">
                        <Quote className="absolute left-4 top-4 w-4 h-4 text-[#86868b]/30" />
                        <textarea 
                            className="w-full bg-[#f5f5f7] border-none rounded-2xl px-10 py-4 text-[15px] min-h-[100px] focus:ring-2 focus:ring-[#0066cc]/20 outline-none resize-none"
                            placeholder="이 책을 한 마디로 정의한다면?"
                            maxLength={200}
                            value={shortReview}
                            onChange={(e) => setShortReview(e.target.value)}
                        />
                        <span className="absolute bottom-4 right-4 text-[11px] text-[#86868b]">
                            {shortReview.length}/200
                        </span>
                    </div>
                </div>

                {/* 저장 버튼 */}
                <button 
                    onClick={handleSave}
                    className="w-full bg-[#0066cc] text-white py-4 rounded-2xl font-bold text-[16px] hover:bg-[#0055aa] transition-colors shadow-lg shadow-[#0066cc]/20"
                >
                    기록 저장하기
                </button>
            </div>
        </div>
    );
}