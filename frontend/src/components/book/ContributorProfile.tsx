// 경로: frontend/src/components/book/ContributorProfile.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { UserCircle, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
// 💡 툴팁 컴포넌트 임포트 추가
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ContributorProps {
    id: number;
    name: string;
    role: string; // 저자, 옮긴이 등
    profileImage: string | null;
    original_name?: string;
    description?: string;
    representative_works?: string[];
}

export default function ContributorProfile({ id, name, role, profileImage, original_name, description, representative_works }: ContributorProps) {
    const { data: session } = useSession();
    const [currentImage, setCurrentImage] = useState(profileImage);
    const [isUploading, setIsUploading] = useState(false);
    
    // 💡 이미지 에러 상태 및 파일 입력창 참조(ref) 추가
    const [hasError, setHasError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAdmin = session?.user?.email?.toLowerCase().startsWith('boookntalk');

    // 외부에서 프로필 이미지가 변경되면 에러 상태 초기화
    useEffect(() => {
        setCurrentImage(profileImage);
        setHasError(false);
    }, [profileImage]);

    // 파일 선택 시 백엔드 업로드 API 호출
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !isAdmin) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_email', session?.user?.email || '');

        try {
            const res = await fetch(`${API_URL}/api/admin/contributors/${id}/upload-image`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setCurrentImage(data.url);
                setHasError(false); // 💡 새 이미지 업로드 성공 시 에러 해제
                toast.success(`${name}님의 프로필 사진이 등록되었습니다.`);
            } else {
                toast.error("사진 업로드에 실패했습니다.");
            }
        } catch (error) {
            toast.error("서버 통신 중 오류가 발생했습니다.");
        } finally {
            setIsUploading(false);
            // input value 초기화 (같은 파일 다시 선택 가능하도록)
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // 이미지가 없거나 로딩 중 에러(엑스박스)가 났다면 기본 아이콘 표시
    const showFallback = !currentImage || hasError;

    return (
        <div className="flex flex-col md:flex-row gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-md">
            
            {/* 1. 프로필 사진 영역 */}
            <div className="flex flex-col items-center gap-3 shrink-0">
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div 
                                className={`relative w-28 h-28 rounded-full overflow-hidden border border-gray-100 bg-white shadow-sm transition-all group/avatar ${isAdmin ? 'cursor-pointer hover:border-[#0066cc]/50 hover:shadow-md' : ''}`}
                                // 💡 툴팁 트리거 자체에 클릭 이벤트를 달아 숨겨진 fileInput을 실행시킵니다.
                                onClick={() => {
                                    if (isAdmin && fileInputRef.current) {
                                        fileInputRef.current.click();
                                    }
                                }}
                            >
                                {!showFallback ? (
                                    <img 
                                        src={currentImage.startsWith('/') ? `${API_URL}${currentImage}` : currentImage} 
                                        alt={name}
                                        className="w-full h-full object-cover"
                                        onError={() => setHasError(true)} // 💡 에러 발생 시 즉각 폴백 렌더링
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300 group-hover/avatar:bg-blue-50 transition-colors">
                                        {isUploading ? (
                                            <Loader2 className="animate-spin text-[#0066cc]" size={28} />
                                        ) : (
                                            <>
                                                <UserCircle size={48} className={`mb-1 ${isAdmin ? 'group-hover/avatar:text-[#0066cc]/50 transition-colors' : ''}`} />
                                                {isAdmin && <span className="text-[10px] font-bold text-gray-400 group-hover/avatar:text-[#0066cc]/70">업로드</span>}
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* 이미지가 있을 때 노출되는 기존 오버레이 (사진 교체용) */}
                                {isAdmin && !showFallback && (
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        {isUploading ? (
                                            <Loader2 className="animate-spin text-white" size={24} />
                                        ) : (
                                            <>
                                                <Camera className="text-white mb-1.5" size={20} />
                                                <span className="text-[11px] text-white font-bold text-center leading-tight">
                                                    사진 변경
                                                </span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TooltipTrigger>
                        
                        {/* 💡 기본 이미지(에러 포함)일 때 툴팁 노출 */}
                        {showFallback && isAdmin && (
                            <TooltipContent side="top" className="bg-[#1d1d1f] text-white text-[12px] font-bold px-3 py-2 rounded-lg border-none shadow-md z-[100]">
                                <p className="flex items-center gap-1.5">클릭하여 사진을 업로드 할 수 있습니다.</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>

                {/* 숨겨진 파일 인풋 */}
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    disabled={isUploading}
                />
            </div>

            {/* 2. 기여자 상세 텍스트 영역 */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[12px] font-bold text-[#0066cc] bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">{role}</span>
                    {currentImage && currentImage.startsWith('/') && !hasError && (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                            <CheckCircle2 size={12} /> 로컬 저장 완료
                        </span>
                    )}
                </div>
                
                <h3 className="font-extrabold text-[18px] text-[#1d1d1f] flex items-center gap-1.5 mb-2 truncate">
                    {name} {original_name && <span className="font-normal text-[14px] text-gray-500">({original_name})</span>}
                </h3>
                
                <p className="text-[13px] text-gray-600 font-medium leading-relaxed mb-4 line-clamp-3">
                    {description || "아직 등록된 기여자 소개가 없습니다."}
                </p>

                {representative_works && representative_works.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-[12px] font-bold text-gray-500 mb-2">대표작</p>
                        <div className="flex items-center gap-2 truncate text-[13px] text-gray-700 font-medium">
                           {representative_works.map((work, index) => (
                               <span key={index} className="px-3 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                                   {work}
                               </span>
                           ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}