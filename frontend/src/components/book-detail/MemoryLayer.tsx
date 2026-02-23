'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Quote, BookOpen, Trash2, Edit3, Globe, Lock, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

interface MemoryLayerProps {
    recordId: number;
    user: any;
}

export default function MemoryLayer({ recordId, user }: MemoryLayerProps) {
    const [memos, setMemos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // 모달 및 폼 상태 관리
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

    useEffect(() => { fetchMemos(); }, [recordId]);

    // 모달 열기 (신규 작성 or 기존 수정)
    const openModal = (memo?: any) => {
        if (memo) {
            setEditingId(memo.id);
            setForm({
                pageNumber: memo.page_number > 0 ? memo.page_number.toString() : '',
                sentence: memo.sentence,
                thought: memo.thought || '',
                isPublic: memo.is_public ?? true
            });
        } else {
            setEditingId(null);
            setForm({ pageNumber: '', sentence: '', thought: '', isPublic: true });
        }
        setIsModalOpen(true);
    };

    // 저장 (POST / PATCH 분기)
    const handleSubmit = async () => {
        if (!form.sentence.trim()) {
            toast.error("수집할 문장을 입력해 주세요.");
            return;
        }

        setIsLoading(true);
        const url = editingId 
            ? `http://localhost:8000/api/memos/${editingId}` 
            : `http://localhost:8000/api/records/${recordId}/memos`;
        const method = editingId ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page_number: parseInt(form.pageNumber) || 0,
                    sentence: form.sentence,
                    thought: form.thought,
                    is_public: form.isPublic
                })
            });

            if (res.ok) {
                toast.success(editingId ? "기억이 수정되었습니다." : "새로운 기억이 추가되었습니다.");
                setIsModalOpen(false);
                fetchMemos();
            } else {
                toast.error("저장에 실패했습니다.");
            }
        } catch (error) {
            toast.error("서버 연결 오류가 발생했습니다.");
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
        <div className="flex flex-col relative pb-20">
            
            {/* 1. 상단 타이틀 영역 */}
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-extrabold text-[#1d1d1f] flex items-center gap-2">
                    수집된 문장 <span className="text-[#0066cc] bg-blue-50 px-2.5 py-0.5 rounded-full text-sm">{memos.length}</span>
                </h3>
            </div>

            {/* 2. 타임라인 피드 뷰 */}
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
                            {/* 타임라인 노드 (동그라미) */}
                            <div className="absolute -left-[31px] top-8 w-[10px] h-[10px] bg-white border-2 border-gray-300 rounded-full group-hover:border-[#0066cc] transition-colors" />

                            <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                                <div className="flex items-center gap-2.5">
                                    {memo.author_image ? (
                                        <img src={memo.author_image} alt="profile" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold">
                                            {memo.author_name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-bold text-[#1d1d1f]">{memo.author_name}</span>
                                        <span className="text-[11px] text-gray-400 font-medium">{memo.created_at.split('T')[0]}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    {memo.is_public === false && (
                                        <span title="비공개 메모" className="flex items-center"><Lock size={14} className="text-gray-400" /></span>
                                    )}
                                    <span className="bg-gray-50 text-gray-500 text-xs font-bold px-3 py-1 rounded-full font-mono border border-gray-100">
                                        p. {memo.page_number > 0 ? memo.page_number : '-'}
                                    </span>
                                    
                                    {/* 수정/삭제 메뉴 (호버 시 등장) */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                        <button onClick={() => openModal(memo)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"><Edit3 size={15} /></button>
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

            {/* 3. FAB (플로팅 버튼) */}
            <button
                onClick={() => openModal()}
                className="fixed bottom-10 right-10 z-[60] bg-[#1d1d1f] text-white px-6 py-4 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center gap-2 hover:bg-black hover:-translate-y-1 hover:scale-105 transition-all group"
            >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                <span className="font-bold text-[15px]">새 기억 남기기</span>
            </button>

            {/* 4. 작성/수정 모달 (Dialog) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 border-0 overflow-hidden bg-white shadow-2xl rounded-[24px]">
                    <DialogTitle className="sr-only">메모 작성</DialogTitle>
                    
                    {/* 모달 헤더 */}
                    <div className="bg-gray-50/50 px-6 py-5 border-b border-gray-100 flex items-center gap-2">
                        <Quote size={18} className="text-[#0066cc]" />
                        <h2 className="text-[16px] font-extrabold text-[#1d1d1f]">
                            {editingId ? '기억 수정하기' : '새로운 기억의 조각'}
                        </h2>
                    </div>

                    {/* 모달 폼 */}
                    <div className="p-6 flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-bold text-gray-500 flex items-center gap-1.5"><BookOpen size={14}/> 페이지 번호 (선택)</label>
                            <Input 
                                type="number" 
                                placeholder="예: 120" 
                                value={form.pageNumber} 
                                onChange={(e) => setForm({...form, pageNumber: e.target.value})}
                                className="w-32 bg-gray-50 h-10 font-mono text-sm"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-bold text-[#1d1d1f]">발췌 문장 <span className="text-red-500">*</span></label>
                            <Textarea 
                                placeholder="기억하고 싶은 문장을 그대로 옮겨보세요." 
                                value={form.sentence}
                                onChange={(e) => setForm({...form, sentence: e.target.value})}
                                className="min-h-[120px] bg-gray-50 resize-none text-[15px] font-serif leading-relaxed focus:bg-white transition-colors p-4"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-bold text-[#1d1d1f]">나의 사색 (선택)</label>
                            <Textarea 
                                placeholder="이 문장이 나에게 어떤 의미로 다가왔나요?" 
                                value={form.thought}
                                onChange={(e) => setForm({...form, thought: e.target.value})}
                                className="min-h-[100px] bg-gray-50 resize-none text-[14px] leading-relaxed focus:bg-white transition-colors p-4"
                            />
                        </div>
                    </div>

                    {/* 모달 푸터 */}
                    <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
                        {/* 스위치형 공개 토글 */}
                        <div 
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setForm({...form, isPublic: !form.isPublic})}
                        >
                            <span className={`flex items-center gap-1 text-[12px] font-bold transition-colors ${form.isPublic ? 'text-[#0066cc]' : 'text-gray-400'}`}>
                                {form.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                                {form.isPublic ? '전체 공개' : '나만 보기'}
                            </span>
                            <button type="button" className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isPublic ? 'bg-[#0066cc]' : 'bg-gray-200'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${form.isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <Button 
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="bg-[#1d1d1f] hover:bg-[#333] text-white px-6 h-10 rounded-xl font-bold shadow-lg"
                        >
                            <Save size={16} className="mr-2" />
                            {isLoading ? "저장 중..." : "기록 완료"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}