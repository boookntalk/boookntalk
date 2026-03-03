'use client';

import React, { useState } from 'react';
import { Edit2, MoreHorizontal, Plus } from 'lucide-react';

// 임시 더미 데이터 (백엔드 연동 시 Props로 교체)
const DUMMY_MEMOS = [
    { id: 1, date: '2023.10.28', text: '독고씨의 정체는 무엇일까? 과거가 점점 궁금해진다.\n그가 편의점에서 일하면서 변해가는 모습이 인상적이다. 우리 주변에도 이런 사람이 있을까?', tags: ['인물분석', '독고'] },
    { id: 2, date: '2023.10.20', text: '오선숙 여사와 이들의 관계가 회복되는 과정이 뭉클했다.\n소통의 부재가 오해를 낳고, 작은 관심이 오해를 푼다. 결국 대화가 필요하다.', tags: ['감상', '관계'] },
    { id: 3, date: '2023.10.25', text: '"참참참 세트"... 나도 먹어보고 싶다.\n편의점 음식이 이렇게 위로가 될 수 있다는 게 신기하다. 오늘 저녁은 편의점에서 해결해볼까?', tags: ['아이디어', '음식'] },
];

export default function RecordFragments() {
    const [memoText, setMemoText] = useState('');

    return (
        // ▼▼▼ [수정된 부분] 중복된 className을 하나로 완벽하게 병합 ▼▼▼
        <div 
            className="w-full mt-8 md:columns-2 lg:columns-3 space-y-6" 
            style={{ columnGap: 'var(--spacing-1cm, 24px)', columnCount: 3 }}
        >
            
            {/* 1. 한줄평 카드 */}
            <div className="bg-[#EAF6F4] p-6 rounded-[20px] shadow-sm relative group break-inside-avoid w-full mb-6">
                <span className="text-[#0066cc] font-extrabold text-[13px] tracking-wide">한 줄 평</span>
                <p className="text-[#1d1d1f] text-[20px] font-bold leading-snug mt-4 mb-4 break-keep">
                    "힘든 하루 끝에 위로가 되어주는 따뜻한 이야기."
                </p>
                <button className="absolute bottom-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/50 hover:bg-white text-[#0066cc] transition-colors shadow-sm opacity-0 group-hover:opacity-100">
                    <Edit2 size={14} />
                </button>
            </div>

            {/* 2. 메모 남기기 입력 폼 */}
            <div className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] break-inside-avoid w-full mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Edit2 size={16} className="text-gray-400" />
                    <span className="text-[#1d1d1f] font-bold text-[15px]">메모 남기기</span>
                </div>
                <textarea 
                    value={memoText}
                    onChange={(e) => setMemoText(e.target.value)}
                    placeholder="이 책을 읽으며 든 생각이나 아이디어를 기록해보세요..."
                    className="w-full h-32 bg-gray-50/50 rounded-xl p-4 text-[14px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0066cc] focus:bg-white transition-colors resize-none mb-4"
                />
                <div className="flex items-center justify-between">
                    <button className="text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors">
                        # 태그 추가
                    </button>
                    <button className="bg-[#1d1d1f] hover:bg-black text-white px-5 py-2 rounded-lg text-[13px] font-bold transition-colors">
                        저장
                    </button>
                </div>
            </div>

            {/* 3. 작성된 메모 리스트 */}
            {DUMMY_MEMOS.map((memo) => (
                <div key={memo.id} className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] break-inside-avoid w-full mb-6 group cursor-pointer hover:border-gray-200 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[12px] font-semibold text-gray-400 tracking-wide">{memo.date}</span>
                        <button className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={16} />
                        </button>
                    </div>
                    <p className="text-[14px] text-gray-700 leading-relaxed font-medium whitespace-pre-wrap break-keep mb-6">
                        {memo.text}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {memo.tags.map(tag => (
                            <span key={tag} className="bg-gray-50 text-gray-500 px-2 py-1 rounded-md text-[11px] font-bold">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            ))}

            {/* 4. 새로운 메모 작성 점선 영역 */}
            <div className="border-2 border-dashed border-gray-200 bg-gray-50/30 rounded-[20px] p-6 min-h-[160px] flex flex-col items-center justify-center text-gray-400 hover:text-[#0066cc] hover:border-[#0066cc]/50 hover:bg-blue-50/20 transition-all cursor-pointer break-inside-avoid w-full mb-6">
                <Plus size={24} className="mb-2 opacity-50" />
                <span className="text-[13px] font-bold">새로운 메모 작성하기</span>
            </div>

        </div>
    );
}