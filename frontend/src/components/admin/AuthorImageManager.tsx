// 파일 경로: src/components/admin/AuthorImageManager.tsx
// 역할 및 기능: 프로필 사진이 누락된 작가 리스트를 조회하고, 관리자가 직접 사진을 업로드하여 즉시 반영할 수 있는 관리자 전용 UI 컴포넌트입니다.

'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Upload, UserCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 함수 기능: 프로필 사진이 누락된 작가 리스트를 조회하고 개별 업로드 UI를 렌더링합니다.
export default function AuthorImageManager({ userEmail }: { userEmail: string }) {
    const [authors, setAuthors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState<number | null>(null);

    // 함수 기능: 백엔드에서 사진이 없는 작가 목록을 가져와 상태를 업데이트합니다.
    const fetchMissingAuthors = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/authors/no-image`);
            if (res.ok) {
                setAuthors(await res.json());
            }
        } catch (error) {
            console.error("작가 로드 실패:", error);
            toast.error("작가 목록을 불러오지 못했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { 
        fetchMissingAuthors(); 
    }, []);

    // 함수 기능: 선택된 파일을 백엔드로 전송하여 작가의 프로필 이미지를 업데이트합니다.
    const handleUpload = async (contributorId: number, file: File) => {
        setIsUploading(contributorId);
        const formData = new FormData();
        formData.append('file', file);
        // JSON 바디 대신 폼 데이터로 이메일 전송 (보안 검증용)
        formData.append('user_email', userEmail); 

        try {
            const res = await fetch(`${API_URL}/api/admin/authors/${contributorId}/upload-image`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                toast.success('프로필 사진이 성공적으로 등록되었습니다.');
                fetchMissingAuthors(); // 업로드 성공 시 리스트 갱신 (해당 작가는 리스트에서 사라짐)
            } else {
                const errorData = await res.json();
                toast.error(errorData.detail || '업로드에 실패했습니다.');
            }
        } catch (error) {
            toast.error('서버 통신 에러가 발생했습니다.');
        } finally {
            setIsUploading(null);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col h-full max-h-[400px]">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3 shrink-0">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <Camera size={16} className="text-[#0066cc]" />
                    사진 누락 작가 관리 (총 {authors.length}명)
                </h3>
                <button 
                    onClick={fetchMissingAuthors} 
                    className="text-[11px] text-gray-400 hover:text-[#0066cc] font-bold"
                >
                    새로고침
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-2">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="animate-spin text-gray-300" size={24} />
                    </div>
                ) : authors.length > 0 ? (
                    authors.map((author) => (
                        <div key={author.id} className="flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-300 shadow-sm shrink-0">
                                    <UserCircle size={20} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <p className="font-bold text-[13px] text-gray-800 truncate">{author.name}</p>
                                    <p className="text-[11px] text-gray-400 truncate">ID: {author.id} {author.original_name ? `| ${author.original_name}` : ''}</p>
                                </div>
                            </div>
                            
                            <label className="cursor-pointer shrink-0 ml-2">
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleUpload(author.id, e.target.files[0])}
                                    disabled={isUploading === author.id}
                                />
                                <div className={`flex items-center justify-center w-8 h-8 rounded-md transition-all ${
                                    isUploading === author.id 
                                    ? 'bg-gray-200 text-gray-400' 
                                    : 'bg-white border border-gray-200 text-gray-500 hover:border-[#0066cc] hover:text-[#0066cc] shadow-sm'
                                }`}>
                                    {isUploading === author.id ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                                </div>
                            </label>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-2">
                        <Camera size={32} className="opacity-20" />
                        <span className="text-[12px] font-medium">모든 작가의 사진이 등록되어 있습니다! ✨</span>
                    </div>
                )}
            </div>
        </div>
    );
}