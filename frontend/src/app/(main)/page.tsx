// 경로: frontend/src/app/[(main)]/page.tsx
// 역할 및 기능: BoooknTalk 비로그인(Guest) 사용자 및 전체 사용자를 위한 메인 랜딩 페이지. 
// 에디토리얼 무드를 바탕으로 차분하고 고급스러운 디지털 서재 경험을 제공합니다. (공통 컴포넌트 적용, 고밀도 워드클라우드 및 영감 작가 리스트 6:4 레이아웃 적용)

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { 
    Quote, MessageCircle, ArrowRight, BookOpen, ChevronRight, 
    ChevronLeft, Star, Loader2, TrendingUp, Flame, HelpCircle, 
    PenTool, Crown 
} from 'lucide-react';
import Container from '@/components/layout/Container';
import Footer from '@/components/layout/Footer';
import { useSession, signIn } from "next-auth/react";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// 공통 컴포넌트 Import
import { FloatingCover } from '@/components/common/FloatingCover';
import { BookItemCard } from '@/components/common/BookItemCard';
import { InsightCard } from '@/components/common/InsightCard';
import { SmartTruncatedText } from '@/components/common/SmartTruncatedText';

// Next.js 환경에서 ECharts WordCloud SSR 충돌을 완벽 방지하는 다이나믹 임포트
const WordCloudChart = dynamic(() => import('@/components/common/WordCloudChart'), { ssr: false });

let memoryCache: any = null;
let cachedCoverIdx = 0;
let cachedArrivalsIdx = 0;

