'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, BookCopy, Calendar, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';

interface EditionSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    workId: string | number;
    workTitle: string;
    userEmail: string;
}

export default function EditionSelectModal({ isOpen, onClose, workId, workTitle, userEmail }: EditionSelectModalProps) {
    const [editions, setEditions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen || !workId) return;

        const fetchEditions = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/works/${workId}/editions`);
                if (res.ok) {
                    const data = await res.json();
                    setEditions(data);
                }
            } catch (error) {
                console.error("판본 로딩 실패:", error);
                toast.error("판본 정보를 불러오지 못했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEditions();
    }, [isOpen, workId]);

    // 판본 선택 시 내 서재(WISH 상태)로 담기
    const handleSelectEdition = async (editionId: number) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`http://localhost:8000/api/library/wishlist/quick`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ user_email: userEmail, edition_id: editionId })
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                toast.success(`'${workTitle}' 내 서재에 담겼습니다!`);
                onClose();
            } else if (data.status === 'exists') {
                toast.info(data.message);
            }
        } catch (error) {
            toast.error("오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[24px] border-none shadow-2xl bg-[#F5F5F7]">
                <DialogHeader className="px-6 pt-6 pb-4 bg-white border-b border-gray-100 sticky top-0 z-10">
                    <DialogTitle className="text-[18px] font-black text-[#1d1d1f]">
                        내 서재에 담을 판본 선택
                    </DialogTitle>
                    <p className="text-[13px] text-gray-500 mt-1">
                        어떤 출판사의 <span className="font-bold text-[#0066cc]">'{workTitle}'</span>을(를) 읽으셨나요?
                    </p>
                </DialogHeader>

                <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
                    {isLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#0066cc]" size={32} /></div>
                    ) : editions.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-[14px]">등록된 판본이 없습니다.</div>
                    ) : (
                        <div className="space-y-3">
                            {editions.map((ed) => (
                                <div 
                                    key={ed.edition_id}
                                    onClick={() => !isSubmitting && handleSelectEdition(ed.edition_id)}
                                    className={`flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-all duration-200 cursor-pointer ${isSubmitting ? 'opacity-50 pointer-events-none' : 'hover:border-[#0066cc] hover:shadow-md active:scale-[0.98]'}`}
                                >
                                    <div className="relative w-12 h-16 bg-gray-50 rounded shadow-sm overflow-hidden flex-shrink-0 border border-gray-100">
                                        {ed.cover_image ? (
                                            <Image src={ed.cover_image} alt="cover" fill className="object-cover" />
                                        ) : (
                                            <BookCopy size={20} className="m-auto mt-5 text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[14px] font-bold text-[#1d1d1f] truncate mb-1">
                                            {ed.publisher || '출판사 미상'}
                                        </h4>
                                        <div className="flex items-center gap-3 text-[12px] text-gray-400">
                                            {ed.publish_date && (
                                                <span className="flex items-center gap-1"><Calendar size={12} /> {ed.publish_date.substring(0, 10)}</span>
                                            )}
                                            {ed.page_count > 0 && <span>{ed.page_count}쪽</span>}
                                        </div>
                                    </div>
                                    <CheckCircle2 size={20} className="text-gray-200 flex-shrink-0 group-hover:text-[#0066cc]" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}