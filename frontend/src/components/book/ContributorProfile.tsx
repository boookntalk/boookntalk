// 경로: frontend/src/components/book/ContributorProfile.tsx
// 역할: 도서 상세페이지의 "AUTHOR" 영역에서 기여자 프로필 노출 및 관리자 전용 즉시 업로드 기능

'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserCircle, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ContributorProps {
    id: number;
    name: string;
    role: string; // 저자, 옮긴이 등
    profileImage: string | null;
    original_name?: string;
    description?: string;
    representative_works?: string[]; // 대표작 목록 (향후 기능 확장용)
}

export default function ContributorProfile({ id, name, role, profileImage, original_name, description, representative_works }: ContributorProps) {
    const { data: session } = useSession();
    const [currentImage, setCurrentImage] = useState(profileImage);
    const [isUploading, setIsUploading] = useState(false);

    // 최고 관리자(`boookntalk`) 여부 확인
    const isAdmin = session?.user?.email?.toLowerCase().startsWith('boookntalk');

    // 함수 기능: 파일 선택 시 백엔드 전용 업로드 API를 호출하여 즉시 반영합니다.
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
                setCurrentImage(data.url); // 업로드된 로컬 경로로 즉시 교체 (Optimistic UI)
                toast.success(`${name}님의 프로필 사진이 등록되었습니다.`);
            } else {
                toast.error("사진 업로드에 실패했습니다.");
            }
        } catch (error) {
            toast.error("서버 통신 중 오류가 발생했습니다.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-md">
            {/* 1. 프로필 사진 영역 (동그란 형태, 관리자 업로드 기능 포함) */}
            <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="relative w-28 h-28 rounded-full overflow-hidden border border-gray-100 bg-white shadow-sm transition-all hover:border-[#0066cc]/30">
                    {currentImage ? (
                        <img 
                            src={currentImage.startsWith('/') ? `${API_URL}${currentImage}` : currentImage} 
                            alt={name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <UserCircle size={56} />
                        </div>
                    )}

                    {/* 최고 관리자 전용 업로드 오버레이 (마우스 호버 시 노출) */}
                    {isAdmin && (
                        <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            {isUploading ? (
                                <Loader2 className="animate-spin text-white" size={24} />
                            ) : (
                                <>
                                    <Camera className="text-white mb-1.5" size={20} />
                                    <span className="text-[11px] text-white font-bold text-center leading-tight">
                                        프로필<br/>사진 등록
                                    </span>
                                </>
                            )}
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                        </label>
                    )}
                </div>
            </div>

            {/* 2. 기여자 상세 정보 영역 */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[12px] font-bold text-[#0066cc] bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">{role}</span>
                    {currentImage && currentImage.startsWith('/') && (
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

                {/* 대표작 영역 (기획자님 이미지의 "대표작" 부분과 동일하게 적용) */}
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