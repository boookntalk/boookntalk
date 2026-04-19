// 파일 경로: frontend/src/components/admin/AdminPanel.tsx
// 역할 및 기능: BoooknTalk 최고 관리자 전용 제어 패널 (장르 복구, 표지 다운로드, 작가 정제, 마스터 클린업 등)

'use client';

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Download, Database, AlertTriangle } from 'lucide-react';

// 함수 기능: 관리자 전용 시스템 제어 UI를 렌더링하고, 각 버튼 클릭 시 백엔드 admin API를 호출합니다.
export default function AdminPanel() {
    const { data: session } = useSession();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const currentUserEmail = session?.user?.email?.toLowerCase().trim() || "";
    if (currentUserEmail !== 'boookntalk@gmail.com') return null;

    const handleAdminAction = async (actionUrl: string, confirmMsg: string, successMsg: string, method: string = 'GET') => {
        if (!window.confirm(confirmMsg)) return;

        setLoadingAction(actionUrl);
        try {
            const res = await fetch(`http://localhost:8000/api/admin/${actionUrl}`, { method });
            if (res.ok) {
                alert(successMsg);
            } else {
                const err = await res.json();
                alert(`오류 발생: ${err.detail || '알 수 없는 에러'}`);
            }
        } catch (error) {
            console.error(error);
            alert("서버 연결에 실패했습니다.");
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="p-[var(--spacing-1cm,32px)] bg-white rounded-2xl border border-gray-100 shadow-sm w-full mb-[var(--spacing-1cm,32px)]">
            <div className="mb-6">
                <h2 className="text-[20px] font-extrabold text-[#1d1d1f] flex items-center gap-2">
                    <Database className="text-[#0066cc]" size={20} /> 시스템 제어 패널
                </h2>
                <p className="text-[14px] text-gray-500 font-medium mt-1">
                    BoooknTalk 데이터베이스 무결성을 관리하는 마스터 도구입니다.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 border border-gray-100 rounded-xl bg-gray-50 flex flex-col justify-between">
                    <div className="mb-4">
                        <h3 className="text-[15px] font-bold text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                            <RefreshCw size={16} className="text-[#0066cc]" /> 장르 일괄 복구 (알라딘 API)
                        </h3>
                        <p className="text-[13px] text-gray-500 break-keep">
                            '기타'로 분류된 도서들을 스캔하여 알라딘 API를 통해 정확한 장르로 재분류합니다.
                        </p>
                    </div>
                    <Button 
                        disabled={loadingAction !== null}
                        onClick={() => handleAdminAction('sync-genres', '기타 장르 도서들을 스캔하여 복구하시겠습니까?', '장르 복구가 완료되었습니다.')}
                        variant="outline" className="w-full bg-white hover:bg-blue-50 hover:text-[#0066cc]"
                    >
                        {loadingAction === 'sync-genres' ? <Loader2 className="animate-spin" size={16} /> : '장르 복구 실행'}
                    </Button>
                </div>

                <div className="p-5 border border-gray-100 rounded-xl bg-gray-50 flex flex-col justify-between">
                    <div className="mb-4">
                        <h3 className="text-[15px] font-bold text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                            <Download size={16} className="text-emerald-600" /> 외부 표지 일괄 다운로드
                        </h3>
                        <p className="text-[13px] text-gray-500 break-keep">
                            외부 URL(http)을 사용 중인 표지를 찾아 로컬 서버로 일괄 다운로드합니다.
                        </p>
                    </div>
                    <Button 
                        disabled={loadingAction !== null}
                        onClick={() => handleAdminAction('sync-covers', '외부 표지 이미지를 로컬로 다운로드하시겠습니까?', '표지 다운로드 작업이 백그라운드에서 시작되었습니다.')}
                        variant="outline" className="w-full bg-white hover:bg-emerald-50 hover:text-emerald-600"
                    >
                        {loadingAction === 'sync-covers' ? <Loader2 className="animate-spin" size={16} /> : '다운로드 실행'}
                    </Button>
                </div>

                <div className="p-5 border border-gray-100 rounded-xl bg-gray-50 flex flex-col justify-between">
                    <div className="mb-4">
                        <h3 className="text-[15px] font-bold text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                            <RefreshCw size={16} className="text-amber-500" /> 작가 데이터 전면 정제
                        </h3>
                        <p className="text-[13px] text-gray-500 break-keep">
                            파싱 엔진을 다시 가동하여 작가 관계(WorkContributor)를 완벽하게 재정립합니다.
                        </p>
                    </div>
                    <Button 
                        disabled={loadingAction !== null}
                        onClick={() => handleAdminAction('sync-authors', '작가 파싱 엔진을 다시 실행하시겠습니까?', '작가 데이터 정제가 완료되었습니다.')}
                        variant="outline" className="w-full bg-white hover:bg-amber-50 hover:text-amber-600"
                    >
                        {loadingAction === 'sync-authors' ? <Loader2 className="animate-spin" size={16} /> : '정제 실행'}
                    </Button>
                </div>

                <div className="p-5 border border-red-100 rounded-xl bg-red-50/30 flex flex-col justify-between">
                    <div className="mb-4">
                        <h3 className="text-[15px] font-bold text-red-600 mb-1 flex items-center gap-1.5">
                            <AlertTriangle size={16} /> 마스터 클린업 (고아 데이터 청소)
                        </h3>
                        <p className="text-[13px] text-gray-500 break-keep">
                            연결되지 않은 찌꺼기 데이터를 영구 삭제하고 랭킹을 갱신합니다. (주의 요망)
                        </p>
                    </div>
                    <Button 
                        disabled={loadingAction !== null}
                        onClick={() => handleAdminAction('master-cleanup', '모든 찌꺼기 데이터를 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.', '마스터 클린업이 완벽하게 완료되었습니다.')}
                        variant="destructive" className="w-full"
                    >
                        {loadingAction === 'master-cleanup' ? <Loader2 className="animate-spin text-white" size={16} /> : '클린업 강제 실행'}
                    </Button>
                </div>
            </div>
        </div>
    );
}