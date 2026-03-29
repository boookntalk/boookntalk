// 파일 경로: src/components/admin/AdminPanel.tsx
// 역할 및 기능: 최고 관리자(ADMIN) 권한을 가진 유저에게만 노출되며, DB 일괄 정비 및 AI 엔진 재학습 등을 제어하는 시스템 관리 패널입니다.

'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { ShieldAlert, RefreshCw, Trash2, GitMerge, Wand2, Sparkles, Bot } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminPanel() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    // 병합(Merge) 기능용 상태
    const [targetId, setTargetId] = useState('');
    const [sourceIds, setSourceIds] = useState('');

    // ==========================================
    // 💡 [핵심 방어벽 교체] 하드코딩 이메일 제거 -> DB role 기반 체크!
    // ==========================================
    if (session?.user?.role !== 'ADMIN') {
        return null; // ADMIN이 아니면 화면에 아예 그리지 않습니다.
    }

    // 공통 도트 로딩 애니메이션 컴포넌트
    const DotLoader = () => (
        <div className="flex items-center justify-center gap-1.5 w-full">
            <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
    );

    // [기존 1] 장르 데이터 일괄 세탁
    const handleSyncGenres = async () => {
        if (!confirm("과거 도서의 장르 데이터를 북앤톡 8대 표준 장르로 일괄 세탁하시겠습니까?")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/sync-genres`);
            const data = await res.json();
            if (res.ok) toast.success(data.message);
            else throw new Error(data.detail);
        } catch (error: any) {
            toast.error(error.message || "장르 세탁 작업 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // [기존 2] 작가 데이터 전면 재정제
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

    // [기존 3] 꼬리표 클렌징 및 파편화 병합
    const handleDeepCleanse = async () => {
        if (!confirm("오염된 꼬리표를 제거하고 파편화된 작가를 병합하시겠습니까?")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/cleanse-authors`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) toast.success(`수술 완료! ${data.message}`);
            else throw new Error(data.message);
        } catch (error: any) {
            toast.error(error.message || "딥 클렌징 작업 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // [기존 4] 고아 데이터 대청소
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

    // [기존 5] 수동 강제 병합
    const handleMerge = async () => {
        if (!targetId || !sourceIds) {
            toast.error("진짜 작가 ID와 가짜 작가 ID를 모두 입력해주세요.");
            return;
        }
        if (!confirm(`${sourceIds}번 작가들을 ${targetId}번 작가로 강제 흡수하시겠습니까?`)) return;
        
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/merge-contributors?target_id=${targetId}&source_ids=${sourceIds}`);
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setTargetId('');
                setSourceIds('');
            } else throw new Error(data.detail);
        } catch (error: any) {
            toast.error(error.message || "병합 작업 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // ▼▼▼ [NEW 6] BoooknTalk AI 재학습 엔진 ▼▼▼
    // ==========================================
    const handleRetrainAI = async () => {
        if (!confirm("누적된 오답 노트를 바탕으로 AI 장르 분류 모델을 새롭게 재학습하시겠습니까?")) return;
        setIsLoading(true);
        try {
            const userEmail = session?.user?.email || '';
            const res = await fetch(`${API_URL}/api/admin/retrain-ai?user_email=${encodeURIComponent(userEmail)}`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) toast.success(data.message || "🎉 AI의 새로운 학습이 완벽하게 완료되었습니다!");
            else throw new Error(data.detail || "학습 실패");
        } catch (error: any) {
            toast.error(error.message || "AI 재학습 작업 중 오류가 발생했습니다.");
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
                    
                    <Button onClick={handleSyncGenres} disabled={isLoading} variant="outline" className={`border-purple-200 text-purple-700 hover:bg-purple-50 transition-all ${isLoading ? 'justify-center' : 'justify-start'}`}>
                        {isLoading ? <DotLoader /> : <><Wand2 className="mr-2 h-4 w-4" /> 장르 데이터 일괄 세탁 (Sync Genres)</>}
                    </Button>

                    <Button onClick={handleSyncAuthors} disabled={isLoading} variant="outline" className={`border-blue-200 text-blue-700 hover:bg-blue-50 transition-all ${isLoading ? 'justify-center' : 'justify-start'}`}>
                        {isLoading ? <DotLoader /> : <><RefreshCw className="mr-2 h-4 w-4" /> 작가 데이터 전면 재정제 (Sync Authors)</>}
                    </Button>

                    <Button onClick={handleDeepCleanse} disabled={isLoading} variant="outline" style={{ justifyContent: isLoading ? 'center' : 'flex-start' }} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-all w-full">
                        {isLoading ? <DotLoader /> : <><Sparkles className="mr-2 h-4 w-4" /> 오염 데이터 딥 클렌징 (Cleanse & Merge)</>}
                    </Button>

                    <Button onClick={handleCleanup} disabled={isLoading} variant="outline" className={`border-red-200 text-red-700 hover:bg-red-50 transition-all ${isLoading ? 'justify-center' : 'justify-start'}`}>
                        {isLoading ? <DotLoader /> : <><Trash2 className="mr-2 h-4 w-4" /> 찌꺼기 데이터 영구 삭제 (Cleanup)</>}
                    </Button>

                    {/* 💡 [NEW] AI 재학습 버튼 추가 (눈에 띄는 Violet 톤 적용) */}
                    <Button onClick={handleRetrainAI} disabled={isLoading} variant="outline" className={`border-violet-300 text-violet-700 bg-violet-50 hover:bg-violet-100 hover:border-violet-400 transition-all shadow-sm ${isLoading ? 'justify-center' : 'justify-start'}`}>
                        {isLoading ? <DotLoader /> : <><Bot className="mr-2 h-4 w-4" /> AI 장르 분류 엔진 재학습 (Retrain AI)</>}
                    </Button>
                </div>

                {/* 오른쪽: 수동 병합 컨트롤러 (기존 유지) */}
                <div className="flex flex-col gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                        <GitMerge size={16} className="text-[#0066cc]" /> 
                        작가 강제 병합 (Manual Merge)
                    </h3>
                    
                    <div className="grid gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-500">진짜 작가 (Target ID)</label>
                            <Input placeholder="예: 58 (살려둘 번호)" value={targetId} onChange={(e) => setTargetId(e.target.value)} className="h-9 text-sm" disabled={isLoading} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-500">가짜 작가들 (Source IDs)</label>
                            <Input placeholder="예: 59,60 (삭제할 콤마 구분 번호)" value={sourceIds} onChange={(e) => setSourceIds(e.target.value)} className="h-9 text-sm" disabled={isLoading} />
                        </div>
                        <Button onClick={handleMerge} disabled={isLoading} className={`w-full mt-2 bg-[#1d1d1f] hover:bg-[#333] text-white transition-all ${isLoading ? 'justify-center' : 'justify-center'}`}>
                            {isLoading ? <DotLoader /> : "강제 흡수 병합 실행"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}