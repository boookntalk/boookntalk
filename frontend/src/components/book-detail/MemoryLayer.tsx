'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Quote, BookOpen, Trash2, Edit3, Globe, Lock, Save } from 'lucide-react';
import { toast } from 'sonner';

// [수정] refreshTrigger props 추가
interface MemoryLayerProps {
    recordId: number;
    user: any;
    refreshTrigger?: number; 
}

export default function MemoryLayer({ recordId, user, refreshTrigger }: MemoryLayerProps) {
    const [memos, setMemos] = useState<any[]>([]);
    
    // 모달 상태 (수정용)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ pageNumber: '', sentence: '', thought: '', isPublic: true });

    const fetchMemos = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/records/${recordId}/memos`);
            if (res.ok) setMemos(await res.json());
        } catch (error) {
            console.error("Failed to fetch memos", error);
        }
    };

    // [수정] refreshTrigger가 변할 때마다 목록 갱신
    useEffect(() => { fetchMemos(); }, [recordId, refreshTrigger]);

    // 수정 모달 열기
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

    // 수정 저장 (PATCH)
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
                fetchMemos(); // 목록 갱신
            }
        } catch (error) {
            toast.error("오류가 발생했습니다.");
        }
    };

    // 삭제
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

    return (
        <div className="flex flex-col relative pb-20">
            {/* 상단 통계 */}
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-extrabold text-[#1d1d1f] flex items-center gap-2">
                    수집된 문장 <span className="text-[#0066cc] bg-blue-50 px-2.5 py-0.5 rounded-full text-sm">{memos.length}</span>
                </h3>
            </div>

            {/* 타임라인 뷰 */}
            <div className="flex flex-col gap-8 border-l-2 border-gray-100/80 pl-6 ml-3">
                {memos.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm -ml-6">
                        <Quote size={40} className="mx-auto mb-4 opacity-20" />
                        <p className="font-bold text-[15px] mb-1">아직 수집된 문장이 없습니다.</p>
                        <p className="text-sm">우측 하단 버튼을 눌러 첫 번째 기억을 남겨보세요.</p>
                    </div>
                ) : (
                    memos.map((memo) => (
                        <div key={memo.id} className="relative bg-white rounded-3xl p-7 shadow-sm border border-gray-100 group transition-all hover:shadow-md">
                            {/* 노드 점 */}
                            <div className="absolute -left-[31px] top-8 w-[10px] h-[10px] bg-white border-2 border-gray-300 rounded-full group-hover:border-[#0066cc] transition-colors" />

                            <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                                <div className="flex items-center gap-2.5">
                                    {/* 프로필 이미지 로직 */}
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold">
                                        {memo.author_name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-bold text-[#1d1d1f]">{memo.author_name || 'Anonymous'}</span>
                                        <span className="text-[11px] text-gray-400 font-medium">{memo.created_at?.split('T')[0]}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    {!memo.is_public && <Lock size={14} className="text-gray-400" />}
                                    <span className="bg-gray-50 text-gray-500 text-xs font-bold px-3 py-1 rounded-full font-mono border border-gray-100">
                                        p. {memo.page_number > 0 ? memo.page_number : '-'}
                                    </span>
                                    
                                    {/* 수정/삭제 메뉴 */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                        <button onClick={() => openEditModal(memo)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"><Edit3 size={15} /></button>
                                        <button onClick={() => handleDelete(memo.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={15} /></button>
                                    </div>
                                </div>
                            </div>

                            <div className="pr-4">
                                <p className="font-serif text-[#1d1d1f] text-[17px] leading-loose break-keep">"{memo.sentence}"</p>
                            </div>
                            
                            {memo.thought && (
                                <div className="mt-5 bg-gray-50/80 p-5 rounded-2xl border border-gray-100/50">
                                    <p className="text-[14px] text-gray-600 leading-relaxed font-medium">{memo.thought}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* [수정] 자체 플로팅 버튼 삭제됨 (부모가 관리함) */}

            {/* 수정용 다이얼로그 (유지) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px] bg-white rounded-[24px]">
                     <DialogTitle>기억 수정하기</DialogTitle>
                     {/* ... 폼 내용 ... (이전 코드와 동일, 생략 가능) */}
                     <div className="flex flex-col gap-4 mt-4">
                        <Input value={form.pageNumber} onChange={e=>setForm({...form, pageNumber:e.target.value})} placeholder="페이지" />
                        <Textarea value={form.sentence} onChange={e=>setForm({...form, sentence:e.target.value})} placeholder="문장" />
                        <Textarea value={form.thought} onChange={e=>setForm({...form, thought:e.target.value})} placeholder="생각" />
                        <Button onClick={handleUpdate} className="bg-black text-white">수정 완료</Button>
                     </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}