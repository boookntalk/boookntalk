'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Quote, BookOpen, Send, Trash2 } from 'lucide-react';
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

    // [API] 메모 목록 불러오기
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

    // [API] 메모 저장
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
                    thought
                })
            });

            if (res.ok) {
                toast.success("기억의 지층에 문장이 추가되었습니다.");
                setPageNumber('');
                setSentence('');
                setThought('');
                fetchMemos(); // 리스트 갱신
            }
        } catch (error) {
            toast.error("저장에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // [API] 메모 삭제
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                {/* ... (이전 UI 코드 유지) ... */}
                <div className="flex justify-end pt-2">
                    <Button 
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-[#1d1d1f] hover:bg-[#333] text-white flex items-center gap-2 px-6"
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
                                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full font-mono">
                                        p. {memo.page_number > 0 ? memo.page_number : '-'}
                                    </span>
                                    {/* 본인이 쓴 글만 삭제 가능하도록 처리할 수 있습니다 */}
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