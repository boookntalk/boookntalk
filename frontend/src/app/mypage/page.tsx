// 경로: frontend/src/app/mypage/page.tsx
// 역할 및 기능: BoooknTalk 유저의 독서 통계 대시보드와 최고 관리자(boookntalk@gmail.com) 전용 제어 패널을 제공하며 상단 헤더를 포함하는 마이페이지 컴포넌트입니다.

'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Container from '@/components/layout/Container';
import Footer from '@/components/layout/Footer';
import { Loader2, BookOpen, Star, FileText, TrendingUp, Edit3, Hash, BarChart3, ShieldCheck } from 'lucide-react';
import ProfileEditModal from '@/components/profile/ProfileEditModal';
import AdminPanel from '@/components/admin/AdminPanel';
import AdminWorkMerge from '@/components/admin/AdminWorkMerge';
// 💡 [추가] 기여자 통합 관리 컴포넌트 임포트
import ContributorImageManager from '@/components/admin/ContributorImageManager';

// 함수 기능: 인증 상태를 확인하여 통계 데이터를 불러오고, 관리자 권한 여부에 따라 시스템 관리 탭을 노출합니다.
export default function MyPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [statsData, setStatsData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'admin'>('dashboard');

    const currentUserEmail = session?.user?.email?.toLowerCase().trim() || "";
    const isAdmin = currentUserEmail === 'boookntalk@gmail.com';

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
            return;
        }

        if (status === 'authenticated' && currentUserEmail) {
            fetchStats(currentUserEmail);
        } else if (status === 'authenticated') {
            setIsLoading(false);
        }
    }, [status, session, currentUserEmail]);

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

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-[#F5F5F7]">
                <Loader2 className="animate-spin text-[#0066cc]" size={32} />
            </div>
        );
    }

    const profile = statsData?.profile || { nickname: session?.user?.name || '사용자', bio: '프로필을 설정해주세요.', profile_image: session?.user?.image || '' };
    const summary = statsData?.summary || { total_finished: 0, avg_rating: 0, total_pages: 0, total_reading: 0 };
    const trend_data = statsData?.trend_data || [];
    const top_genres = statsData?.top_genres || [];
    const top_tags = statsData?.top_tags || [];
    const maxTrendCount = Math.max(...trend_data.map((d: any) => d.count), 1);

    return (
        <div className="w-full h-full overflow-y-auto scrollbar-hide bg-[#F5F5F7] flex flex-col">
            {/* 글로벌 헤더 복구 */}
            <Header />

            <div className="flex-1 flex flex-col pt-[var(--spacing-1cm,32px)] pb-20">
                <Container>
                    {/* 탭 네비게이션 영역 */}
                    <div className="flex items-center gap-6 border-b border-gray-200 mb-[var(--spacing-1cm,32px)] px-2">
                        <button 
                            onClick={() => setActiveTab('dashboard')}
                            className={`pb-3 text-[16px] font-extrabold transition-colors relative ${activeTab === 'dashboard' ? 'text-[#1d1d1f]' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            나의 대시보드
                            {activeTab === 'dashboard' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#1d1d1f] rounded-t-md"></span>}
                        </button>
                        
                        {isAdmin && (
                            <button 
                                onClick={() => setActiveTab('admin')}
                                className={`pb-3 text-[16px] font-extrabold transition-colors relative flex items-center gap-1.5 ${activeTab === 'admin' ? 'text-[#0066cc]' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <ShieldCheck size={18} className={activeTab === 'admin' ? 'text-[#0066cc]' : 'text-gray-400'} />
                                시스템 관리
                                {activeTab === 'admin' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#0066cc] rounded-t-md"></span>}
                            </button>
                        )}
                    </div>

                    {/* 탭 1: 대시보드 화면 */}
                    {activeTab === 'dashboard' && statsData && (
                        <div className="animate-in fade-in duration-300 w-full mb-[var(--spacing-1cm,32px)]">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--spacing-1cm,32px)] mb-[var(--spacing-1cm,32px)]">
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
                                    {trend_data.length > 0 ? trend_data.map((data: any, idx: number) => {
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
                                    }) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">아직 기록된 데이터가 없습니다.</div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-1cm,32px)]">
                                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 min-h-[280px]">
                                    <h3 className="text-[16px] font-extrabold text-[#1d1d1f] mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">나의 선호 장르</h3>
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
                        </div>
                    )}

                    {/* 💡 [추가] 탭 2: 시스템 관리 화면 렌더링 */}
                    {activeTab === 'admin' && isAdmin && (
                        <div className="animate-in fade-in duration-300 w-full mb-[var(--spacing-1cm,32px)] flex flex-col gap-[var(--spacing-1cm,32px)]">
                            <AdminPanel />
                            <ContributorImageManager userEmail={currentUserEmail} />
                            <AdminWorkMerge />
                        </div>
                    )}

                </Container>

                <div className="mt-auto w-full">
                    <Footer />
                </div>
            </div>

            <ProfileEditModal 
                isOpen={isProfileModalOpen} 
                onClose={() => {
                    setIsProfileModalOpen(false);
                    if (currentUserEmail) fetchStats(currentUserEmail);
                }} 
                session={session} 
            />
        </div>
    );
}