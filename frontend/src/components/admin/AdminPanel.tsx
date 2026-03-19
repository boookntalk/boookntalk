'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { ShieldAlert, RefreshCw, Trash2, GitMerge, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminPanel() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    // 병합(Merge) 기능용 상태
    const [targetId, setTargetId] = useState('');
    const [sourceIds, setSourceIds] = useState('');

    // ▼▼▼ [핵심 방어벽] 오직 'boookntalk@gmail.com' 계정만 이 화면을 볼 수 있습니다! ▼▼▼
    if (session?.user?.email !== 'boookntalk@gmail.com') {
        return null; // 일반 유저에게는 흔적조차 보이지 않습니다.
    }

    // 1. 작가 데이터 정제 (다리미 엔진 가동)
    const handleSyncAuthors = async () => {
        if (!confirm("모든 작가 데이터를 재정제하시겠습니까? (시간이 다소 소요될 수 있습니다)")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/sync-authors`);
            const data = await res.json();
            if (res.ok) toast.success(data.message);
            else throw new Error(data.detail);
        } catch (error: any) {
            toast.error(error.message || "정제 작업 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // 2. 고아 데이터 대청소
    const handleCleanup = async () => {
        if (!confirm("연결되지 않은 찌꺼기 작가 데이터를 영구 삭제하시겠습니까?")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/cleanup-contributors`);
            const data = await res.json();
            if (res.ok) toast.success(data.message);
            else throw new Error(data.detail);
        } catch (error: any) {
            toast.error(error.message || "청소 작업 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // 3. 수동 강제 병합 (Merge)
    const handleMerge = async () => {
        if (!targetId || !sourceIds) {
            toast.error("진짜 작가 ID와 가짜 작가 ID를 모두 입력해주세요.");
            return;
        }
        if (!confirm(`${sourceIds}번 작가들을 ${targetId}번 작가로 강제 흡수하시겠습니까? (이 작업은 되돌릴 수 없습니다)`)) return;
        
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/merge-contributors?target_id=${targetId}&source_ids=${sourceIds}`);
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setTargetId('');
                setSourceIds('');
            } else {
                throw new Error(data.detail);
            }
        } catch (error: any) {
            toast.error(error.message || "병합 작업 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-8 bg-red-50/50 border border-red-100 rounded-2xl p-[var(--spacing-1cm,32px)]">
            <div className="flex items-center gap-2 text-red-600 mb-6 border-b border-red-100 pb-4">
                <ShieldAlert size={24} />
                <h2 className="text-lg font-black tracking-tight">System Admin Control (최고 관리자 전용)</h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* 왼쪽: 일괄 처리 버튼들 */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-gray-700">데이터베이스 일괄 정비</h3>
                    <Button 
                        onClick={handleSyncAuthors} 
                        disabled={isLoading}
                        variant="outline" 
                        className="justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        1단계: 작가 데이터 전면 재정제 (Sync)
                    </Button>
                    <Button 
                        onClick={handleCleanup} 
                        disabled={isLoading}
                        variant="outline" 
                        className="justify-start border-red-200 text-red-700 hover:bg-red-50"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        2단계: 찌꺼기 데이터 영구 삭제 (Cleanup)
                    </Button>
                </div>

                {/* 오른쪽: 수동 병합 컨트롤러 */}
                <div className="flex flex-col gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                        <GitMerge size={16} className="text-[#0066cc]" /> 
                        작가 강제 병합 (Manual Merge)
                    </h3>
                    
                    <div className="grid gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-500">진짜 작가 (Target ID)</label>
                            <Input 
                                placeholder="예: 58 (살려둘 번호)" 
                                value={targetId} 
                                onChange={(e) => setTargetId(e.target.value)}
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-500">가짜 작가들 (Source IDs)</label>
                            <Input 
                                placeholder="예: 59,60 (삭제할 콤마 구분 번호)" 
                                value={sourceIds} 
                                onChange={(e) => setSourceIds(e.target.value)}
                                className="h-9 text-sm"
                            />
                        </div>
                        <Button 
                            onClick={handleMerge} 
                            disabled={isLoading}
                            className="w-full mt-2 bg-[#1d1d1f] hover:bg-[#333] text-white"
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            강제 흡수 병합 실행
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}