export default function Home() {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ total_sentences: 0, total_pages: 0, reading_books: 0 });
    const [ugcFeeds, setUgcFeeds] = useState<any[]>([]);
    const [newArrivals, setNewArrivals] = useState<any[]>([]);
    const [coverFlowBooks, setCoverFlowBooks] = useState<any[]>([]);
    const [heroSentences, setHeroSentences] = useState<any[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [readersChoice, setReadersChoice] = useState<any>(null);
    const [rcReviewIndex, setRcReviewIndex] = useState(0);
    const [activeCoverflowIndex, setActiveCoverflowIndex] = useState(0);
    const [arrivalsIndex, setArrivalsIndex] = useState(0);
    const [selectedGenre, setSelectedGenre] = useState<string>('All');
    const [bestLongReviews, setBestLongReviews] = useState<any[]>([]);
    const [likedFeeds, setLikedFeeds] = useState<Record<string, boolean>>({});
    const [trendingTags, setTrendingTags] = useState<any[]>([]);
    
    // [신규] 사색을 유발한 작가들 데이터를 저장할 상태 변수
    const [inspiringAuthors, setInspiringAuthors] = useState<any[]>([]);

    const dragStartX = useRef<number | null>(null);
    const isDragging = useRef<boolean>(false);
    const isInitialized = useRef<boolean>(false);
   
    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        const savedCoverIndex = sessionStorage.getItem('bnt_coverIndex');
        const savedArrivalsIndex = sessionStorage.getItem('bnt_arrivalsIndex');
        
        if (savedCoverIndex !== null) setActiveCoverflowIndex(parseInt(savedCoverIndex, 10));
        if (savedArrivalsIndex !== null) setArrivalsIndex(parseInt(savedArrivalsIndex, 10));
        
        if (memoryCache) {
            setStats(memoryCache.stats); setUgcFeeds(memoryCache.ugcFeeds); setNewArrivals(memoryCache.newArrivals);
            setHeroSentences(memoryCache.heroSentences); setReadersChoice(memoryCache.readersChoice);
            setCoverFlowBooks(memoryCache.coverFlowBooks); setBestLongReviews(memoryCache.bestLongReviews);
            setTrendingTags(memoryCache.trendingTags); setInspiringAuthors(memoryCache.inspiringAuthors);
            setActiveCoverflowIndex(cachedCoverIdx); setArrivalsIndex(cachedArrivalsIdx);
            setIsLoading(false);
        }
        isInitialized.current = true;
    }, []);

    useEffect(() => { if (isInitialized.current) sessionStorage.setItem('bnt_coverIndex', activeCoverflowIndex.toString()); cachedCoverIdx = activeCoverflowIndex; }, [activeCoverflowIndex]);
    useEffect(() => { if (isInitialized.current) sessionStorage.setItem('bnt_arrivalsIndex', arrivalsIndex.toString()); cachedArrivalsIdx = arrivalsIndex; }, [arrivalsIndex]);

    const getInitialConsonant = (str: string) => {
        if (!str) return '';
        const title = str.trim();
        const code = title.charCodeAt(0) - 44032;
        if (code > -1 && code < 11172) {
            const cho = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
            return cho[Math.floor(code / 588)];
        }
        const firstChar = title.charAt(0).toUpperCase();
        if (/[A-Z]/.test(firstChar)) return firstChar;
        return '#'; 
    };

    const indexMap = useMemo(() => {
        const map: Record<string, number> = {};
        coverFlowBooks.forEach((book, idx) => {
            const initial = getInitialConsonant(book.title);
            if (map[initial] === undefined) map[initial] = idx;
        });
        return map;
    }, [coverFlowBooks]);

    const handleIndexClick = (char: string) => {
        setSelectedGenre(char);
        if (char === 'All') { setActiveCoverflowIndex(0); return; }
        const targetIdx = indexMap[char];
        if (targetIdx !== undefined) setActiveCoverflowIndex(targetIdx); 
        else toast(`'${char}'(으)로 시작하는 책이 아직 없습니다.`, { duration: 2000 });
    };

    const handleCardClick = (searchKeyword: string) => {
        if (!session) return toast('로그인이 필요해요', { action: { label: '로그인', onClick: () => signIn('google') }, duration: 5000 });
        const cleanKeyword = searchKeyword.replace('🔥', '').trim();
        router.push(`/search?q=${encodeURIComponent(cleanKeyword)}`);
    };

    const handleSentenceClick = (item: any) => {
        if (!session) return toast('로그인이 필요해요', { action: { label: '로그인', onClick: () => signIn('google') }, duration: 5000 });
        if (item.work_id) router.push(`/works/${item.work_id}`);
        else router.push(`/search?q=${encodeURIComponent(item.book || '')}`);
    };

    const handleSquareNavigation = () => {
        if (!session) return toast('로그인이 필요해요', { action: { label: '로그인', onClick: () => signIn('google') }, duration: 5000 });
        router.push('/square');
    };

    const handlePointerDown = (clientX: number) => { dragStartX.current = clientX; isDragging.current = false; };
    const handlePointerMove = (clientX: number) => { if (dragStartX.current !== null && Math.abs(dragStartX.current - clientX) > 10) isDragging.current = true; };
    const handlePointerUpParent = (clientX: number) => {
        if (dragStartX.current === null) return;
        const diff = dragStartX.current - clientX;
        const length = coverFlowBooks.length;
        if (diff > 50) setActiveCoverflowIndex((prev) => (prev + 1) % length);
        else if (diff < -50) setActiveCoverflowIndex((prev) => (prev - 1 + length) % length);
        dragStartX.current = null;
    };

    const handleCoverClick = (idx: number, offset: number) => {
        if (isDragging.current) return; 
        if (offset === 0) handleSquareNavigation();
        else setActiveCoverflowIndex(idx);
    };

    const handleLikeClick = async (e: React.MouseEvent, feedId: string) => {
        e.stopPropagation(); 
        if (!session) return toast('로그인이 필요해요', { action: { label: '로그인', onClick: () => signIn('google') }, duration: 3000 });
        setLikedFeeds(prev => ({ ...prev, [feedId]: !prev[feedId] }));
        try {
            await fetch(`http://localhost:8000/api/feeds/${feedId}/like`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_email: session.user?.email })
            });
        } catch (error) { setLikedFeeds(prev => ({ ...prev, [feedId]: !prev[feedId] })); }
    };

    const nextArrivals = () => { if (newArrivals.length > 0) setArrivalsIndex((prev) => (prev + 1) % newArrivals.length); };
    const prevArrivals = () => { if (newArrivals.length > 0) setArrivalsIndex((prev) => (prev - 1 + newArrivals.length) % newArrivals.length); };
    
    const visibleArrivals = [];
    if (newArrivals.length > 0) {
        for (let i = 0; i < Math.min(10, newArrivals.length); i++) {
            visibleArrivals.push(newArrivals[(arrivalsIndex + i) % newArrivals.length]);
        }
    }

    useEffect(() => {
        if (heroSentences.length === 0) return;
        const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % heroSentences.length), 5000);
        return () => clearInterval(timer);
    }, [heroSentences.length]);

    useEffect(() => {
        if (!readersChoice || readersChoice.length <= 1) return;
        const timer = setInterval(() => setRcReviewIndex((prev) => (prev + 1) % readersChoice.length), 4500);
        return () => clearInterval(timer);
    }, [readersChoice]);

    useEffect(() => {
    const fetchHomeData = async () => {
        if (memoryCache && memoryCache.sessionEmail === (session?.user?.email || null)) return; 
        setIsLoading(true);
        try {
            const emailQuery = session?.user?.email ? `?user_email=${encodeURIComponent(session.user.email)}` : '';
            
            // 1. 배열 구조 분해 할당 맨 끝에 authorsRes 추가
            const [statsRes, ugcRes, arrivalsRes, sentencesRes, rcRes, coverFlowRes, longReviewsRes, tagsRes, authorsRes] = await Promise.all([
                fetch('http://localhost:8000/api/home/stats'),
                fetch('http://localhost:8000/api/home/recent-ugc?limit=6'),
                fetch('http://localhost:8000/api/home/new-arrivals?days=3'),
                fetch(`http://localhost:8000/api/home/today-sentences${emailQuery}`),
                fetch('http://localhost:8000/api/home/readers-choice'),
                fetch('http://localhost:8000/api/home/cover-flow-books'),
                fetch('http://localhost:8000/api/home/best-long-reviews'),
                fetch('http://localhost:8000/api/home/trending-tags?limit=40'),
                // ▼▼▼ [NEW] 1. 작가 랭킹 추출 백엔드 API 추가 ▼▼▼
                fetch('http://localhost:8000/api/home/inspiring-authors') 
            ]);

            // 2. 가짜 데이터(dummyAuthors) 덩어리는 완전히 삭제했습니다.

            const newData = {
                stats: statsRes.ok ? await statsRes.json() : stats,
                ugcFeeds: ugcRes.ok ? await ugcRes.json() : [],
                newArrivals: arrivalsRes.ok ? await arrivalsRes.json() : [],
                heroSentences: sentencesRes.ok ? await sentencesRes.json() : [],
                readersChoice: rcRes.ok ? await rcRes.json() : null,
                coverFlowBooks: coverFlowRes.ok ? await coverFlowRes.json() : [],
                bestLongReviews: longReviewsRes.ok ? await longReviewsRes.json() : [],
                trendingTags: tagsRes.ok ? await tagsRes.json() : [],
                // ▼▼▼ [NEW] 3. 진짜 API 응답 결과(.json())를 파싱해서 상태에 매핑 ▼▼▼
                inspiringAuthors: authorsRes.ok ? await authorsRes.json() : [], 
                sessionEmail: session?.user?.email || null
            };

            setStats(newData.stats); setUgcFeeds(newData.ugcFeeds); setNewArrivals(newData.newArrivals);
            setHeroSentences(newData.heroSentences); setReadersChoice(newData.readersChoice);
            setCoverFlowBooks(newData.coverFlowBooks); setBestLongReviews(newData.bestLongReviews);
            setTrendingTags(newData.trendingTags); 
            setInspiringAuthors(newData.inspiringAuthors); // 상태 업데이트 완료
            
            memoryCache = newData;
        } catch (error) { console.error("홈 데이터 로딩 실패:", error); } 
        finally { setIsLoading(false); }
    };
    fetchHomeData();
}, [session]);

    const indexChars = ['All', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'];

    return (
        <div className="w-full h-full overflow-y-auto bg-[#F7F5F1] scrollbar-hide flex flex-col font-sans selection:bg-[#1F3A5F] selection:text-white">
            
            {/* ▼ Section 0: 인덱스 커버 플로우 ▼ */}
            <section className="w-full pt-[32px]">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12 h-[380px]">
                        <Loader2 className="animate-spin text-[#1F3A5F]" size={32} />
                    </div>
                ) : coverFlowBooks.length > 0 ? (
                    <div 
                        className="relative w-full h-[380px] flex justify-center items-center mt-4 cursor-grab active:cursor-grabbing select-none touch-pan-y"
                        style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
                        onPointerDown={(e) => handlePointerDown(e.clientX)}
                        onPointerMove={(e) => handlePointerMove(e.clientX)}
                        onPointerUp={(e) => handlePointerUpParent(e.clientX)}
                        onPointerLeave={(e) => { if(dragStartX.current !== null) handlePointerUpParent(e.clientX) }}
                    >
                        {coverFlowBooks.map((book, idx) => {
                            const length = coverFlowBooks.length;
                            let offset = idx - activeCoverflowIndex;
                            if (offset > length / 2) offset -= length;
                            else if (offset < -length / 2) offset += length;
                            const absOffset = Math.abs(offset);
                            if (absOffset > 8) return null;

                            let transform = '';
                            let zIndex = 50 - absOffset;
                            let opacity = 1;

                            if (offset === 0) transform = 'translateX(0) scale(1.1) translateZ(50px)';
                            else if (offset < 0) {
                                transform = `translateX(${-140 + offset * 55}px) scale(${1 - absOffset * 0.05}) rotateY(35deg) translateZ(${-absOffset * 60}px)`;
                                opacity = absOffset > 6 ? 0 : 1 - (absOffset * 0.15);
                            } else {
                                transform = `translateX(${140 + offset * 55}px) scale(${1 - absOffset * 0.05}) rotateY(-35deg) translateZ(${-absOffset * 60}px)`;
                                opacity = absOffset > 6 ? 0 : 1 - (absOffset * 0.15);
                            }

                            return (
                                <div 
                                    key={book.id || idx}
                                    onClick={() => handleCoverClick(idx, offset)} 
                                    className="absolute transition-all duration-500 ease-out shadow-[0_8px_30px_rgba(29,36,51,0.15)] rounded-sm group cursor-pointer"
                                    style={{ transform, zIndex, opacity, width: '200px', height: '290px', pointerEvents: absOffset > 6 ? 'none' : 'auto' }}
                                >
                                    <div className="w-full h-full relative rounded-sm overflow-hidden border border-[#E7E2D9] bg-white select-none">
                                        {book.cover ? (
                                            <Image src={book.cover} alt={book.title} fill className="object-cover" unoptimized draggable={false} />
                                        ) : (
                                            <div className="w-full h-full bg-[#F7F5F1] flex flex-col items-center justify-center text-xs text-[#A0AABF]">
                                                <BookOpen className="opacity-30 mb-2" size={32} />
                                                <span>No Cover</span>
                                            </div>
                                        )}
                                        <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1D2433] via-[#1D2433]/60 to-transparent p-5 transition-opacity duration-300 ${offset === 0 ? 'opacity-100' : 'opacity-0'}`}>
                                            <h3 className="font-bold text-white text-[15px] truncate mb-1">{book.title}</h3>
                                            <p className="text-[12px] text-[#A0AABF] truncate mb-2">{book.author}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-[#A0AABF] text-center py-20 font-medium h-[380px] flex items-center justify-center">등록된 책이 없습니다.</div>
                )}

                <Container>
                    <div className="w-full overflow-x-auto scrollbar-hide mt-0 pb-2 max-w-4xl mx-auto">
                        <div className="flex items-center justify-between w-full border-t border-[#E7E2D9] pt-6 px-1 min-w-max gap-x-1">
                            {indexChars.map((char) => (
                                <button 
                                    key={char} 
                                    onClick={() => handleIndexClick(char)}
                                    className={`flex-shrink-0 transition-all duration-200 text-[10px] md:text-[11px] tracking-tighter font-medium ${selectedGenre === char ? 'text-[#1F3A5F] font-black scale-110 translate-y-[-1px]' : 'text-[#A0AABF] hover:text-[#1D2433] hover:font-bold'}`}
                                >
                                    {char}
                                </button>
                            ))}
                        </div>
                    </div>
                </Container>
            </section>

            {/* ▼ Section 1: 오늘의 독서노트 & 독자의 한줄평 ▼ */}
            <section className="w-full pt-[32px]">
                <Container>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch h-auto lg:min-h-[220px]">
                        <div className="lg:col-span-8 relative rounded-sm overflow-hidden shadow-[0_4px_24px_rgba(29,36,51,0.06)] group bg-[#162335] flex flex-col border border-[#1F3A5F]/20">
                            {heroSentences.length > 0 ? (
                                <>
                                    <div className="flex w-full h-full transition-transform duration-700 ease-in-out flex-1" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                                        {heroSentences.map((sentence, idx) => (
                                            <div key={sentence.id || idx} onClick={handleSquareNavigation} className="w-full h-full flex-shrink-0 relative cursor-pointer overflow-hidden flex flex-col">
                                                <div className="absolute inset-0 z-0">
                                                    {sentence.cover ? <Image src={sentence.cover} alt="Background" fill className="object-cover blur-[50px] scale-125 opacity-40 mix-blend-overlay" unoptimized /> : <div className="w-full h-full bg-[#162335]"></div>}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#162335] via-[#162335]/80 to-transparent"></div>
                                                </div>
                                                <div className="relative z-10 flex flex-col justify-between w-full h-full p-6 md:p-8">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <Quote size={14} className="text-[#C89B3C]" />
                                                            <span className="text-[12px] font-black tracking-widest text-[#C89B3C] uppercase">Today's Sentence</span>
                                                        </div>
                                                        <div className="relative" onClick={(e) => { e.stopPropagation(); handleSentenceClick(sentence); }}>
                                                            <SmartTruncatedText 
                                                                content={`${sentence.text} ${sentence.page ? `- ${sentence.page}p` : ''}`} 
                                                                textClassName="text-[20px] md:text-[22px] font-serif font-medium leading-[1.6] break-keep tracking-tight text-white drop-shadow-md"
                                                                wrapQuotes={true}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-end justify-between w-full mt-auto pt-4 border-t border-white/10">
                                                        <div className="flex items-center gap-4">
                                                            <FloatingCover src={sentence.cover} className="w-[40px] h-[58px]" iconSize={16} />
                                                            <div className="flex flex-col text-left justify-center">
                                                                <p className="text-[15px] font-bold text-white mb-0.5 line-clamp-1">{sentence.book}</p>
                                                                <p className="text-[12px] text-[#A0AABF] font-medium mb-1 line-clamp-1">저자 : {sentence.author}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <div className="inline-flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-sm backdrop-blur-md border border-white/10">
                                                                <span className="text-[12px] text-white font-medium truncate">{sentence.user || 'BnTalker'}</span>
                                                            </div>
                                                            <div className="w-8 h-8 rounded-sm flex shrink-0 items-center justify-center transition-all duration-300 border border-[#C89B3C]/50 group-hover:bg-[#C89B3C] group-hover:border-[#C89B3C]">
                                                                <ArrowRight size={14} className="text-[#C89B3C] group-hover:text-white transition-colors" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {heroSentences.length > 1 && (
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                                            {heroSentences.map((_, idx) => (
                                                <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }} className={`h-1.5 rounded-sm transition-all duration-300 ${currentSlide === idx ? 'w-6 bg-[#C89B3C]' : 'w-2 bg-white/30 hover:bg-white/50'}`} />
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center min-h-[220px]">
                                    <Loader2 className="animate-spin text-[#C89B3C]" size={28} />
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-4 flex flex-col h-full min-h-[220px]">
                            <InsightCard className="flex-1 flex flex-col relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(29,36,51,0.06)] transition-shadow duration-300 !p-6">
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-4 shrink-0 border-b border-[#EEF2F7] pb-3">
                                        <div className="flex items-center gap-2">
                                            <MessageCircle size={14} className="text-[#C89B3C]" />
                                            <span className="text-[12px] font-bold text-[#1D2433] tracking-widest uppercase">독자의 한줄평</span>
                                        </div>
                                        {!isLoading && readersChoice && readersChoice.length > 0 && (
                                            <div key={`user-${rcReviewIndex}`} className="animate-in fade-in duration-500 flex items-center gap-1.5">
                                                <span className="text-[11px] font-medium text-[#667085] truncate max-w-[120px]">{readersChoice[rcReviewIndex].user}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {isLoading ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-[#A0AABF] h-full"><Loader2 className="animate-spin text-[#C89B3C] mb-3" size={24} /></div>
                                    ) : readersChoice && readersChoice.length > 0 ? (
                                        <>
                                            <div key={`book-${rcReviewIndex}`} onClick={() => handleSentenceClick({ work_id: readersChoice[rcReviewIndex].work_id, book: readersChoice[rcReviewIndex].title })} className="animate-in fade-in duration-500 flex items-center gap-3 mb-4 cursor-pointer shrink-0 group/mini">
                                                <FloatingCover src={readersChoice[rcReviewIndex].cover} className="w-[36px] h-[52px]" iconSize={16} />
                                                <div className="flex flex-col justify-center">
                                                    <span className="text-[14px] font-bold text-[#1D2433] line-clamp-1 group-hover/mini:text-[#1F3A5F] transition-colors">{readersChoice[rcReviewIndex].title}</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[12px] text-[#667085] line-clamp-1">{readersChoice[rcReviewIndex].author}</span>
                                                        {readersChoice[rcReviewIndex].rating > 0 && (
                                                            <div className="flex items-center gap-0.5 text-[#C89B3C]">
                                                                <Star size={10} fill="currentColor" />
                                                                <span className="text-[10px] font-bold">{readersChoice[rcReviewIndex].rating}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 relative flex flex-col justify-center bg-[#F7F5F1]/50 rounded-md p-4 border border-[#EEF2F7]">
                                                <div key={`text-${rcReviewIndex}`} className="animate-in fade-in duration-500 h-full flex flex-col justify-center relative">
                                                    <Quote size={16} className="text-[#C89B3C]/20 absolute -top-1 -left-1" />
                                                    <div className="pl-4 relative z-10 w-full h-full flex items-center">
                                                        <SmartTruncatedText content={readersChoice[rcReviewIndex].text} textClassName="text-[14px] font-medium text-[#1D2433] font-serif" />
                                                    </div>
                                                </div>
                                            </div>
                                            {readersChoice.length > 1 && (
                                                <div className="flex items-center justify-center gap-2 mt-4 shrink-0">
                                                    {readersChoice.map((_: any, i: number) => (
                                                        <button key={i} onClick={() => setRcReviewIndex(i)} className={`h-1.5 rounded-sm transition-all duration-300 ${rcReviewIndex === i ? 'w-4 bg-[#1F3A5F]' : 'w-1.5 bg-[#E7E2D9] hover:bg-[#A0AABF]'}`} />
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-[#A0AABF]"><MessageCircle className="mb-2 opacity-30" size={24} /><span className="text-[12px]">등록된 한줄평이 없습니다.</span></div>
                                    )}
                                </div>
                            </InsightCard>
                        </div>
                    </div>
                </Container>
            </section>

            {/* ▼ Section 1.5: BnTalkers의 긴줄평 ▼ */}
            <section className="w-full mt-[32px]">
                <Container>
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <span className="text-[12px] font-bold text-[#C89B3C] tracking-widest uppercase mb-2 block">Deep Reviews</span>
                            <h2 className="text-[24px] font-black text-[#1D2433] flex items-center gap-2 tracking-tight">BnTalkers Review</h2>
                            <p className="text-[14px] text-[#667085] mt-1 font-medium">정성껏 남긴 서재의 긴줄평들</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {bestLongReviews.map((review, idx) => (
                            <InsightCard key={review.id || idx} className="!p-6 lg:!p-8 flex gap-6 cursor-pointer group hover:shadow-[0_12px_40px_rgba(29,36,51,0.06)] transition-shadow duration-400">
                                <div onClick={() => handleSentenceClick(review)} className="w-[110px] shrink-0">
                                    <FloatingCover src={review.cover} className="w-full aspect-[1/1.45]" iconSize={24} />
                                    <div className="mt-4 flex justify-center text-[#C89B3C]">
                                        {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < Math.floor(review.rating || 5) ? "currentColor" : "none"} className={i < Math.floor(review.rating || 5) ? "" : "text-[#EEF2F7]"} />)}
                                    </div>
                                </div>
                                
                                <div onClick={() => handleSentenceClick(review)} className="flex-1 flex flex-col justify-between overflow-hidden">
                                    <div>
                                        <div className="mb-3">
                                            <h3 className="text-[18px] font-bold text-[#1D2433] line-clamp-1 group-hover:text-[#1F3A5F] transition-colors">{review.title}</h3>
                                            <p className="text-[12px] text-[#667085] mt-1">by <span className="font-semibold text-[#1D2433]">{review.user}</span></p>
                                        </div>
                                        <div className="relative mt-3">
                                            <Quote size={14} className="text-[#E7E2D9] absolute -top-1 -left-2 z-0" />
                                            <div className="pl-3 relative z-10 w-full h-full pt-1">
                                                <SmartTruncatedText content={review.text?.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ')} textClassName="text-[14px] leading-[1.7] text-[#667085] font-serif" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 pt-4 border-t border-[#EEF2F7] flex justify-between items-center shrink-0">
                                        <span className="text-[11px] font-bold text-[#A0AABF] uppercase tracking-wider">{review.created_at ? review.created_at.split('T')[0] : 'Recent'}</span>
                                        <span className="text-[12px] font-bold text-[#1F3A5F] flex items-center gap-1 group-hover:translate-x-1 transition-transform">전문 읽기 <ArrowRight size={14} /></span>
                                    </div>
                                </div>
                            </InsightCard>
                        ))}
                    </div>
                </Container>
            </section>

            {/* ▼ Section 2: 실시간 독서노트와 한줄평 (Grid 피드) ▼ */}
            <section className="w-full mt-[32px]">
                <Container> 
                    <div className="mb-8 flex justify-between items-end border-b border-[#E7E2D9] pb-4">
                        <div>
                            <span className="text-[12px] font-bold text-[#C89B3C] tracking-widest uppercase mb-2 block">Live Feeds</span>
                            <h2 className="text-[24px] font-black text-[#1D2433] flex items-center gap-2 tracking-tight">서재의 독서노트 & 한줄평</h2>
                        </div>
                        <button onClick={handleSquareNavigation} className="text-[13px] font-bold text-[#667085] hover:text-[#1F3A5F] flex items-center gap-1 transition-colors pb-1">
                            광장 전체보기 <ChevronRight size={16} />
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-12"><Loader2 className="animate-spin text-[#1F3A5F]" size={32} /></div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 w-full">
                            {ugcFeeds.map((feed) => (
                                <InsightCard key={feed.id} className="!p-5 aspect-[4/5] flex flex-col cursor-pointer group hover:shadow-[0_8px_24px_rgba(29,36,51,0.08)] transition-shadow duration-400">
                                    <div onClick={() => handleSentenceClick(feed)} className="flex items-center justify-between mb-4 shrink-0">
                                        {feed.type === 'sentence' ? (
                                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-[#EEF2F7] text-[10px] font-bold tracking-widest text-[#1F3A5F]"><Quote size={10} /> 독서노트</div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-[#FDF8EE] text-[10px] font-bold tracking-widest text-[#C89B3C]"><MessageCircle size={10} /> 한줄평</div>
                                        )}
                                        {feed.type !== 'sentence' && (
                                            <div className="flex text-[#C89B3C]">
                                                {[...Array(Math.floor(feed.rating || 5))].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                                            </div>
                                        )}
                                    </div>
                                    <div onClick={() => handleSentenceClick(feed)} className="flex-1 flex w-full relative">
                                        <SmartTruncatedText content={feed.text} textClassName={`text-[13px] md:text-[14px] leading-[1.7] ${feed.type === 'sentence' ? 'font-serif text-[#1D2433]' : 'text-[#667085]'}`} />
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-[#EEF2F7] flex items-center justify-between shrink-0 gap-3 min-w-0">
                                        <div onClick={() => handleSentenceClick(feed)} className="flex items-center gap-3 flex-1 min-w-0">
                                            <FloatingCover src={feed.cover} className="w-[32px] h-[46px]" iconSize={14} />
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className="font-bold text-[#1D2433] text-[12px] truncate">{feed.book}</span>
                                                <span className="text-[#667085] text-[11px] truncate">{feed.user}</span>
                                            </div>
                                        </div>
                                        <button onClick={(e) => handleLikeClick(e, feed.id)} className={`flex shrink-0 items-center justify-center w-7 h-7 rounded-sm transition-all duration-300 border ${likedFeeds[feed.id] ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-white border-[#E7E2D9] text-[#A0AABF] hover:border-[#1F3A5F] hover:text-[#1F3A5F]'}`}>
                                            <Star size={12} fill={likedFeeds[feed.id] ? "currentColor" : "none"} className={likedFeeds[feed.id] ? 'animate-in zoom-in duration-300' : ''} />
                                        </button>
                                    </div>
                                </InsightCard>
                            ))}
                        </div>
                    )}
                </Container>
            </section>

            {/* ▼ Section 3: 동적 워드 클라우드 & 사색 작가들 (높이 2/3 축소 및 고밀도 최적화) ▼ */}
            <section className="w-full mt-[32px]">
                <Container>
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                        <div>
                            <span className="text-[12px] font-bold text-[#C89B3C] tracking-widest uppercase mb-1.5 block">Trending Thoughts</span>
                            <h2 className="text-[24px] font-black text-[#1D2433] mb-1.5 tracking-tight">BnTalkers Tag</h2>
                            <p className="text-[#667085] font-medium text-[14px]">많이 읽히는 책보다, 많이 생각되는 주제를 보여줍니다.</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <select className="bg-white border border-[#E7E2D9] text-[#1D2433] text-[13px] font-bold rounded-sm px-4 py-2 outline-none hover:border-[#1F3A5F] transition-all cursor-pointer shadow-sm"><option>이번 주</option><option>오늘</option><option>이번 달</option></select>
                            <select className="bg-white border border-[#E7E2D9] text-[#1D2433] text-[13px] font-bold rounded-sm px-4 py-2 outline-none hover:border-[#1F3A5F] transition-all cursor-pointer shadow-sm"><option>급상승</option><option>인기순</option></select>
                        </div>
                    </div>

                    {/* 전체 높이를 기존 420px에서 320px(약 2/3 수준)로 축소, 갭 축소 */}
                    <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[320px] lg:h-[320px]">
                        
                        {/* Left (60%): 고밀도 팩킹 워드 클라우드 */}
                        <InsightCard className="lg:w-[60%] w-full h-full relative flex items-center justify-center p-2 hover:shadow-[0_8px_30px_rgba(29,36,51,0.06)] transition-shadow overflow-visible">
                            
                            {/* 컬러 가이드 툴팁 */}
                            <div className="absolute top-4 right-4 z-20">
                                <div className="relative group">
                                    <div className="flex items-center gap-1 text-[12px] font-bold text-[#A0AABF] hover:text-[#1D2433] cursor-help transition-colors bg-white/80 px-2 py-1 rounded-sm backdrop-blur-sm">
                                        <HelpCircle size={14} /> Color Guide
                                    </div>
                                    
                                    <div className="absolute right-0 top-full mt-2 w-[220px] bg-[#FFFFFF] rounded-sm p-4 border border-[#EEF2F7] shadow-[0_8px_30px_rgba(29,36,51,0.12)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none">
                                        <span className="text-[11px] text-[#667085] font-bold uppercase tracking-widest mb-3 block">Color Guide</span>
                                        <ul className="space-y-2.5">
                                            <li className="flex items-center gap-2 text-[12px]"><span className="w-3 h-3 rounded-sm bg-[#1F3A5F]"></span><span className="font-bold text-[#1F3A5F]">Core</span><span className="text-[#A0AABF] ml-auto">1~2위</span></li>
                                            <li className="flex items-center gap-2 text-[12px]"><span className="w-3 h-3 rounded-sm bg-[#C89B3C]"></span><span className="font-bold text-[#C89B3C] flex items-center gap-1">Rising <Flame size={10}/></span><span className="text-[#A0AABF] ml-auto">3~4위</span></li>
                                            <li className="flex items-center gap-2 text-[12px]"><span className="w-3 h-3 rounded-sm bg-[#667085]"></span><span className="font-bold text-[#667085]">Steady</span><span className="text-[#A0AABF] ml-auto">5~7위</span></li>
                                            <li className="flex items-center gap-2 text-[12px]"><span className="w-3 h-3 rounded-sm bg-[#A0AABF]"></span><span className="font-medium text-[#A0AABF]">Niche</span><span className="text-[#A0AABF] ml-auto">8위 이하</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {isLoading ? (
                                <Loader2 className="animate-spin text-[#1F3A5F]" size={32} />
                            ) : trendingTags.length > 0 ? (
                                <div className="w-full h-full flex-1">
                                    <WordCloudChart data={trendingTags} onWordClick={handleCardClick} />
                                </div>
                            ) : (
                                <span className="text-[#A0AABF] font-medium text-[15px]">아직 수집된 사색의 조각이 없습니다.</span>
                            )}
                        </InsightCard>

                        {/* Right (40%): 사색을 유발한 작가들 */}
                        {/* 패딩 축소(!p-5) 및 컨텐츠 여백 압축 */}
                        <InsightCard className="lg:w-[40%] w-full h-full flex flex-col justify-between !p-5 bg-[#FFFFFF] hover:shadow-[0_8px_30px_rgba(29,36,51,0.06)] transition-shadow overflow-hidden">
                            <div className="flex-1 flex flex-col">
                                {/* [수정됨] 드롭다운 기능이 있던 헤더를 완전히 삭제하고 깔끔한 고정 텍스트로 변경 */}
                                <h3 className="text-[16px] font-extrabold text-[#1D2433] mb-4 flex items-center gap-2 border-b border-[#E7E2D9] pb-3 shrink-0">
                                    <PenTool size={16} className="text-[#C89B3C]" />
                                    우리를 사색에 잠기게 한 작가들
                                </h3>
                                
                                <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
                                    {/* 데이터가 없을 경우를 대비한 방어 코드 (?.) 적용 */}
                                    {inspiringAuthors?.slice(0, 5).map((author, index) => {
                                        // 백엔드 API에서 변수명이 다르게 넘어올 경우를 모두 커버하는 방어 로직
                                        const authorId = author?.contributor_id || author?.id;
                                        const authorName = author?.author_name || author?.name || "이름 없는 작가";
                                        const profileImg = author?.author_profile_image || author?.profile_image;
                                        const displayTag = author?.top_keyword || author?.keyword || "#정보없음";

                                        return (
                                            <div 
                                                key={`author-${authorId || index}`} 
                                                className="flex items-center gap-3 group cursor-pointer p-1 hover:bg-[#F7F5F1] rounded-md transition-colors"
                                                onClick={() => router.push(`/author/${authorId || ''}`)}
                                            >
                                                {/* 1. 순위 및 왕관 아이콘 */}
                                                <div className="w-5 flex items-center justify-center shrink-0">
                                                    {index === 0 ? <Crown size={16} className="text-[#C89B3C]" /> :
                                                    index === 1 ? <Crown size={14} className="text-[#A0AABF]" /> :
                                                    index === 2 ? <Crown size={14} className="text-[#CD7F32]" /> :
                                                    <span className="text-[12px] font-bold text-[#A0AABF]">{index + 1}</span>}
                                                </div>

                                                {/* 2. 작가 프로필 사진 */}
                                                <div className="w-[40px] h-[40px] flex items-center justify-center shrink-0">
                                                    {profileImg ? (
                                                        <img 
                                                            src={profileImg} 
                                                            alt={authorName} 
                                                            className="w-full h-full rounded-full object-cover border border-[#E7E2D9] shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full rounded-full bg-[#EEF2F7] border border-[#E7E2D9] flex items-center justify-center text-[#A0AABF]">
                                                            <PenTool size={16} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 3. 작가명 및 발견된 태그 */}
                                                <div className="flex flex-col flex-1 min-w-0 justify-center">
                                                    <span className="font-bold text-[#1D2433] text-[14px] truncate group-hover:text-[#1F3A5F] transition-colors">
                                                        {authorName}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-[#667085] mt-0.5 w-fit truncate">
                                                        발견된 태그: <span className="font-semibold text-[#1F3A5F]">
                                                            {displayTag}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            {/* 하단 전체보기 버튼 (에러 방지를 위해 button 대신 div 사용) */}
                            <div 
                                onClick={() => router.push('/authors')}
                                className="mt-4 w-full py-2 bg-[#F7F5F1] hover:bg-[#1F3A5F] border border-[#E7E2D9] text-[#1F3A5F] hover:text-white font-bold rounded-sm transition-colors flex items-center justify-center gap-2 group text-[12px] shrink-0 cursor-pointer"
                            >
                                작가 랭킹 전체보기 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </InsightCard>
                    </div>
                </Container>
            </section>

            {/* ▼ Section 4: 새로 등록된 책 ▼ */}
            <section className="w-full mt-[32px] relative">
                <Container>
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <span className="text-[12px] font-bold text-[#C89B3C] tracking-widest uppercase mb-2 block">New Arrivals</span>
                            <h2 className="text-[24px] font-black text-[#1D2433] flex items-center gap-3 tracking-tight">
                                새로 등록된 책 <span className="text-[13px] font-bold text-[#1F3A5F] bg-[#EEF2F7] px-3 py-1 rounded-sm align-middle">총 {newArrivals.length}권</span>
                            </h2>
                        </div>
                        {newArrivals.length > 10 && (
                            <div className="flex items-center gap-2">
                                <button onClick={prevArrivals} className="w-9 h-9 flex items-center justify-center rounded-sm bg-white border border-[#E7E2D9] hover:border-[#1F3A5F] hover:text-[#1F3A5F] transition-colors shadow-sm"><ChevronLeft size={18} /></button>
                                <button onClick={nextArrivals} className="w-9 h-9 flex items-center justify-center rounded-sm bg-white border border-[#E7E2D9] hover:border-[#1F3A5F] hover:text-[#1F3A5F] transition-colors shadow-sm"><ChevronRight size={18} /></button>
                            </div>
                        )}
                    </div>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12"><Loader2 className="animate-spin text-[#1F3A5F]" size={32} /></div>
                    ) : (
                        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3 md:gap-4">
                            {visibleArrivals.map((book, i) => (
                                <div key={`${book.id}-${i}`} onClick={() => handleSentenceClick(book)} className="group cursor-pointer flex flex-col animate-in fade-in duration-500">
                                    <FloatingCover src={book.cover} className="w-full aspect-[1/1.45] mb-2" iconSize={16} />
                                    <h3 className="font-bold text-[#1D2433] text-[11px] leading-tight line-clamp-2 mb-0.5 group-hover:text-[#0066cc] transition-colors">{book.title}</h3>
                                    <p className="text-[10px] text-gray-400 line-clamp-1">{book.discoverer}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </Container>
            </section>

            {/* ▼ Section 5: 하단 통계 대시보드 ▼ */}
            <section className="w-full mt-[32px] mb-20">
                <Container>
                    <InsightCard className="grid grid-cols-1 md:grid-cols-3 gap-8 !p-10">
                        <div className="flex flex-col items-center justify-center text-center md:border-r border-[#EEF2F7] md:pr-8">
                            <span className="text-[13px] font-bold text-[#667085] tracking-widest uppercase mb-3">누적 사색 기록</span>
                            <span className="text-[36px] font-black text-[#1D2433] tracking-tight">{isLoading ? "-" : stats.total_sentences.toLocaleString()}<span className="text-[16px] font-bold text-[#A0AABF] ml-1">개</span></span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center md:border-r border-[#EEF2F7] md:px-8">
                            <span className="text-[13px] font-bold text-[#667085] tracking-widest uppercase mb-3">이번 주 넘긴 페이지</span>
                            <span className="text-[36px] font-black text-[#1F3A5F] tracking-tight">{isLoading ? "-" : stats.total_pages.toLocaleString()}<span className="text-[16px] font-bold text-[#A0AABF] ml-1">p</span></span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center md:pl-8">
                            <span className="text-[13px] font-bold text-[#667085] tracking-widest uppercase mb-3">현재 함께 읽는 책</span>
                            <span className="text-[36px] font-black text-[#1D2433] tracking-tight">{isLoading ? "-" : stats.reading_books.toLocaleString()}<span className="text-[16px] font-bold text-[#A0AABF] ml-1">권</span></span>
                        </div>
                    </InsightCard>
                </Container>
            </section>
            
            <Footer />
        </div>
    );
}