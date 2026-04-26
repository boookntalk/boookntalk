// 경로: frontend/src/components/common/AuthorAvatar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { PenTool, User, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AuthorAvatarProps {
    authorId?: number;     // 업로드 API를 호출하기 위한 작가 고유 ID
    src?: string | null;
    alt?: string;
    size?: number;
    fallbackType?: 'pen' | 'user';
    className?: string;
}

export function AuthorAvatar({ 
    authorId,
    src, 
    alt = "Author Profile", 
    size = 36, 
    fallbackType = 'pen',
    className = ""
}: AuthorAvatarProps) {
    const { data: session } = useSession();
    const [currentImage, setCurrentImage] = useState(src);
    const [hasError, setHasError] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 💡 [핵심 보안] 최고 관리자 여부 확인 (이메일이 boookntalk으로 시작하는 계정만 true)
    const isAdmin = session?.user?.email?.toLowerCase().startsWith('boookntalk');

    useEffect(() => {
        setCurrentImage(src);
        setHasError(false);
    }, [src]);

    const showFallback = !currentImage || hasError;

    // 💡 [제한] 클릭 이벤트: 관리자 & 작가 ID 존재 & 기본 이미지 상태일 때만 실행 허용
    const handleAvatarClick = () => {
        if (isAdmin && authorId && showFallback && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // 💡 [제한] 파일 업로드 로직 진입 시 관리자 권한 2차 검증
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !isAdmin || !authorId) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_email', session?.user?.email || '');

        try {
            const res = await fetch(`${API_URL}/api/admin/contributors/${authorId}/upload-image`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setCurrentImage(data.url);
                setHasError(false);
                toast.success("작가 사진이 성공적으로 등록되었습니다.");
            } else {
                toast.error("사진 업로드에 실패했습니다.");
            }
        } catch (error) {
            toast.error("서버 통신 중 오류가 발생했습니다.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div 
            // 💡 [제한] 관리자일 때만 hover 시 파란색 테두리 및 그림자(클릭 유도 UI) 활성화
            className={`shrink-0 flex items-center justify-center overflow-hidden bg-[#EEF2F7] border border-[#E7E2D9] rounded-full relative group/avatar ${className} ${isAdmin && authorId && showFallback ? 'cursor-pointer hover:border-[#0066cc]/50 hover:shadow-md transition-all' : ''}`}
            style={{ width: size, height: size }}
        >
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {/* 💡 [제한] 관리자가 아닌 일반 유저는 클릭해도 handleAvatarClick 내부 로직이 무시됨 */}
                        <div className="w-full h-full relative" onClick={handleAvatarClick}>
                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm z-10">
                                    <Loader2 className="animate-spin text-[#0066cc]" size={size * 0.5} />
                                </div>
                            )}

                            {!showFallback ? (
                                <img 
                                    src={currentImage?.startsWith('/') ? `${API_URL}${currentImage}` : currentImage!} 
                                    alt={alt} 
                                    className="w-full h-full object-cover" 
                                    onError={() => setHasError(true)}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 group-hover/avatar:bg-blue-50 transition-colors">
                                    {fallbackType === 'pen' ? (
                                        <PenTool size={size * 0.45} className={isAdmin && authorId ? 'group-hover/avatar:text-[#0066cc]/50 transition-colors' : ''} />
                                    ) : (
                                        <User size={size * 0.45} className={isAdmin && authorId ? 'group-hover/avatar:text-[#0066cc]/50 transition-colors' : ''} />
                                    )}
                                </div>
                            )}
                        </div>
                    </TooltipTrigger>
                    
                    {/* 💡 [제한] 관리자일 때만 "업로드 하시겠어요?" 툴팁 노출 */}
                    {isAdmin && authorId && showFallback && !isUploading && (
                        <TooltipContent side="top" className="bg-[#1d1d1f] text-white text-[12px] font-bold px-3 py-2 rounded-lg border-none shadow-md z-[100]">
                            <p className="flex items-center gap-1.5"><Camera size={14} /> 작가 사진을 업로드 하시겠어요?</p>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>

            {/* 💡 [제한] 관리자일 때만 숨겨진 파일 인풋창 DOM 렌더링 (보안 강화) */}
            {isAdmin && authorId && (
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    disabled={isUploading}
                />
            )}
        </div>
    );
}