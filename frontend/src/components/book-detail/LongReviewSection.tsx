// 파일 경로: src/app/(main)/library/[id]/LongReviewSection.tsx
// 역할 및 기능: 도서 상세 페이지의 '긴줄평' 탭을 담당하며, 부모 레이아웃의 여백과 충돌하지 않도록 자체 마진을 제거하고 14px 표준을 적용했습니다.

'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { PenTool, Eye, Trash2, Loader2, Globe, Lock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";

import 'suneditor/dist/css/suneditor.min.css';

const SunEditor = dynamic(() => import('suneditor-react'), {
    ssr: false,
    loading: () => (
        <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-2xl">
            <Loader2 className="animate-spin text-gray-400" />
        </div>
    ),
});

export default function LongReviewSection({ recordId, user }: { recordId?: number | string; user?: any }) {
    const [realNickname, setRealNickname] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.email) {
                setRealNickname('익명');
                return;
            }
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/${user.email}/profile`);
                if (res.ok) {
                    const data = await res.json();
                    setRealNickname(data.nickname || '익명');
                } else {
                    setRealNickname('익명');
                }
            } catch (error) {
                setRealNickname('익명');
            }
        };
        fetchProfile();
    }, [user]);

    if (!realNickname) {
        // 💡 [영점 조절] 부모 레이아웃에서 여백을 관리하므로 mt-[var(--spacing-1cm,32px)] 제거
        return <div className="w-full h-[300px] bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse" />;
    }

    return <LongReviewEditor recordId={Number(recordId)} user={user} realNickname={realNickname} />;
}

function LongReviewEditor({ recordId, user, realNickname }: { recordId?: number; user?: any; realNickname: string }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); 
    
    const [originalTitle, setOriginalTitle] = useState('');
    const [originalContent, setOriginalContent] = useState('');

    const [isEditing, setIsEditing] = useState(false); 
    const [hasReview, setHasReview] = useState(false); 
    const [isLoading, setIsLoading] = useState(false);

    const [isPublic, setIsPublic] = useState(false); 
    const [isSpoiler, setIsSpoiler] = useState(false);

    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!recordId || isNaN(recordId)) return;
        
        const fetchLongReview = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/records/${recordId}/long-review`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.long_review_title || data.long_review_content) {
                        setTitle(data.long_review_title || '');
                        setContent(data.long_review_content || '');
                        setOriginalTitle(data.long_review_title || '');
                        setOriginalContent(data.long_review_content || '');
                        setIsPublic(!data.is_long_review_draft); 
                        setIsSpoiler(data.is_spoiler || false);
                        setHasReview(true);
                        setIsEditing(false);
                    } else {
                        setHasReview(false);
                        setIsEditing(false); 
                    }
                }
            } finally { setIsLoading(false); }
        };
        fetchLongReview();
    }, [recordId]);

    useEffect(() => {
        if (isEditing && titleInputRef.current) {
            titleInputRef.current.focus();
        }
    }, [isEditing]);

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
                setOriginalTitle(title);
                setOriginalContent(content);
                setHasReview(true);
                setIsEditing(false);
            } else {
                toast.error('저장에 실패했습니다.');
            }
        } catch (error) {
            toast.error('서버와의 통신에 실패했습니다.');
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleDelete = async () => {
        if (!confirm("정말 이 긴줄평을 삭제하시겠습니까? (복구할 수 없습니다)")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/records/${recordId}/long-review`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('긴줄평이 삭제되었습니다.');
                setTitle('');
                setContent('');
                setOriginalTitle('');
                setOriginalContent('');
                setHasReview(false);
                setIsPublic(false);
                setIsSpoiler(false);
                setIsEditing(true);
            } else {
                toast.error('삭제에 실패했습니다.');
            }
        } catch (error) {
            toast.error('서버 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setTitle(originalTitle);
        setContent(originalContent);
        setIsEditing(false);
    };

    return (
        // 💡 [영점 조절] 부모의 여백과 충돌하는 mt-[32px]를 제거하고 모서리를 rounded-2xl로 통일합니다.
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-20">
            
            {/* 1. 슬림 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-white min-h-[56px]">
                <div className="flex items-center gap-2">
                    <PenTool size={16} className="text-[#0066cc]" />
                    <span className="text-[14px] font-bold text-[#1d1d1f]">나의 긴줄평</span>
                </div>
                
                <div className="flex items-center gap-4">
                    {isEditing ? (
                        <>
                            <div className="flex items-center gap-4 border-r border-gray-100 pr-4">
                                <div className={`flex items-center gap-1.5 transition-all duration-300 ${!isPublic ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                                    <Checkbox 
                                        id="long-spoiler-check" 
                                        checked={isSpoiler} 
                                        onCheckedChange={(checked) => setIsSpoiler(checked as boolean)}
                                        className="w-4 h-4 rounded-sm border-rose-400 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500 data-[state=checked]:text-white"
                                    />
                                    <label htmlFor="long-spoiler-check" className="text-[12px] font-bold text-rose-500 cursor-pointer flex items-center gap-1 select-none">
                                        <AlertTriangle size={12} /> 스포일러
                                    </label>
                                </div>

                                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsPublic(!isPublic)}>
                                    <span className={`flex items-center gap-1 text-[12px] font-bold transition-colors ${isPublic ? 'text-[#0066cc]' : 'text-gray-400'}`}>
                                        {isPublic ? <Globe size={13} /> : <Lock size={13} />}
                                        {isPublic ? '공개' : '비공개'}
                                    </span>
                                    <button type="button" className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isPublic ? 'bg-[#0066cc]' : 'bg-gray-200'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                {hasReview && (
                                    <>
                                        <button onClick={handleCancel} className="px-3 py-1.5 text-[13px] font-bold text-gray-400 hover:text-gray-600 transition-colors">
                                            취소
                                        </button>
                                        <button onClick={handleDelete} title="삭제" className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                                <button disabled={isLoading} onClick={handleSave} className="px-4 py-2 rounded-xl bg-[#1d1d1f] text-white text-[13px] font-bold hover:bg-black shadow-md transition-transform active:scale-95 disabled:opacity-50">
                                    {isLoading ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}
                                    저장하기
                                </button>
                            </div>
                        </>
                    ) : (
                        hasReview && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 mr-2">
                                    {isSpoiler && isPublic && <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 flex items-center gap-1"><AlertTriangle size={11}/> 스포일러</span>}
                                    <span className={`text-[11px] font-bold px-2 py-1 rounded-md border flex items-center gap-1 ${isPublic ? 'text-[#0066cc] bg-blue-50 border-blue-100' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                                        {isPublic ? <><Globe size={11}/> 공개됨</> : <><Lock size={11}/> 비공개</>}
                                    </span>
                                </div>

                                <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                    <Eye size={14} /> 수정하기
                                </button>
                                <button onClick={handleDelete} title="삭제" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* 2. 본문 영역 */}
            <div className="px-6 md:px-10 py-8 min-h-[500px]">
                {isEditing ? (
                    <div className="suneditor-container">
                        <input 
                            ref={titleInputRef}
                            type="text"
                            placeholder="제목을 입력하세요"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    document.querySelector<HTMLElement>('.sun-editor-editable')?.focus();
                                }
                            }}
                            className="w-full text-[24px] font-black text-[#1d1d1f] placeholder-gray-300 outline-none border-none bg-transparent mb-6"
                        />
                        <SunEditor 
                            setContents={content}
                            onChange={setContent}
                            onImageUploadBefore={handleImageUploadBefore}
                            setOptions={{
                                placeholder: `${realNickname}님의 생각을 보여주세요. (이미지를 드래그 앤 드롭하여 삽입할 수 있습니다)`,
                                buttonList: [
                                    ['bold', 'underline', 'italic', 'strike'],
                                    ['fontColor', 'hiliteColor'],
                                    ['formatBlock'], 
                                    ['align', 'list'],
                                    ['image', 'link'],
                                    ['undo', 'redo']
                                ],
                                minHeight: "400px",
                                resizingBar: false,
                                imageResizing: true,
                            }}
                        />
                    </div>
                ) : (
                    hasReview ? (
                        <div className="animate-in fade-in duration-500">
                            <h1 className="text-[24px] md:text-[28px] font-black text-[#1d1d1f] mb-8 leading-tight">{title || "제목 없는 긴줄평"}</h1>
                            {/* 💡 기획자님 표준: 본문 폰트 14px 적용 및 줄간격 확보 */}
                            <div 
                                className="sun-editor-editable max-w-none text-[14px] text-[#1d1d1f] leading-loose break-keep p-0 border-none"
                                dangerouslySetInnerHTML={{ __html: content }}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-500">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                                <PenTool size={28} className="text-gray-300" />
                            </div>
                            <h3 className="text-[16px] font-bold text-[#1d1d1f] mb-2">아직 기록된 사색이 없습니다</h3>
                            {/* 💡 14px 표준 적용 */}
                            <p className="text-[14px] text-gray-500 mb-8 max-w-sm leading-relaxed">
                                책을 읽으며 머문 깊은 사색의 조각들을 엮어 <br/>한 편의 멋진 긴줄평을 완성해 보세요.
                            </p>
                            <button 
                                onClick={() => setIsEditing(true)} 
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1d1d1f] text-white text-[14px] font-bold hover:bg-black shadow-lg shadow-black/10 transition-transform active:scale-95"
                            >
                                <PenTool size={16} /> 첫 긴줄평 작성하기
                            </button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}