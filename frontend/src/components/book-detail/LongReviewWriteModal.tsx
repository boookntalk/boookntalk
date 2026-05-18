// 파일 경로: src/components/book-detail/LongReviewWriteModal.tsx
// 역할 및 기능: 긴줄평 작성을 위한 팝업(Modal) 에디터입니다. 에디터 본문 작성 영역이 찌그러지지 않도록 최소 높이를 500px로 강제하여 시원한 작성 환경을 제공합니다.

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { Loader2, Globe, Lock, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";
import 'suneditor/dist/css/suneditor.min.css';

const SunEditor = dynamic(() => import('suneditor-react'), {
    ssr: false,
    loading: () => (
        <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded-2xl">
            <Loader2 className="animate-spin text-gray-400" />
        </div>
    ),
});

interface LongReviewWriteModalProps {
    isOpen: boolean;
    onClose: () => void;
    recordId?: number;
    user?: any;
    initialData?: { title: string; content: string; isPublic: boolean; isSpoiler: boolean } | null;
    onSuccess: () => void;
}

export default function LongReviewWriteModal({ isOpen, onClose, recordId, user, initialData, onSuccess }: LongReviewWriteModalProps) {
    const [isMounted, setIsMounted] = useState(false);
    
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); 
    const [isPublic, setIsPublic] = useState(false); 
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [realNickname, setRealNickname] = useState<string>('익명');
    
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || '');
                setContent(initialData.content || '');
                setIsPublic(initialData.isPublic);
                setIsSpoiler(initialData.isSpoiler);
            } else {
                setTitle('');
                setContent('');
                setIsPublic(false);
                setIsSpoiler(false);
            }

            const fetchProfile = async () => {
                if (!user?.email) return;
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/${user.email}/profile`);
                    if (res.ok) {
                        const data = await res.json();
                        setRealNickname(data.nickname || '익명');
                    }
                } catch (error) {
                    console.error("Profile fetch error", error);
                }
            };
            fetchProfile();

            setTimeout(() => {
                if (titleInputRef.current) titleInputRef.current.focus();
            }, 100);
        }
    }, [isOpen, initialData, user]);

    if (!isOpen || !isMounted) return null;

    const handleImageUploadBefore = (files: any[], info: object, uploadHandler: Function) => {
        const file = files[0];
        if (!file || !recordId) {
            uploadHandler();
            return false;
        }
        
        const formData = new FormData();
        formData.append('file', file);

        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/records/${recordId}/long-review/images`, {
            method: 'POST',
            body: formData,
        })
        .then(res => res.json())
        .then(data => {
            const response = { result: [ { url: data.url, name: file.name, size: file.size } ] };
            uploadHandler(response);
        })
        .catch(err => {
            toast.error('이미지 업로드에 실패했습니다.');
            uploadHandler();
        });

        return undefined;
    };

    const handleSave = async () => {
        if (!user || !recordId) return;
        setIsLoading(true);
        
        const isDraft = !isPublic; 

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/records/${recordId}/long-review`, {
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    long_review_title: title,
                    long_review_content: content,
                    is_long_review_draft: isDraft, 
                    is_spoiler: isSpoiler
                })
            });
            if (res.ok) {
                toast.success(isDraft ? '긴줄평이 비공개(임시저장) 되었습니다.' : '긴줄평이 광장에 발행되었습니다!');
                onSuccess();
            } else {
                toast.error('저장에 실패했습니다.');
            }
        } catch (error) {
            toast.error('서버와의 통신에 실패했습니다.');
        } finally { 
            setIsLoading(false); 
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[800px] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
                
                {/* 1. 헤더 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
                    <h2 className="text-[16px] font-bold text-[#1d1d1f]">
                        {initialData ? '긴줄평 수정' : '긴줄평 작성'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* 2. 에디터 본문 (스크롤 영역) */}
                <div className="px-6 py-6 md:px-8 md:py-8 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/30">
                    <input 
                        ref={titleInputRef}
                        type="text"
                        placeholder="사색의 제목을 적어주세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-[24px] md:text-[26px] font-black text-[#1d1d1f] placeholder-gray-300 outline-none border-none bg-transparent mb-6 shrink-0"
                    />
                    
                    {/* 💡 [영역 확대] 컨테이너가 찌그러지지 않도록 min-h-[500px]를 적용합니다. */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
                        <SunEditor 
                            setContents={content}
                            onChange={setContent}
                            onImageUploadBefore={handleImageUploadBefore}
                            setOptions={{
                                placeholder: `${realNickname}님의 생각을 자유롭게 기록해 보세요. (이미지 드래그 앤 드롭 가능)`,
                                buttonList: [
                                    ['bold', 'underline', 'italic', 'strike'],
                                    ['fontColor', 'hiliteColor'],
                                    ['formatBlock'], 
                                    ['align', 'list'],
                                    ['image', 'link'],
                                    ['undo', 'redo']
                                ],
                                // 💡 [영역 확대] 에디터 내부 높이를 500px로 강제 할당하여 무조건 넓은 영역을 확보합니다.
                                minHeight: "500px",
                                height: "500px",
                                resizingBar: false,
                                imageResizing: true,
                            }}
                        />
                    </div>
                </div>

                {/* 3. 하단 컨트롤 */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsPublic(!isPublic)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${isPublic ? 'bg-blue-50 text-[#0066cc] border border-blue-100' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}
                        >
                            {isPublic ? <Globe size={14} /> : <Lock size={14} />}
                            <span className="text-[12px] font-bold">{isPublic ? '전체 공개' : '나만 보기'}</span>
                        </button>

                        <div className={`flex items-center gap-1.5 transition-all ${!isPublic ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                            <Checkbox 
                                id="modal-spoiler-check" 
                                checked={isSpoiler} 
                                onCheckedChange={(checked) => setIsSpoiler(checked as boolean)}
                                className="w-4 h-4 rounded-sm border-rose-400 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                            />
                            <label htmlFor="modal-spoiler-check" className="text-[12px] font-bold text-rose-500 cursor-pointer flex items-center gap-1 select-none">
                                스포일러
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                            취소
                        </button>
                        <button 
                            disabled={isLoading} 
                            onClick={handleSave} 
                            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#1d1d1f] text-white text-[13px] font-bold hover:bg-black transition-all active:scale-95 disabled:opacity-50 min-w-[100px]"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : '발행하기'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}