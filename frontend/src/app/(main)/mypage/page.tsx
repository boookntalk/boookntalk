'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import Container from '@/components/layout/Container';
import Footer from '@/components/layout/Footer';
import { Loader2, BookOpen, Star, FileText, TrendingUp, Edit3, Hash, BarChart3 } from 'lucide-react';
import ProfileEditModal from '@/components/profile/ProfileEditModal';

export default function MyPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [statsData, setStatsData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
            return;
        }

        if (status === 'authenticated' && session?.user?.email) {
            fetchStats(session.user.email);
        }
    }, [status, session]);

    const fetchStats = async (email: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/mypage/stats/${encodeURIComponent(email)}`);
            if (res.ok) {
                const data = await res.json();
                setStatsData(data);
            }
        } catch (error) {
            console.error("통계 데이터 로딩 실패:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || status === 'loading') {
        return <div className="min-h-screen flex justify-center items-center bg-[#F5F5F7]"><Loader2 className="animate-spin text-[#0066cc]" size={32} /></div>;
    }

    if (!statsData) return null;

    const { profile, summary, trend_data, top_genres, top_tags } = statsData;
    const maxTrendCount = Math.max(...trend_data.map((d: any) => d.count), 1); // 차트 비율 계산용

    return (
        <div className="w-full h-full overflow-y-auto scrollbar-hide bg-[#F5F5F7] flex flex-col pt-[var(--spacing-1cm,32px)]">
            <Container>
                {/* 1. 상단: 프로필 및 요약 대시보드 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--spacing-1cm,32px)] mb-[var(--spacing-1cm,32px)]">
                    
                    {/* 프로필 카드 */}
                    <div className="lg:col-span-4 bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-[#0066cc]/5 to-transparent z-0" />
                        <div className="relative z-10 w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 mb-4">
                            {profile.profile_image ? (
                                <img src={profile.profile_image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-200" />
                            )}
                        </div>
                        <h2 className="relative z-10 text-[22px] font-black text-[#1d1d1f] mb-1">{profile.nickname}</h2>
                        <p className="relative z-10 text-[14px] text-gray-500 font-medium break-keep px-4">{profile.bio}</p>
                        <button 
                            onClick={() => setIsProfileModalOpen(true)} 
                            className="relative z-10 mt-6 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-50 text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                            <Edit3 size={14} /> 프로필 수정
                        </button>
                    </div>

                    {/* 4개의 핵심 요약 통계 */}
                    <div className="lg:col-span-8 grid grid-cols-2 gap-4 md:gap-[var(--spacing-1cm,32px)]">
                        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-blue-50 rounded-lg"><BookOpen size={18} className="text-[#0066cc]" /></div>
                                <span className="text-[13px] font-bold text-gray-500">완독한 지식들</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-[36px] font-black text-[#1d1d1f] tracking-tight">{summary.total_finished}</span>
                                <span className="text-[15px] font-medium text-gray-400">권</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-amber-50 rounded-lg"><Star size={18} className="text-amber-500" /></div>
                                <span className="text-[13px] font-bold text-gray-500">나의 평균 별점</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-[36px] font-black text-[#1d1d1f] tracking-tight">{summary.avg_rating}</span>
                                <span className="text-[15px] font-medium text-gray-400">점</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-emerald-50 rounded-lg"><FileText size={18} className="text-emerald-600" /></div>
                                <span className="text-[13px] font-bold text-gray-500">누적 읽은 페이지</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-[36px] font-black text-[#1d1d1f] tracking-tight">{summary.total_pages.toLocaleString()}</span>
                                <span className="text-[15px] font-medium text-gray-400">쪽</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-purple-50 rounded-lg"><TrendingUp size={18} className="text-purple-600" /></div>
                                <span className="text-[13px] font-bold text-gray-500">현재 읽는 중</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-[36px] font-black text-[#1d1d1f] tracking-tight">{summary.total_reading}</span>
                                <span className="text-[15px] font-medium text-gray-400">권</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. 중단: 올해의 독서 흐름 (월별 막대 그래프) */}
                <div className="w-full bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 mb-[var(--spacing-1cm,32px)]">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[18px] font-extrabold text-[#1d1d1f] flex items-center gap-2">
                            <BarChart3 className="text-[#0066cc]" size={20} /> 올해의 독서 흐름
                        </h3>
                        <span className="text-[13px] font-bold bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200">
                            {new Date().getFullYear()}년 완독 기준
                        </span>
                    </div>
                    
                    <div className="h-[200px] w-full flex items-end justify-between gap-2 px-2">
                        {trend_data.map((data: any, idx: number) => {
                            const heightPercent = data.count > 0 ? Math.max((data.count / maxTrendCount) * 100, 10) : 0;
                            return (
                                <div key={idx} className="flex flex-col items-center flex-1 group">
                                    <div className="text-[12px] font-bold text-[#0066cc] opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                                        {data.count}권
                                    </div>
                                    <div className="w-full max-w-[40px] bg-[#f5f5f7] rounded-t-xl flex items-end justify-center overflow-hidden h-[150px] relative">
                                        <div 
                                            className="w-full bg-gradient-to-t from-[#0066cc] to-[#3388ff] rounded-t-xl transition-all duration-1000 ease-out"
                                            style={{ height: `${heightPercent}%` }}
                                        />
                                    </div>
                                    <span className="text-[12px] font-bold text-gray-400 mt-3">{data.month}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. 하단: 독서 취향 분석 (장르 및 태그) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-1cm,32px)] mb-12">
                    {/* 선호 장르 */}
                    <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 min-h-[280px]">
                        <h3 className="text-[16px] font-extrabold text-[#1d1d1f] mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                            나의 선호 장르
                        </h3>
                        {top_genres.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {top_genres.map((genre: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-blue-50 text-[#0066cc] text-[12px] font-black flex items-center justify-center">{idx + 1}</span>
                                            <span className="text-[14px] font-bold text-[#1d1d1f]">{genre.genre}</span>
                                        </div>
                                        <span className="text-[13px] font-bold text-gray-400">{genre.count}권</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[13px] text-gray-400 font-medium pb-8">아직 기록된 장르 데이터가 없습니다.</div>
                        )}
                    </div>

                    {/* 선호 태그 워드 클라우드 형태 */}
                    <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 min-h-[280px]">
                        <h3 className="text-[16px] font-extrabold text-[#1d1d1f] mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                            <Hash className="text-[#0066cc]" size={18} /> 내가 가장 많이 쓴 태그
                        </h3>
                        {top_tags.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                                {top_tags.map((tag: any, idx: number) => (
                                    <div key={idx} className="px-3 py-1.5 rounded-lg bg-[#f5f5f7] border border-gray-200 flex items-center gap-1.5 hover:bg-blue-50 hover:border-blue-100 hover:text-[#0066cc] transition-colors cursor-default">
                                        <span className="text-[13px] font-bold text-gray-700">{tag.text}</span>
                                        <span className="text-[11px] font-medium text-gray-400">{tag.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[13px] text-gray-400 font-medium pb-8">아직 등록된 태그가 없습니다.</div>
                        )}
                    </div>
                </div>
            </Container>
            <Footer />
            {/* ▼▼▼ [NEW] 프로필 수정 모달 컴포넌트 삽입 ▼▼▼ */}
            <ProfileEditModal 
                isOpen={isProfileModalOpen} 
                onClose={() => {
                    setIsProfileModalOpen(false);
                    // 모달이 닫힐 때 변경된 닉네임/소개가 화면에 즉시 반영되도록 데이터 다시 불러오기
                    if (session?.user?.email) fetchStats(session.user.email);
                }} 
                session={session} 
            />
        </div>
    );
}