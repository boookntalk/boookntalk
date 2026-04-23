// 파일 경로: frontend/src/components/admin/ContributorImageManager.tsx
// 역할 및 기능: 기여자 사진을 로컬/외부 소스별로 관리하고 동기화하는 최고 관리자 전용 컴포넌트
// 작성일: 2026-04-21

'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Search, RefreshCw, Upload, Link, UserCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Contributor {
    id: number;
    name: string;
    profile_image: string | null;
    original_name?: string;
}

export default function ContributorImageManager({ userEmail }: { userEmail: string }) {
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);

    /**
     * 함수 기능: 기여자 검색 리스트를 호출합니다.
     */
    const fetchContributors = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/admin/contributors/search?q=${searchTerm}`);
            if (res.ok) setContributors(await res.json());
        } catch (error) {
            toast.error("데이터 로드 실패");
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 함수 기능: 외부 URL을 로컬 서버로 다운로드하여 영구 저장(Sync)합니다.
     */
    const handleSyncExternal = async (id: number, url: string) => {
        if (!url.startsWith('http')) return toast.error("올바른 URL이 아닙니다.");
        setProcessingId(id);
        
        const formData = new FormData();
        formData.append('external_url', url);
        formData.append('user_email', userEmail);

        try {
            const res = await fetch(`http://localhost:8000/api/admin/contributors/${id}/sync-external`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                toast.success("로컬 동기화 완료");
                fetchContributors();
            }
        } catch (error) {
            toast.error("동기화 중 오류 발생");
        } finally {
            setProcessingId(null);
        }
    };

    useEffect(() => { fetchContributors(); }, [searchTerm]);

    if (!userEmail.startsWith('boookntalk')) return null;

    return (
        <div className="w-full bg-white rounded-2xl border border-gray-100 p-[var(--spacing-1cm,32px)] shadow-sm mb-[var(--spacing-1cm,32px)]">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h3 className="text-[20px] font-extrabold text-[#1d1d1f] flex items-center gap-2">
                        <Camera size={22} className="text-[#0066cc]" /> 기여자 프로필 마스터
                    </h3>
                    <p className="text-[14px] text-gray-500 font-medium mt-1">로컬 저장소 우선 원칙에 따른 인물 사진 관리 시스템</p>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="이름 또는 원어명 검색..." 
                        className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-[14px] focus:ring-2 focus:ring-blue-100 outline-none"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contributors.map(person => {
                    const isLocal = person.profile_image?.startsWith('/static');
                    const isExternal = person.profile_image?.startsWith('http');

                    return (
                        <div key={person.id} className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl flex flex-col gap-4 group hover:bg-white hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                                    {person.profile_image ? (
                                        <img 
                                            src={isLocal ? `http://localhost:8000${person.profile_image}` : person.profile_image} 
                                            className="w-full h-full object-cover"
                                            alt={person.name}
                                        />
                                    ) : <UserCircle size={28} className="text-gray-300" />}
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-[15px] text-gray-800 truncate">{person.name}</span>
                                    {isLocal && (
                                        <span title="로컬 저장 완료" className="flex items-center">
                                            <CheckCircle2 size={14} className="text-green-500" />
                                        </span>
                                    )}
                                    {isExternal && (
                                        <span title="외부 링크 사용 중" className="flex items-center">
                                            <AlertCircle size={14} className="text-amber-500" />
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {isExternal ? (
                                    <button 
                                        onClick={() => handleSyncExternal(person.id, person.profile_image!)}
                                        className="flex-1 h-9 bg-[#0066cc] text-white text-[12px] font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors"
                                    >
                                        {processingId === person.id ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                        로컬로 동기화
                                    </button>
                                ) : (
                                    <label className="flex-1 h-9 bg-white border border-gray-200 text-gray-600 text-[12px] font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer hover:bg-gray-50 transition-colors">
                                        <Upload size={14} /> 직접 업로드
                                        <input type="file" className="hidden" />
                                    </label>
                                )}
                                <button className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                                    <Link size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}