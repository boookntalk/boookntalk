// 파일 경로: src/app/(main)/my-records/insights/InsightsClient.tsx
// 업데이트: SubPageLayout 마스터 템플릿을 적용하여 화면 전체를 활용하는 대시보드 레이아웃(1cm 간격 룰)을 시스템화했습니다.

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Home, ChevronRight, BarChart3, BookOpen, BookCheck, Bookmark, PenTool, MessageSquareQuote, AlignLeft, Trophy, Loader2, HelpCircle, PieChart, Calendar, Star } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart as RechartsPieChart, Pie, Cell, CartesianGrid, LabelList } from 'recharts';
import { InsightCard } from '@/components/common/InsightCard';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// 💡 [핵심] 우리가 만든 단일 페이지 마스터 레이아웃과 로딩 컨테이너 임포트!
import SubPageLayout from '@/components/layout/SubPageLayout';
import StandardContainer from '@/components/layout/StandardContainer';

const GENRE_COLORS = ['#0066cc', '#3385d6', '#66a3e0', '#99c2ea', '#cce0f5'];

const chartConfig = {
  finished_count: {
    label: "완독",
    color: "#80bfff", 
  },
  reading_count: {
    label: "읽는 중",
    color: "#007fff", 
  },
} satisfies ChartConfig;

interface InsightsClientProps {
    userEmail: string;
}

