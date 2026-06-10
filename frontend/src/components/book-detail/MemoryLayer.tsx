// 파일 경로: src/components/book-detail/MemoryLayer.tsx
// 역할 및 기능: 도서 상세 페이지 내의 '독서노트' 탭 리스트를 렌더링하며, 본문 14px 폰트 표준과 레이아웃 일관성을 확보했습니다.

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Quote, Trash2, Edit3, Lock, Hash } from 'lucide-react'; 
import { toast } from 'sonner';

interface MemoryLayerProps {
    recordId: number;
    user: any;
    refreshTrigger?: number;
    onDataLoaded?: (count: number) => void;
}

export default function MemoryLayer({ recordId, user, refreshTrigger, onDataLoaded }: MemoryLayerProps) {
    const [memos, setMemos] = useState<any[]>([]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ pageNumber: '', sentence: '', thought: '', isPublic: true });
    const [expandedMemos, setExpandedMemos] = useState<Record<number, boolean>>({});

    const fetchMemos = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/records/${recordId}/memos`);
            if (res.ok) {
                const data = await res.json();
                setMemos(data);
                if (onDataLoaded) onDataLoaded(data.length);
            }
        } catch (error) {
            console.error("Failed to fetch memos", error);
        }
    };

    useEffect(() => { fetchMemos(); }, [recordId, refreshTrigger]);

    const openEditModal = (memo: any) => {
        setEditingId(memo.id);
        setForm({
            pageNumber: memo.page_number > 0 ? memo.page_number.toString() : '',
            sentence: memo.sentence,
            thought: memo.thought || '',
            isPublic: memo.is_public ?? true
        });
        setIsModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!form.sentence.trim()) return toast.error("문장을 입력해 주세요.");
        try {
            const res = await fetch(`http://localhost:8000/api/memos/${editingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page_number: parseInt(form.pageNumber) || 0,
                    sentence: form.sentence,
                    thought: form.thought,
                    is_public: form.isPublic
                })
            });
            if (res.ok) {
                toast.success("기억이 수정되었습니다.");
                setIsModalOpen(false);
                fetchMemos();
            }
        } catch (error) {
            toast.error("오류가 발생했습니다.");
        }
    };

    const handleDelete = async (memoId: number) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/memos/${memoId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("삭제되었습니다.");
                fetchMemos();
            }
        } catch (error) {
            toast.error("삭제 실패");
        }
    };

    if (memos.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-200 border-dashed">
                <Quote size={32} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium text-[14px]">아직 기록된 문장이 없습니다.</p>
                <p className="text-[12px] mt-1 text-gray-400">우측 하단의 펜 버튼을 눌러보세요.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 pb-20">
            {memos.map((memo) => {
                const isExpanded = expandedMemos[memo.id] || false;
                const isLong = (memo.sentence?.length > 150) || 
                               ((memo.sentence?.match(/\n/g) || []).length > 3) || 
                               (memo.thought && memo.thought.length > 150) || 
                               (memo.thought && (memo.thought.match(/\n/g) || []).length > 2);

                return (
                <div 
                    key={memo.id} 
                    className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 hover:border-gray-300 transition-colors group shadow-sm hover:shadow-md"
                >
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-bold border border-gray-200">
                                {memo.author_name?.charAt(0) || 'U'}
                            </div>
                            <span className="text-[13px] font-bold text-[#1d1d1f]">{memo.author_name}</span>
                            <span className="text-[11px] text-gray-300">·</span>
                            <span className="text-[12px] text-gray-400 font-medium">{memo.created_at?.split('T')[0]}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {!memo.is_public && <Lock size={12} className="text-gray-400" />}
                            
                            {memo.page_number > 0 && (
                                <div className="flex items-center gap-1 bg-gray-50 text-gray-500 text-[11px] font-bold px-2 py-1 rounded-[4px] border border-gray-100">
                                    <Hash size={10} /> {memo.page_number}
                                </div>
                            )}

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                <button onClick={() => openEditModal(memo)} className="p-1.5 text-gray-400 hover:text-[#0066cc] hover:bg-blue-50 rounded-md transition-colors"><Edit3 size={14} /></button>
                                <button onClick={() => handleDelete(memo.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>

                    <div>
                        {/* 💡 문장 본문은 시각적 구분을 위해 16px 세리프 유지 */}
                        <p className={`font-serif text-[#1d1d1f] text-[16px] leading-[1.8] break-keep selection:bg-[#dbeafe] whitespace-pre-wrap ${!isExpanded && isLong ? 'line-clamp-4' : ''}`}>
                            {memo.sentence}
                        </p>
                    </div>
                    
                    {memo.thought && (
                        <div className="mt-5 pt-5 border-t border-gray-50">
                            {/* 💡 기획자님 표준: 생각/노트 폰트는 14px 적용 */}
                            <p className={`text-[14px] text-gray-600 leading-relaxed font-medium break-keep whitespace-pre-wrap ${!isExpanded && isLong ? 'line-clamp-3' : ''}`}>
                                <span className="text-[#0066cc] font-bold mr-1.5">생각.</span> 
                                {memo.thought}
                            </p>
                        </div>
                    )}

                    {isLong && (
                        <div className="mt-4 pt-1">
                            <button 
                                onClick={() => setExpandedMemos(prev => ({ ...prev, [memo.id]: !prev[memo.id] }))}
                                className="text-[13px] font-bold text-gray-400 hover:text-[#0066cc] transition-colors"
                            >
                                {isExpanded ? '접기' : '더보기'}
                            </button>
                        </div>
                    )}
                </div>
            )})}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl">
                     <DialogTitle className="text-base font-bold">기억 수정하기</DialogTitle>
                     <div className="flex flex-col gap-4 mt-2">
                        <div className="flex gap-2 justify-end">
                            <Input 
                                type="number" 
                                value={form.pageNumber} 
                                onChange={e=>setForm({...form, pageNumber:e.target.value})} 
                                placeholder="Page" 
                                className="w-[80px] h-[32px] text-[13px] rounded-lg"
                            />
                        </div>
                        <Textarea 
                            value={form.sentence} 
                            onChange={e=>setForm({...form, sentence:e.target.value})} 
                            className="min-h-[100px] font-serif text-[15px] resize-none rounded-xl"
                            placeholder="문장 수정" 
                        />
                        <Textarea 
                            value={form.thought} 
                            onChange={e=>setForm({...form, thought:e.target.value})} 
                            className="min-h-[80px] text-[14px] resize-none rounded-xl"
                            placeholder="생각 수정" 
                        />
                        <div className="flex justify-end gap-2 mt-4">
                             <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">취소</Button>
                             <Button onClick={handleUpdate} className="bg-[#1d1d1f] text-white rounded-xl">수정 완료</Button>
                        </div>
                     </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}