'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Quote, BookOpen, Send, Trash2, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface MemoryLayerProps {
    recordId: number;
    user: any;
}

export default function MemoryLayer({ recordId, user }: MemoryLayerProps) {
    const [pageNumber, setPageNumber] = useState('');
    const [sentence, setSentence] = useState('');
    const [thought, setThought] = useState('');
    const [memos, setMemos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // [NEW] 개별 메모의 공개/비공개 상태 (기본값: 공개)
    const [isPublic, setIsPublic] = useState(true);

    const fetchMemos = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/records/${recordId}/memos`);
            if (res.ok) {
                const data = await res.json();
                setMemos(data);
            }
        } catch (error) {
            console.error("Failed to fetch memos", error);
        }
    };

    useEffect(() => {
        fetchMemos();
    }, [recordId]);

    const handleSubmit = async () => {
        if (!sentence.trim()) {
            toast.error("수집할 문장을 입력해 주세요.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/records/${recordId}/memos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page_number: parseInt(pageNumber) || 0,
                    sentence,
                    thought,
                    is_public: isPublic // [NEW] 공개 여부 데이터 추가
                })
            });

            if (res.ok) {
                toast.success("기억의 지층에 문장이 추가되었습니다.");
                setPageNumber('');
                setSentence('');
                setThought('');
                setIsPublic(true); // 전송 후 기본값으로 초기화
                fetchMemos();
            }
        } catch (error) {
            toast.error("저장에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (memoId: number) => {
        if (!confirm("이 기억을 삭제하시겠습니까?")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/memos/${memoId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("기억이 삭제되었습니다.");
                fetchMemos();
            }
        } catch (error) {
            toast.error("삭제에 실패했습니다.");
        }
    };

    return (
        <div className="flex flex-col gap-[var(--spacing-1cm)] animate-in fade-in duration-500">
            {/* 1. 메모 입력 폼 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
                
                <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-gray-400" />
                    <Input 
                        type="number" 
                        placeholder="페이지 (선택)" 
                        value={pageNumber} 
                        onChange={(e) => setPageNumber(e.target.value)}
                        className="w-32 bg-gray-50 text-sm"
                    />
                </div>
                
                <div className="relative">
                    <Quote className="absolute left-3 top-3 w-4 h-4 text-gray-300" />
                    <Textarea 
                        placeholder="기억하고 싶은 문장을 발췌해 보세요." 
                        value={sentence}
                        onChange={(e) => setSentence(e.target.value)}
                        className="pl-10 min-h-[80px] bg-gray-50 resize-none text-sm"
                    />
                </div>

                <Textarea 
                    placeholder="이 문장에 대한 나의 생각이나 영감을 덧붙여 보세요. (선택)" 
                    value={thought}
                    onChange={(e) => setThought(e.target.value)}
                    className="min-h-[80px] bg-gray-50 resize-none text-sm"
                />

                {/* [NEW] 하단 컨트롤 영역: 좌측(공개토글) / 우측(저장버튼) */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2">
                    <button
                        type="button"
                        onClick={() => setIsPublic(!isPublic)}
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-[#1d1d1f] transition-colors"
                    >
                        {isPublic ? <Globe size={16} className="text-blue-500" /> : <Lock size={16} className="text-gray-400" />}
                        {isPublic ? "전체 공개" : "나만 보기"}
                    </button>

                    <Button 
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-[#1d1d1f] hover:bg-[#333] text-white flex items-center gap-2 px-6 rounded-xl"
                    >
                        <Send size={14} />
                        {isLoading ? "저장 중..." : "기록 저장"}
                    </Button>
                </div>
            </div>

            {/* 2. 타임라인 피드 */}
            <div className="flex flex-col gap-5">
                <h4 className="font-bold text-gray-400 text-xs uppercase tracking-wider pl-2">Timeline</h4>
                {memos.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">아직 수집된 문장이 없습니다. 첫 번째 기억을 남겨보세요.</div>
                ) : (
                    memos.map((memo) => (
                        <div key={memo.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 group transition-all hover:shadow-md">
                            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-1">
                                <div className="flex items-center gap-2">
                                    {memo.author_image ? (
                                        <img src={memo.author_image} alt="profile" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                                            {memo.author_name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-sm font-semibold text-[#1d1d1f]">{memo.author_name}</span>
                                    <span className="text-gray-300 text-xs mx-1">•</span>
                                    <span className="text-xs text-gray-400">{memo.created_at.split('T')[0]}</span>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    {/* [NEW] 비공개 메모일 경우 자물쇠 아이콘 표시 */}
                                    {memo.is_public === false && (
                                        <Lock size={14} className="text-gray-400" />
                                    )}
                                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full font-mono">
                                        p. {memo.page_number > 0 ? memo.page_number : '-'}
                                    </span>
                                    <button onClick={() => handleDelete(memo.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="border-l-2 border-gray-800 pl-4 py-1">
                                <p className="font-serif text-[#1d1d1f] text-[16px] leading-loose break-keep">"{memo.sentence}"</p>
                            </div>
                            {memo.thought && (
                                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">{memo.thought}</p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}