export default function InsightsClient({ userEmail }: InsightsClientProps) {
    const [summaryData, setSummaryData] = useState<any>(null);
    const [flowData, setFlowData] = useState<any>(null);
    
    const [selectedYear, setSelectedYear] = useState<string>('all'); 
    const [flowYear, setFlowYear] = useState<string>(new Date().getFullYear().toString());
    
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [isLoadingFlow, setIsLoadingFlow] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

    useEffect(() => {
        const fetchSummary = async () => {
            setIsLoadingSummary(true);
            try {
                const url = selectedYear === 'all' 
                    ? `${API_URL}/api/mypage/stats/${userEmail}`
                    : `${API_URL}/api/mypage/stats/${userEmail}?year=${selectedYear}`;

                const res = await fetch(url, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setSummaryData(data);
                }
            } catch (error) {
                console.error("요약 데이터를 불러오는데 실패했습니다.", error);
            } finally {
                setIsLoadingSummary(false);
            }
        };
        fetchSummary();
    }, [userEmail, selectedYear]);

    useEffect(() => {
        const fetchFlow = async () => {
            setIsLoadingFlow(true);
            try {
                const res = await fetch(`${API_URL}/api/insights/user/${userEmail}/yearly-flow?year=${flowYear}`);
                if (res.ok) {
                    const data = await res.json();
                    setFlowData(data);
                }
            } catch (error) {
                console.error("흐름 데이터를 불러오는데 실패했습니다.", error);
            } finally {
                setIsLoadingFlow(false);
            }
        };
        fetchFlow();
    }, [userEmail, flowYear]);

    const totalReadingInPeriod = useMemo(() => {
        if (!flowData || !Array.isArray(flowData.flow_data)) return 0;
        return flowData.flow_data.reduce((acc: number, curr: any) => acc + (curr.reading_count || 0), 0);
    }, [flowData]);

    if (!summaryData && isLoadingSummary) {
        return (
            <StandardContainer size="wide" className="min-h-[60vh] flex flex-col justify-center items-center">
                <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce"></div>
                </div>
            </StandardContainer>
        );
    }

    if (!summaryData) return <div className="p-8 text-center text-gray-500">데이터를 불러올 수 없습니다.</div>;

    const { summary, top_genres, top_tags } = summaryData;
    const records_weight = summaryData.records_weight || { memo_count: 0, short_review_count: 0, long_review_count: 0 };

    return (
        // 💡 껍데기를 모두 덜어내고 SubPageLayout 템플릿 호출!
        <SubPageLayout
            breadcrumb={
                <>
                    <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors"><Home size={15} /> 홈</Link>
                    <ChevronRight size={14} className="opacity-50" />
                    <span className="text-gray-400">인사이트</span>
                    <ChevronRight size={14} className="opacity-50" />
                    <span className="text-[#1d1d1f] flex items-center gap-1"><BarChart3 size={14} /> 서재 인사이트</span>
                </>
            }
            titleOrTabs={
                <div className="flex items-center justify-between pb-0 w-full">
                    {/* 💡 [영점 조절] H1 태그의 여백 무효화 (leading-none) */}
                    <div className="flex items-center gap-3">
                        <h1 className="text-[20px] md:text-[22px] font-black leading-none text-[#1d1d1f] flex items-center gap-2">
                            <BarChart3 size={24} className="text-[#0066cc]" /> 서재 인사이트
                        </h1>
                    </div>

                    {/* 우측 액션: 기간 선택 셀렉트 박스 */}
                    <div className="flex items-center">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-[130px] h-9 bg-white border-gray-200 text-[#1d1d1f] font-bold text-[13px] rounded-full focus:ring-[#0066cc] shadow-sm">
                                <Calendar size={14} className="mr-2 text-gray-400" />
                                <SelectValue placeholder="기간 선택" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                <SelectItem value="all" className="font-bold text-[13px]">전체 기간</SelectItem>
                                {yearOptions.map(year => (
                                    <SelectItem key={year} value={year} className="font-bold text-[13px]">{year}년</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            }
        >
            {/* 💡 [핵심] 레이아웃 컨테이너가 내부 여백을 관리하므로, 여기에 복잡한 스크롤이나 패딩 설정은 제외하고 대시보드 알맹이만 배치합니다. */}
            <div className="flex flex-col gap-[var(--spacing-1cm,32px)] max-w-5xl mx-auto relative">
                
                {isLoadingSummary && (
                     <div className="absolute inset-0 bg-[#F5F5F7]/50 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-2xl">
                         <Loader2 className="w-8 h-8 animate-spin text-[#0066cc]" />
                     </div>
                )}

                {/* [섹션 1] 서재의 지형 */}
                <section>
                    <h2 className="text-[16px] font-bold text-[#1d1d1f] mb-4">
                        서재의 지형 <span className="text-[12px] text-gray-400 font-medium ml-2">{selectedYear === 'all' ? '(전체 누적)' : `(${selectedYear}년 기준)`}</span>
                    </h2>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <InsightCard className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                <BookCheck size={24} className="text-[#0066cc]" />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-gray-400 mb-1">완독한 책</p>
                                <p className="text-[24px] font-black text-[#1d1d1f] leading-none">{summary?.total_finished || 0}<span className="text-[14px] font-bold text-gray-400 ml-1">권</span></p>
                            </div>
                        </InsightCard>
                        
                        <InsightCard className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                <BookOpen size={24} className="text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-gray-400 mb-1">읽고 있는 책</p>
                                <p className="text-[24px] font-black text-[#1d1d1f] leading-none">{summary?.total_reading || 0}<span className="text-[14px] font-bold text-gray-400 ml-1">권</span></p>
                            </div>
                        </InsightCard>

                        <InsightCard className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
                                <BookOpen size={24} className="text-violet-500" />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-gray-400 mb-1">읽기 전</p>
                                <p className="text-[24px] font-black text-[#1d1d1f] leading-none">{summary?.total_unread || 0}<span className="text-[14px] font-bold text-gray-400 ml-1">권</span></p>
                            </div>
                        </InsightCard>

                        <InsightCard className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                                <Bookmark size={24} className="text-rose-500" />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-gray-400 mb-1">읽고 싶은 책</p>
                                <p className="text-[24px] font-black text-[#1d1d1f] leading-none">{summary?.total_wish || 0}<span className="text-[14px] font-bold text-gray-400 ml-1">권</span></p>
                            </div>
                        </InsightCard>

                        <InsightCard className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                                <Star size={24} className="text-amber-400 fill-amber-400" />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-gray-400 mb-1">평균 별점</p>
                                <p className="text-[24px] font-black text-[#1d1d1f] leading-none">{summary?.avg_rating || 0.0}<span className="text-[14px] font-bold text-gray-400 ml-1">점</span></p>
                            </div>
                        </InsightCard>
                    </div>
                </section>

                {/* [섹션 2] 취향 분석 */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--spacing-1cm,32px)]">
                    <InsightCard>
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-[16px] font-bold text-[#1d1d1f] flex items-center gap-2">
                                <PieChart size={18} className="text-[#0066cc]" /> 선호 장르 스펙트럼
                            </h2>
                            <div className="relative group flex items-center cursor-help">
                                <HelpCircle size={15} className="text-amber-500 hover:text-[#0066cc] transition-colors" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-max max-w-[240px] bg-gray-800 text-white text-[12px] leading-relaxed px-3 py-2 rounded-md shadow-lg z-10 pointer-events-none">
                                    <p>내 서재에 담긴 모든 도서</p>
                                    <p className="font-bold text-[#eded00] bg-white/10 px-1 rounded inline-block mt-0.5 mb-0.5">
                                        완독 + 읽는 중 + 찜
                                    </p>
                                    <p>을(를) 기준으로 취향을 분석합니다.</p>
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-800"></div>
                                </div>
                            </div>
                        </div>

                        {top_genres && top_genres.length > 0 ? (
                            <>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie data={top_genres.map((g:any)=>({name: g.genre, value: g.count}))} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                                                {top_genres.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={GENRE_COLORS[index % GENRE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '2px', border: '1px solid #e5e7eb', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }} />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap justify-center gap-4 mt-2">
                                    {top_genres.map((entry: any, index: number) => (
                                        <div key={entry.genre} className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: GENRE_COLORS[index % GENRE_COLORS.length] }}></span>
                                            <span className="text-[12px] font-bold text-gray-500">{entry.genre} ({entry.count}권)</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-[13px] text-gray-400 font-bold">해당 기간의 장르 데이터가 없습니다.</div>
                        )}
                    </InsightCard>

                    <InsightCard>
                        <h2 className="text-[16px] font-bold text-[#1d1d1f] mb-6 flex items-center gap-2">
                            <Trophy size={18} className="text-[#0066cc]" /> 가장 많이 사용한 태그 TOP 5
                        </h2>
                        <div className="flex flex-col gap-4">
                            {top_tags && top_tags.length > 0 ? top_tags.slice(0, 5).map((tag: any, idx: number) => (
                                <div key={tag.text} className="flex items-center justify-between p-4 rounded-sm bg-gray-50/50 border border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[18px] font-black ${idx === 0 ? 'text-[#0066cc]' : 'text-gray-300'}`}>0{idx + 1}</span>
                                        <span className="text-[15px] font-bold text-[#1d1d1f]">#{tag.text}</span>
                                    </div>
                                    <span className="text-[13px] font-bold text-gray-400">{tag.count}회</span>
                                </div>
                            )) : (
                                <div className="py-10 text-center text-[13px] text-gray-400 font-bold">해당 기간의 태그 데이터가 없습니다.</div>
                            )}
                        </div>
                    </InsightCard>
                </section>

                {/* [섹션 3] 독서 흐름 차트 */}
                <section>
                    <InsightCard>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-[16px] font-bold text-[#1d1d1f]">독서 흐름</h2>
                                
                                <Select value={flowYear} onValueChange={setFlowYear}>
                                    <SelectTrigger className="w-[110px] h-8 bg-gray-50 border-gray-100 text-[#1d1d1f] font-bold text-[12px] rounded-full focus:ring-[#0066cc]">
                                        <Calendar size={13} className="mr-1.5 text-gray-400" />
                                        <SelectValue placeholder="기간 선택" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                        <SelectItem value="all" className="font-bold text-[12px]">전체 기간</SelectItem>
                                        {yearOptions.map(year => (
                                            <SelectItem key={year} value={year} className="font-bold text-[12px]">{year}년</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center sm:justify-end gap-6">
                                <div className="text-right">
                                    <p className="text-[12px] font-bold text-gray-400 mb-0.5 flex items-center gap-1.5 justify-end">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartConfig.finished_count.color }}></span>완독
                                    </p>
                                    <p className="text-[20px] font-black text-[#1d1d1f]">
                                        {flowData ? flowData.total_read_in_period : 0}<span className="text-[13px] text-gray-400 ml-1">권</span>
                                    </p>
                                </div>
                                <div className="w-px h-8 bg-gray-200"></div>
                                <div className="text-right">
                                    <p className="text-[12px] font-bold text-gray-400 mb-0.5 flex items-center gap-1.5 justify-end">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartConfig.reading_count.color }}></span>읽는 중
                                    </p>
                                    <p className="text-[20px] font-black text-[#1d1d1f]">
                                        {totalReadingInPeriod}<span className="text-[13px] text-gray-400 ml-1">권</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="h-[250px] w-full relative">
                            {isLoadingFlow && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-xl">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#0066cc]" />
                                </div>
                            )}
                            
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <BarChart accessibilityLayer data={flowData?.flow_data || []} margin={{ top: 25, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tickMargin={10}
                                        tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} 
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} 
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent indicator="dashed" />}
                                    />
                                    
                                    <Bar dataKey="finished_count" fill="var(--color-finished_count)" radius={4}>
                                        <LabelList 
                                            dataKey="finished_count" 
                                            position="top" 
                                            offset={10} 
                                            className="fill-[#9ca3af] text-[11px] font-bold" 
                                            formatter={(value: number) => (value > 0 ? value : '')}
                                        />
                                    </Bar>
                                    <Bar dataKey="reading_count" fill="var(--color-reading_count)" radius={4}>
                                        <LabelList 
                                            dataKey="reading_count" 
                                            position="top" 
                                            offset={10} 
                                            className="fill-[#9ca3af] text-[11px] font-bold" 
                                            formatter={(value: number) => (value > 0 ? value : '')}
                                        />
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </div>
                    </InsightCard>
                </section>

                {/* [섹션 4] 기록의 무게 */}
                <section>
                    <h2 className="text-[16px] font-bold text-[#1d1d1f] mb-4">기록의 무게</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InsightCard href="/my-records/notes" className="flex flex-col justify-between min-h-[140px]">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                    <PenTool size={20} className="text-gray-400 group-hover:text-[#0066cc] transition-colors" />
                                </div>
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-[#0066cc] transition-colors opacity-0 group-hover:opacity-100" />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-gray-400 mb-1">독서노트</p>
                                <p className="text-[24px] font-black text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors">{records_weight.memo_count}<span className="text-[14px] font-bold text-gray-400 ml-1">개</span></p>
                            </div>
                        </InsightCard>
                        
                        <InsightCard href="/my-records/short-reviews" className="flex flex-col justify-between min-h-[140px]">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                    <MessageSquareQuote size={20} className="text-gray-400 group-hover:text-[#0066cc] transition-colors" />
                                </div>
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-[#0066cc] transition-colors opacity-0 group-hover:opacity-100" />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-gray-400 mb-1">한줄평</p>
                                <p className="text-[24px] font-black text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors">{records_weight.short_review_count}<span className="text-[14px] font-bold text-gray-400 ml-1">개</span></p>
                            </div>
                        </InsightCard>

                        <InsightCard href="/my-records/long-reviews" className="flex flex-col justify-between min-h-[140px]">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                    <AlignLeft size={20} className="text-gray-400 group-hover:text-[#0066cc] transition-colors" />
                                </div>
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-[#0066cc] transition-colors opacity-0 group-hover:opacity-100" />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-gray-400 mb-1">긴줄평</p>
                                <p className="text-[24px] font-black text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors">{records_weight.long_review_count}<span className="text-[14px] font-bold text-gray-400 ml-1">개</span></p>
                            </div>
                        </InsightCard>
                    </div>
                </section>

            </div>
        </SubPageLayout>
    );
}