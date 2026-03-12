'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Container from '@/components/layout/Container';
import Footer from '@/components/layout/Footer';
import { Loader2, Star, Users, ChevronLeft, BookCopy, Plus, MessageSquare, PenTool } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkHubPage() {
    const params = useParams();
    const router = useRouter();
    const workId = params.id as string;

    const [work, setWork] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('short_reviews'); // 하단 통합 리뷰 탭

    useEffect(() => {
        if (!workId) return;

        const fetchWorkDetail = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/works/${workId}`);
                if (res.ok) {
                    const data = await res.json();
                    setWork(data);
                } else {
                    toast.error("작품 정보를 불러올 수 없습니다.");
                    router.back();
                }
            } catch (error) {
                console.error("작품 조회 에러:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkDetail();
    }, [workId, router]);

    if (isLoading) {
        return (
            <div className="w-full h-[calc(100vh-64px)] bg-[#F5F5F7] flex justify-center items-center">
                <Loader2 className="animate-spin text-[#0066cc]" size={40} />
            </div>
        );
    }

    if (!work) return null;

    return (
        <div className="w-full h-full overflow-y-auto scrollbar-hide bg-[#F5F5F7] flex flex-col">
            <Container className="pt-[var(--spacing-1cm,32px)] pb-20">
                
                {/* 1. 뒤로 가기 및 상단 네비게이션 */}
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-[13px] font-bold text-gray-400 hover:text-[#1d1d1f] transition-colors mb-6"
                >
                    <ChevronLeft size={16} /> 광장으로 돌아가기
                </button>

                {/* 2. 작품 마스터 영역 (상단) */}
                <div className="bg-white rounded-lg p-[var(--spacing-1cm,32px)] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-10 mb-8 relative overflow-hidden">
                    
                    {/* 좌측: 대표 표지 */}
                    <div className="w-40 md:w-56 shrink-0 relative aspect-[1/1.4] rounded shadow-md border border-gray-100 bg-gray-50 flex items-center justify-center z-10">
                        {work.best_cover ? (
                            <Image src={work.best_cover} alt={work.title} fill className="object-cover" priority />
                        ) : (
                            <span className="text-gray-400 font-bold text-sm">No Cover</span>
                        )}
                    </div>

                    {/* 우측: 통합 정보 및 통계 */}
                    <div className="flex flex-col flex-1 z-10 pt-2">
                        {work.category && <span className="text-[12px] font-bold text-[#0066cc] mb-2">{work.category}</span>}
                        <h1 className="text-[28px] md:text-[36px] font-black text-[#1d1d1f] leading-tight tracking-tight mb-2">
                            {work.title}
                        </h1>
                        <p className="text-[16px] text-gray-500 font-medium mb-6">{work.author}</p>
                        
                        {/* 통합 통계 뱃지 */}
                        <div className="inline-flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex flex-col">
                                <span className="text-[11px] text-gray-400 font-bold mb-1">통합 평점</span>
                                <div className="flex items-center gap-1.5 text-amber-400">
                                    <Star size={18} fill="currentColor" />
                                    <span className="text-[18px] font-black text-[#1d1d1f]">{work.average_rating}</span>
                                </div>
                            </div>
                            <div className="w-[1px] h-10 bg-gray-200"></div>
                            <div className="flex flex-col">
                                <span className="text-[11px] text-gray-400 font-bold mb-1">담은 사람</span>
                                <div className="flex items-center gap-1.5 text-emerald-500">
                                    <Users size={18} />
                                    <span className="text-[18px] font-black text-[#1d1d1f]">{work.total_added}<span className="text-[13px] font-medium text-gray-500 ml-1">명</span></span>
                                </div>
                            </div>
                            <div className="w-[1px] h-10 bg-gray-200"></div>
                            <div className="flex flex-col">
                                <span className="text-[11px] text-gray-400 font-bold mb-1">등록된 판본</span>
                                <div className="flex items-center gap-1.5 text-[#0066cc]">
                                    <BookCopy size={18} />
                                    <span className="text-[18px] font-black text-[#1d1d1f]">{work.edition_count}<span className="text-[13px] font-medium text-gray-500 ml-1">개</span></span>
                                </div>
                            </div>
                        </div>

                        {/* 책 소개글 */}
                        <div className="text-[14px] text-gray-600 leading-relaxed break-keep line-clamp-4">
                            {work.description || "이 작품에 대한 상세 소개가 아직 없습니다."}
                        </div>

                        {/* 액션 버튼: 판본 선택 모달을 띄우는 트리거 */}
                        <div className="mt-auto pt-8">
                            <button className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3.5 bg-[#1d1d1f] text-white rounded-lg font-bold hover:bg-black transition-transform active:scale-95 shadow-lg">
                                <Plus size={18} /> 서재에 담을 판본 선택하기
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. 통합 소셜 라운지 영역 (하단) */}
                <div className="mt-12">
                    <h2 className="text-[20px] font-black text-[#1d1d1f] mb-6">BoooknTalkers의 사색</h2>
                    
                    {/* 리뷰 탭 메뉴 */}
                    <div className="flex items-center gap-6 border-b border-gray-200 mb-8">
                        <button 
                            onClick={() => setActiveTab('short_reviews')}
                            className={`pb-3 text-[15px] font-bold transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'short_reviews' ? 'text-[#0066cc] border-[#0066cc]' : 'text-gray-400 border-transparent hover:text-[#1d1d1f]'}`}
                        >
                            <MessageSquare size={16} /> 통합 한줄평
                        </button>
                        <button 
                            onClick={() => setActiveTab('long_reviews')}
                            className={`pb-3 text-[15px] font-bold transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'long_reviews' ? 'text-[#0066cc] border-[#0066cc]' : 'text-gray-400 border-transparent hover:text-[#1d1d1f]'}`}
                        >
                            <PenTool size={16} /> 리뷰 (긴줄평)
                        </button>
                    </div>

                    {/* 리뷰 리스트 영역 (다음 스텝에서 API 연동 예정) */}
                    <div className="py-20 flex flex-col items-center justify-center bg-white rounded-lg border border-gray-100 border-dashed">
                        <span className="text-gray-400 font-medium text-[14px]">
                            {activeTab === 'short_reviews' ? '이 작품에 달린 모든 한줄평을 불러올 예정입니다.' : '이 작품에 대한 깊이 있는 서평들을 불러올 예정입니다.'}
                        </span>
                    </div>
                </div>

            </Container>
            <Footer />
        </div>
    );
}