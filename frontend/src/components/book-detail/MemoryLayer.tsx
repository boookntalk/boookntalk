'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Quote, Trash2, Edit3, Lock, Hash } from 'lucide-react'; // 아이콘 변경
import { toast } from 'sonner';

interface MemoryLayerProps {
    recordId: number;
    user: any;
    refreshTrigger?: number;
    // [추가] 데이터 로드 시 부모에게 개수 전달
    onDataLoaded?: (count: number) => void;
}

export default function MemoryLayer({ recordId, user, refreshTrigger, onDataLoaded }: MemoryLayerProps) {
    const [memos, setMemos] = useState<any[]>([]);
    
    // 수정 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ pageNumber: '', sentence: '', thought: '', isPublic: true });

    const fetchMemos = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/records/${recordId}/memos`);
            if (res.ok) {
                const data = await res.json();
                setMemos(data);
                // [핵심] 데이터 개수를 부모(BookDetailClient)에게 전달 -> 탭 라벨 업데이트
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

    // 로딩 중이거나 데이터가 없을 때 표시할 내용
    if (memos.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400 bg-white rounded-md border border-gray-200 border-dashed">
                <Quote size={32} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium text-[14px]">아직 기록된 문장이 없습니다.</p>
                <p className="text-[13px] mt-1">우측 하단의 펜 버튼을 눌러보세요.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 pb-20">
            {/* [Slim Layout] 
               - 상단 타이틀 제거됨
               - 타임라인(세로선) 제거됨
               - 단순히 카드가 쌓이는 형태 (Stack)
            */}
            
            {memos.map((memo) => (
                <div 
                    key={memo.id} 
                    // [Slim Card] rounded-md, border-gray-200, padding 축소
                    className="bg-white rounded-md p-6 border border-gray-200 hover:border-gray-400 transition-colors group shadow-sm hover:shadow-md"
                >
                    {/* Header: 메타 정보 (작성자, 날짜, 페이지, 아이콘) */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                            {/* 프로필 이미지 (작게) */}
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-bold border border-gray-200">
                                {memo.author_name?.charAt(0) || 'U'}
                            </div>
                            <span className="text-[12px] font-bold text-[#1d1d1f]">{memo.author_name}</span>
                            <span className="text-[11px] text-gray-400">·</span>
                            <span className="text-[11px] text-gray-400 font-medium">{memo.created_at?.split('T')[0]}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* 비공개 아이콘 */}
                            {!memo.is_public && <Lock size={12} className="text-gray-400" />}
                            
                            {/* 페이지 번호 (뱃지 형태) */}
                            {memo.page_number > 0 && (
                                <div className="flex items-center gap-1 bg-gray-50 text-gray-500 text-[11px] font-bold px-2 py-0.5 rounded-[3px] border border-gray-100">
                                    <Hash size={10} /> {memo.page_number}
                                </div>
                            )}

                            {/* 수정/삭제 메뉴 (호버 시 등장) */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                <button onClick={() => openEditModal(memo)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors"><Edit3 size={14} /></button>
                                <button onClick={() => handleDelete(memo.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>

                    {/* Content: 문장 (세리프 폰트 강조) */}
                    <div className="">
                        <p className="font-serif text-[#1d1d1f] text-[16px] leading-[1.8] break-keep selection:bg-[#dbeafe]">
                            {memo.sentence}
                        </p>
                    </div>
                    
                    {/* Footer: 생각 (있을 경우만 표시, 회색 박스 대신 텍스트로 깔끔하게) */}
                    {memo.thought && (
                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
                                <span className="text-[#0066cc] font-bold mr-1">생각.</span> 
                                {memo.thought}
                            </p>
                        </div>
                    )}
                </div>
            ))}

            {/* 수정용 모달 (기능 유지) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white rounded-[4px]">
                     <DialogTitle className="text-base font-bold">기억 수정하기</DialogTitle>
                     <div className="flex flex-col gap-4 mt-2">
                        <div className="flex gap-2 justify-end">
                            <Input 
                                type="number" 
                                value={form.pageNumber} 
                                onChange={e=>setForm({...form, pageNumber:e.target.value})} 
                                placeholder="Page" 
                                className="w-[80px] h-[32px] text-sm"
                            />
                        </div>
                        <Textarea 
                            value={form.sentence} 
                            onChange={e=>setForm({...form, sentence:e.target.value})} 
                            className="min-h-[100px] font-serif text-[15px] resize-none"
                            placeholder="문장 수정" 
                        />
                        <Textarea 
                            value={form.thought} 
                            onChange={e=>setForm({...form, thought:e.target.value})} 
                            className="min-h-[80px] text-[14px] resize-none"
                            placeholder="생각 수정" 
                        />
                        <div className="flex justify-end gap-2 mt-2">
                             <Button variant="outline" onClick={() => setIsModalOpen(false)}>취소</Button>
                             <Button onClick={handleUpdate} className="bg-[#1d1d1f] text-white">수정 완료</Button>
                        </div>
                     </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}