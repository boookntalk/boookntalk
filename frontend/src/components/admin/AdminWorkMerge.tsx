// 파일 경로: frontend/src/components/admin/AdminWorkMerge.tsx
// 역할 및 기능: 관리자가 중복 파편화된 작품(Work)을 찾아 한 번의 클릭으로 병합하는 UI 컴포넌트입니다.

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

// 함수 기능: 중복 작품 목록을 불러오고 병합을 실행하는 관리자 패널 렌더링
export default function AdminWorkMerge() {
    const [duplicates, setDuplicates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchDuplicates = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/admin/duplicate-works');
            const data = await res.json();
            
            // 💡 [핵심 수정] 받아온 데이터가 진짜 배열(Array)일 때만 세팅하고, 아니면 빈 배열로 처리합니다!
            if (Array.isArray(data)) {
                setDuplicates(data);
            } else {
                console.error("배열이 아닌 데이터가 응답되었습니다:", data);
                setDuplicates([]); // 에러 시 빈 배열로 초기화하여 화면 깨짐 방지
            }
            
        } catch (error) {
            console.error("중복 데이터 스캔 실패", error);
            setDuplicates([]); // 네트워크 에러 시에도 빈 배열 처리
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDuplicates();
    }, []);

    const handleMerge = async (targetId: number, sourceIds: number[]) => {
        if (!window.confirm(`파편화된 작품들을 ${targetId}번 원본 작품으로 영구 병합하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

        try {
            const res = await fetch('http://localhost:8000/api/admin/merge-works', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_work_id: targetId,
                    source_work_ids: sourceIds
                })
            });

            if (res.ok) {
                alert("성공적으로 작품이 통합되었습니다!");
                fetchDuplicates(); // 스캔 목록 갱신
            } else {
                const error = await res.json();
                alert(`병합 실패: ${error.detail}`);
            }
        } catch (error) {
            alert("서버 연결에 실패했습니다.");
        }
    };

    return (
        <div className="p-[var(--spacing-1cm,32px)] bg-white rounded-2xl border border-gray-100 shadow-sm w-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-[20px] font-extrabold text-[#1d1d1f]">작품(Work) 데이터 대통합 스캐너</h2>
                    <p className="text-[14px] text-gray-500 font-medium mt-1">이름이 유사하여 파편화된 도서들을 하나의 작품으로 영구 병합합니다.</p>
                </div>
                <Button onClick={fetchDuplicates} disabled={loading} className="bg-[#1d1d1f] text-white font-bold h-10 px-5 rounded-xl hover:bg-black transition-colors">
                    {loading ? '스캔 진행 중...' : '중복 작품 스캔하기'}
                </Button>
            </div>

            <div className="flex flex-col gap-[var(--spacing-1cm,32px)]">
                {duplicates.map((group, index) => {
                    // 첫 번째 작품을 생존할 원본(Target)으로, 나머지를 흡수될(Source) 작품으로 자동 분류
                    const targetId = group.works[0].work_id;
                    const sourceIds = group.works.slice(1).map((w: any) => w.work_id);

                    return (
                        <div key={index} className="p-5 bg-[#F5F5F7] rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2 py-1 bg-red-100 text-red-600 text-[11px] font-extrabold rounded-md">중복 의심</span>
                                <h3 className="text-[16px] font-extrabold text-[#1d1d1f]">
                                    "{group.normalized_title}" 그룹 ({group.works.length}개로 파편화됨)
                                </h3>
                            </div>
                            
                            <div className="flex flex-col gap-2 mb-5">
                                {group.works.map((work: any, idx: number) => (
                                    <div key={work.work_id} className={`flex items-center justify-between p-3 rounded-xl border text-[14px] ${idx === 0 ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-100'}`}>
                                        <div className="flex items-center gap-3">
                                            {idx === 0 ? (
                                                <span className="text-[11px] font-bold text-[#0066cc] bg-white px-2 py-0.5 rounded-sm border border-blue-100">원본 지정</span>
                                            ) : (
                                                <span className="text-[11px] font-bold text-gray-400 px-2 py-0.5 border border-transparent">흡수 대상</span>
                                            )}
                                            <span className="font-mono font-bold text-[#1d1d1f] w-12">ID:{work.work_id}</span>
                                            <span className="font-bold text-gray-700">{work.title}</span>
                                            <span className="text-gray-500">- {work.author}</span>
                                        </div>
                                        <div className="text-[12px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md">
                                            연결된 판본: {work.edition_count}개
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex justify-end">
                                <Button 
                                    onClick={() => handleMerge(targetId, sourceIds)}
                                    className="bg-[#03C75A] hover:bg-[#02a048] text-white font-bold h-10 px-6 rounded-xl"
                                >
                                    {targetId}번 원본 작품으로 대통합 실행
                                </Button>
                            </div>
                        </div>
                    );
                })}
                
                {!loading && duplicates.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 bg-[#F5F5F7] rounded-xl border border-dashed border-gray-300">
                        <p className="text-[#1d1d1f] font-extrabold text-[16px]">중복 의심 작품이 없습니다.</p>
                        <p className="text-gray-500 font-medium text-[14px] mt-1">현재 BoooknTalk DB의 무결성이 완벽하게 유지되고 있습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}