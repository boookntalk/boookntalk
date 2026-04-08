// 경로: frontend/src/app/[(main)]/page.tsx
// 역할 및 기능: BoooknTalk 비로그인(Guest) 사용자 및 전체 사용자를 위한 메인 랜딩 페이지. 
// 에디토리얼 무드를 바탕으로 차분하고 고급스러운 디지털 서재 경험을 제공합니다. 
// (최신 업데이트: 상단 5:5 탭 레이아웃 적용, Discovery Hub 가로 스크롤(스와이프) 다이어트 적용)

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { 
    Quote, MessageCircle, ArrowRight, BookOpen, ChevronRight, 
    ChevronLeft, Star, Loader2, TrendingUp, Flame, HelpCircle, 
    PenTool, Crown, Search, AlignLeft
} from 'lucide-react';
import Container from '@/components/layout/Container';
import Footer from '@/components/layout/Footer';
import { useSession, signIn } from "next-auth/react";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// 공통 컴포넌트 Import
import { FloatingCover } from '@/components/common/FloatingCover';
import { InsightCard } from '@/components/common/InsightCard';
import { SmartTruncatedText } from '@/components/common/SmartTruncatedText';

// Next.js 환경에서 ECharts WordCloud SSR 충돌을 완벽 방지하는 다이나믹 임포트
const WordCloudChart = dynamic(() => import('@/components/common/WordCloudChart'), { ssr: false });

let memoryCache: any = null;
let cachedCoverIdx = 0;

export default function Home() {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ total_sentences: 0, total_pages: 0, reading_books: 0 });
    
    // 섹션 1 (5:5 레이아웃) 상태
    const [heroSentences, setHeroSentences] = useState<any[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [readersChoice, setReadersChoice] = useState<any>(null); // 한줄평 데이터
    const [bestLongReviews, setBestLongReviews] = useState<any[]>([]); // 긴줄평 데이터
    const [reviewTab, setReviewTab] = useState<'short' | 'long'>('short'); // 리뷰 탭 상태
    const [rcReviewIndex, setRcReviewIndex] = useState(0); // 한줄평 슬라이드 인덱스
    const [lrReviewIndex, setLrReviewIndex] = useState(0); // 긴줄평 슬라이드 인덱스
    
    // 커버플로우 및 작가, 태그 상태
    const [coverFlowBooks, setCoverFlowBooks] = useState<any[]>([]);
    const [activeCoverflowIndex, setActiveCoverflowIndex] = useState(0);
    const [selectedGenre, setSelectedGenre] = useState<string>('All');
    const [trendingTags, setTrendingTags] = useState<any[]>([]);
    const [inspiringAuthors, setInspiringAuthors] = useState<any[]>([]);

    // 💡 Discovery Hub 탭 상태 및 외부 API 데이터 상태
    const [discoveryTab, setDiscoveryTab] = useState<'library' | 'naver' | 'bntalk'>('library');
    const [libraryPopular, setLibraryPopular] = useState<any[]>([]);
    const [naverNewArrivals, setNaverNewArrivals] = useState<any[]>([]);
    const [newArrivals, setNewArrivals] = useState<any[]>([]); // BoooknTalk 내부 신간

    const dragStartX = useRef<number | null>(null);
    const isDragging = useRef<boolean>(false);
    const isInitialized = useRef<boolean>(false);
   
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        const savedCoverIndex = sessionStorage.getItem('bnt_coverIndex');
        if (savedCoverIndex !== null) setActiveCoverflowIndex(parseInt(savedCoverIndex, 10));
        isInitialized.current = true;
    }, []);

    useEffect(() => { if (isInitialized.current) sessionStorage.setItem('bnt_coverIndex', activeCoverflowIndex.toString()); cachedCoverIdx = activeCoverflowIndex; }, [activeCoverflowIndex]);

    // 💡 [NEW] 작가 이름에 붙은 불필요한 장르명, 역할어 찌꺼기를 안전하게 제거하는 함수
    const cleanAuthorName = (name: string) => {
        if (!name) return '';
        // 1. 쉼표, 괄호, 파이프 등으로 첫 번째(메인) 작가만 분리
        let clean = name.split(',')[0].split('(')[0].split(';')[0].split('|')[0];
        
        // 2. 이름의 '끝'에 붙어있는 역할어나 장르명 찌꺼기 제거 (공백 유무 상관없이 모두 처리)
        clean = clean.replace(/\s*(장편소설|장소설|소설|지음|옮김|저자|편자|그림|글|지은이|옮긴이)\s*$/g, '');
        
        // 3. 한 번 더 치환 (혹시 '조엘 디케르 장소설 지음' 처럼 두 개가 연달아 붙어있을 경우를 대비)
        clean = clean.replace(/\s*(장편소설|장소설|소설|지음|옮김|저자|편자|그림|글|지은이|옮긴이)\s*$/g, '');

        return clean.trim();
    };

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
        if (offset === 0) {
            if (coverFlowBooks[idx]?.isbn) router.push(`/search?q=${coverFlowBooks[idx].isbn}`);
        }
        else setActiveCoverflowIndex(idx);
    };

    // 💡 슬라이더 타이머 로직들
    useEffect(() => {
        if (heroSentences.length === 0) return;
        const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % heroSentences.length), 5000);
        return () => clearInterval(timer);
    }, [heroSentences.length]);

    useEffect(() => {
        if (!readersChoice || readersChoice.length <= 1 || reviewTab !== 'short') return;
        const timer = setInterval(() => setRcReviewIndex((prev) => (prev + 1) % readersChoice.length), 5000);
        return () => clearInterval(timer);
    }, [readersChoice, reviewTab]);

    useEffect(() => {
        if (!bestLongReviews || bestLongReviews.length <= 1 || reviewTab !== 'long') return;
        const timer = setInterval(() => setLrReviewIndex((prev) => (prev + 1) % bestLongReviews.length), 5000);
        return () => clearInterval(timer);
    }, [bestLongReviews, reviewTab]);


    // ============================================================
    // 🚀 [메인 데이터 패칭 및 캐시 복구 로직]
    // ============================================================
    useEffect(() => {
        const safetyTimer = setTimeout(() => { setIsLoading(false); }, 2500);

        if (memoryCache) {
            setStats(memoryCache.stats);
            setHeroSentences(memoryCache.heroSentences);
            setReadersChoice(memoryCache.readersChoice);
            setBestLongReviews(memoryCache.bestLongReviews);
            setCoverFlowBooks(memoryCache.coverFlowBooks);
            setTrendingTags(memoryCache.trendingTags);
            setInspiringAuthors(memoryCache.inspiringAuthors);
            
            setLibraryPopular(memoryCache.libraryPopular);
            setNaverNewArrivals(memoryCache.naverNewArrivals);
            setNewArrivals(memoryCache.newArrivals);
            
            setActiveCoverflowIndex(cachedCoverIdx);
            setIsLoading(false); 
            clearTimeout(safetyTimer); 
            return; 
        }

        if (status === "loading") {
            return () => clearTimeout(safetyTimer);
        }

        const fetchHomeData = async () => {
            setIsLoading(true);
            try {
                const emailQuery = session?.user?.email ? `?user_email=${encodeURIComponent(session.user.email)}` : '';
                const res = await fetch(`http://localhost:8000/api/home/dashboard${emailQuery}`);
                
                if (!res.ok) throw new Error("대시보드 통신 에러");
                const data = await res.json();
                
                const newData = {
                    stats: data.stats || { total_sentences: 0, total_pages: 0, reading_books: 0 },
                    heroSentences: data.heroSentences || [],
                    readersChoice: data.readersChoice || [],
                    bestLongReviews: data.bestLongReviews || [],
                    coverFlowBooks: data.coverFlowBooks || [],
                    trendingTags: data.trendingTags || [],
                    inspiringAuthors: data.inspiringAuthors || [],
                    
                    libraryPopular: data.libraryPopular || [],
                    naverNewArrivals: data.naverNewArrivals || [],
                    newArrivals: data.newArrivals || [],
                    
                    sessionEmail: session?.user?.email || null
                };

                setStats(newData.stats);
                setHeroSentences(newData.heroSentences);
                setReadersChoice(newData.readersChoice);
                setBestLongReviews(newData.bestLongReviews);
                setCoverFlowBooks(newData.coverFlowBooks);
                setTrendingTags(newData.trendingTags);
                setInspiringAuthors(newData.inspiringAuthors);
                
                setLibraryPopular(newData.libraryPopular);
                setNaverNewArrivals(newData.naverNewArrivals);
                setNewArrivals(newData.newArrivals);
                
                memoryCache = newData;
                setRcReviewIndex(0);
                setLrReviewIndex(0);
            } catch (error) { 
                console.error("홈 데이터 로딩 실패:", error); 
            } finally { 
                setIsLoading(false); 
                clearTimeout(safetyTimer);
            }
        };
        
        fetchHomeData();
        return () => clearTimeout(safetyTimer);
    }, [session, status]);

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

            {/* ▼ Section 1: 오늘의 문장 (메모) & 유저 리뷰 (5:5 분할) ▼ */}
            <section className="w-full pt-[32px]">
                <Container>
                    {/* 💡 카드의 기본 높이를 살짝 키워(300px) 3줄 텍스트가 안정적으로 들어가게 최적화 */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-auto lg:h-[300px]">
                        
                        {/* 1. 좌측 (50%): 오늘의 문장 (메모) */}
                        <div className="lg:col-span-6 relative rounded-sm overflow-hidden shadow-[0_4px_24px_rgba(29,36,51,0.06)] group bg-[#162335] flex flex-col border border-[#1F3A5F]/20 h-full min-h-[280px]">
                            {heroSentences.length > 0 ? (
                                <>
                                    <div className="flex w-full h-full transition-transform duration-700 ease-in-out flex-1" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                                        {heroSentences.map((sentence, idx) => (
                                            <div key={sentence.id || idx} onClick={handleSquareNavigation} className="w-full h-full flex-shrink-0 relative cursor-pointer overflow-hidden flex flex-col">
                                                <div className="absolute inset-0 z-0">
                                                    {sentence.cover ? <Image src={sentence.cover} alt="Background" fill className="object-cover blur-[50px] scale-125 opacity-40 mix-blend-overlay" unoptimized /> : <div className="w-full h-full bg-[#162335]"></div>}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#162335] via-[#162335]/80 to-transparent"></div>
                                                </div>
                                                
                                                {/* 💡 카드 내부 패딩과 구조 최적화 */}
                                                <div className="relative z-10 flex flex-col w-full h-full p-6 md:p-8">
                                                    
                                                    {/* 상단 타이틀 (고정) */}
                                                    <div className="flex items-center gap-2 mb-4 shrink-0">
                                                        <Quote size={14} className="text-[#C89B3C]" />
                                                        <span className="text-[12px] font-black tracking-widest text-[#C89B3C] uppercase">Today's Sentence</span>
                                                    </div>

                                                    {/* 💡 [핵심] 중앙 텍스트 영역: 최대 3줄 제한(line-clamp-3) 적용 및 flex-1로 공간 확보 */}
                                                    <div className="relative flex-1 min-h-0 flex flex-col justify-center" onClick={(e) => { e.stopPropagation(); handleSentenceClick(sentence); }}>
                                                        <SmartTruncatedText 
                                                            content={`${sentence.text} ${sentence.page ? `- ${sentence.page}p` : ''}`} 
                                                            textClassName="text-[18px] md:text-[20px] font-serif font-medium leading-[1.6] break-keep tracking-tight text-white drop-shadow-md line-clamp-3"
                                                            wrapQuotes={true}
                                                        />
                                                    </div>

                                                    {/* 하단 책 및 유저 정보 (shrink-0으로 절대 밀려나지 않게 고정) */}
                                                    <div className="flex items-end justify-between w-full mt-4 pt-4 border-t border-white/10 shrink-0">
                                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                                            <FloatingCover src={sentence.cover} className="w-[36px] h-[52px]" iconSize={14} />
                                                            <div className="flex flex-col text-left justify-center min-w-0 pr-2">
                                                                <p className="text-[14px] font-bold text-white mb-0.5 line-clamp-1">{sentence.book}</p>
                                                                <p className="text-[11px] text-[#A0AABF] font-medium mb-1 line-clamp-1">저자 : {cleanAuthorName(sentence.author)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-[12px] text-white/80 font-medium truncate bg-white/5 px-2 py-1 rounded-sm border border-white/10 max-w-[100px]">{sentence.user || 'BnTalker'}</span>
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
                                <div className="w-full h-full flex flex-col items-center justify-center min-h-[250px]">
                                    <Loader2 className="animate-spin text-[#C89B3C]" size={28} />
                                </div>
                            )}
                        </div>

                        {/* 2. 우측 (50%): 유저 리뷰 탭 (한줄평 & 긴줄평) */}
                        <div className="lg:col-span-6 flex flex-col h-full min-h-[280px]">
                            <InsightCard className="flex-1 flex flex-col relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(29,36,51,0.06)] transition-shadow duration-300 !p-6 h-full bg-[#FFFFFF]">
                                <div className="relative z-10 flex flex-col h-full">
                                    
                                    {/* 💡 [네이밍 수정 적용] 리뷰 탭 영역 */}
                                    <div className="flex items-center gap-6 mb-4 shrink-0 border-b border-[#EEF2F7] pb-3">
                                        <button 
                                            onClick={() => { setReviewTab('short'); setRcReviewIndex(0); }} 
                                            className={`text-[13px] font-extrabold tracking-tight transition-all flex items-center gap-1.5 relative pb-1 ${reviewTab === 'short' ? 'text-[#1F3A5F]' : 'text-[#A0AABF] hover:text-[#667085]'}`}
                                        >
                                            <MessageCircle size={14} className={reviewTab === 'short' ? 'text-[#C89B3C]' : ''}/> 한줄평(Short Review)
                                            {reviewTab === 'short' && <span className="absolute bottom-[-13px] left-0 w-full h-[2px] bg-[#1F3A5F] rounded-t-sm" />}
                                        </button>
                                        <button 
                                            onClick={() => { setReviewTab('long'); setLrReviewIndex(0); }} 
                                            className={`text-[13px] font-extrabold tracking-tight transition-all flex items-center gap-1.5 relative pb-1 ${reviewTab === 'long' ? 'text-[#1F3A5F]' : 'text-[#A0AABF] hover:text-[#667085]'}`}
                                        >
                                            <AlignLeft size={14} className={reviewTab === 'long' ? 'text-[#C89B3C]' : ''} /> 긴줄평(Review)
                                            {reviewTab === 'long' && <span className="absolute bottom-[-13px] left-0 w-full h-[2px] bg-[#1F3A5F] rounded-t-sm" />}
                                        </button>
                                    </div>
                                    
                                    {isLoading ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-[#A0AABF] h-full"><Loader2 className="animate-spin text-[#C89B3C] mb-3" size={24} /></div>
                                    ) : (
                                        <>
                                            {/* 탭 1: 한줄평 (Short Review) 렌더링 */}
                                            {reviewTab === 'short' && readersChoice && readersChoice.length > 0 && readersChoice[rcReviewIndex] && (
                                                <div className="flex-1 flex flex-col h-full animate-in fade-in duration-500 min-h-0">
                                                    <div onClick={() => handleSentenceClick({ work_id: readersChoice[rcReviewIndex].work_id, book: readersChoice[rcReviewIndex].title })} className="flex items-center gap-3 mb-4 cursor-pointer shrink-0 group/mini">
                                                        <FloatingCover src={readersChoice[rcReviewIndex].cover} className="w-[32px] h-[46px]" iconSize={14} />
                                                        <div className="flex flex-col justify-center flex-1 min-w-0">
                                                            <div className="flex items-center justify-between w-full">
                                                                <span className="text-[13px] font-bold text-[#1D2433] line-clamp-1 group-hover/mini:text-[#1F3A5F] transition-colors">{readersChoice[rcReviewIndex].title}</span>
                                                                <span className="text-[11px] font-medium text-[#A0AABF] shrink-0 truncate ml-2 max-w-[80px]">{readersChoice[rcReviewIndex].user}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[11px] text-[#667085] line-clamp-1">{cleanAuthorName(readersChoice[rcReviewIndex].author)}</span>
                                                                {readersChoice[rcReviewIndex].rating > 0 && (
                                                                    <div className="flex items-center gap-0.5 text-[#C89B3C]">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star 
                                                                                key={`star-${i}`} 
                                                                                size={10} 
                                                                                fill={i < Math.floor(readersChoice[rcReviewIndex].rating) ? "currentColor" : "none"} 
                                                                                className={i < Math.floor(readersChoice[rcReviewIndex].rating) ? "" : "text-[#EEF2F7]"} 
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* 한줄평 컨텐츠 */}
                                                    <div className="flex-1 relative flex flex-col justify-center bg-[#F7F5F1]/50 rounded-md p-4 border border-[#EEF2F7]">
                                                        <div className="h-full flex flex-col justify-center relative">
                                                            <Quote size={16} className="text-[#C89B3C]/20 absolute -top-1 -left-1" />
                                                            <div className="pl-4 relative z-10 w-full h-full flex items-center">
                                                                <SmartTruncatedText content={readersChoice[rcReviewIndex].text} textClassName="text-[14px] font-medium text-[#1D2433] font-serif" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {readersChoice.length > 1 && (
                                                        <div className="flex items-center justify-center gap-2 mt-4 shrink-0">
                                                            {readersChoice.map((_: any, i: number) => (
                                                                <button key={`rc-dot-${i}`} onClick={() => setRcReviewIndex(i)} className={`h-1.5 rounded-sm transition-all duration-300 ${rcReviewIndex === i ? 'w-4 bg-[#1F3A5F]' : 'w-1.5 bg-[#E7E2D9] hover:bg-[#A0AABF]'}`} />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* 탭 2: 긴줄평 (Long Review) 렌더링 */}
                                            {reviewTab === 'long' && bestLongReviews && bestLongReviews.length > 0 && bestLongReviews[lrReviewIndex] && (
                                                <div className="flex-1 flex flex-col h-full animate-in fade-in duration-500 min-h-0">
                                                    <div onClick={() => handleSentenceClick(bestLongReviews[lrReviewIndex])} className="flex gap-4 cursor-pointer group/mini h-full">
                                                        <div className="w-[80px] shrink-0">
                                                            <FloatingCover src={bestLongReviews[lrReviewIndex].cover} className="w-full aspect-[1/1.45]" iconSize={20} />
                                                            <div className="mt-2 flex justify-center text-[#C89B3C]">
                                                                {[...Array(5)].map((_, i) => <Star key={i} size={8} fill={i < Math.floor(bestLongReviews[lrReviewIndex].rating || 5) ? "currentColor" : "none"} className={i < Math.floor(bestLongReviews[lrReviewIndex].rating || 5) ? "" : "text-[#EEF2F7]"} />)}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                                                            <div>
                                                                <div className="flex items-center justify-between w-full mb-1">
                                                                    <h3 className="text-[14px] font-bold text-[#1D2433] line-clamp-1 group-hover/mini:text-[#1F3A5F] transition-colors">{bestLongReviews[lrReviewIndex].title}</h3>
                                                                    <span className="text-[11px] font-medium text-[#A0AABF] shrink-0 truncate ml-2 max-w-[80px]">{bestLongReviews[lrReviewIndex].user}</span>
                                                                </div>
                                                                <div className="relative mt-2">
                                                                    <Quote size={12} className="text-[#E7E2D9] absolute -top-1 -left-1.5 z-0" />
                                                                    <div className="pl-3 relative z-10 w-full pt-0.5">
                                                                        {/* 긴줄평 텍스트 처리 */}
                                                                        <SmartTruncatedText content={bestLongReviews[lrReviewIndex].text?.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ')} textClassName="text-[13px] leading-[1.6] text-[#667085] font-serif line-clamp-4" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2 flex justify-end shrink-0">
                                                                <span className="text-[11px] font-bold text-[#1F3A5F] flex items-center gap-1 group-hover/mini:translate-x-1 transition-transform">전문 읽기 <ArrowRight size={12} /></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {bestLongReviews.length > 1 && (
                                                        <div className="flex items-center justify-center gap-2 mt-4 shrink-0 border-t border-[#EEF2F7] pt-3">
                                                            {bestLongReviews.map((_: any, i: number) => (
                                                                <button key={`lr-dot-${i}`} onClick={() => setLrReviewIndex(i)} className={`h-1.5 rounded-sm transition-all duration-300 ${lrReviewIndex === i ? 'w-4 bg-[#1F3A5F]' : 'w-1.5 bg-[#E7E2D9] hover:bg-[#A0AABF]'}`} />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* 탭 공통 데이터 없음 Fallback */}
                                            {((reviewTab === 'short' && (!readersChoice || readersChoice.length === 0)) || 
                                              (reviewTab === 'long' && (!bestLongReviews || bestLongReviews.length === 0))) && (
                                                <div className="flex-1 flex flex-col items-center justify-center text-[#A0AABF] gap-2 border border-dashed border-[#EEF2F7] rounded-md bg-[#F7F5F1]/30">
                                                    <MessageCircle className="mb-1 opacity-30" size={24} />
                                                    <span className="text-[12px]">등록된 {reviewTab === 'short' ? '한줄평' : '긴줄평'}이 없습니다.</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </InsightCard>
                        </div>
                    </div>
                </Container>
            </section>

            {/* ============================================================ */}
            {/* 🚀 [NEW] Section 2: 북앤톡 디스커버리 (Netflix형 가로 스크롤 다이어트) */}
            {/* ============================================================ */}
            <section className="w-full mt-[32px]">
                <Container>
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 border-b border-[#E7E2D9] pb-4 gap-4">
                        <div>
                            <span className="text-[12px] font-bold text-[#C89B3C] tracking-widest uppercase mb-2 block">Discovery Hub</span>
                            <h2 className="text-[24px] font-black text-[#1D2433] flex items-center gap-2 tracking-tight">새로운 영감을 발견하세요</h2>
                        </div>

                        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide shrink-0">
                            <button onClick={() => setDiscoveryTab('library')} className={`pb-2 text-[14px] font-bold transition-all relative whitespace-nowrap ${discoveryTab === 'library' ? 'text-[#1F3A5F]' : 'text-[#A0AABF] hover:text-[#667085]'}`}>
                                도서관 인기 대출 {discoveryTab === 'library' && <span className="absolute bottom-[-17px] left-0 w-full h-[2px] bg-[#1F3A5F] rounded-t-sm" />}
                            </button>
                            <button onClick={() => setDiscoveryTab('naver')} className={`pb-2 text-[14px] font-bold transition-all relative whitespace-nowrap ${discoveryTab === 'naver' ? 'text-[#1F3A5F]' : 'text-[#A0AABF] hover:text-[#667085]'}`}>
                                이달의 주목 신간 {discoveryTab === 'naver' && <span className="absolute bottom-[-17px] left-0 w-full h-[2px] bg-[#1F3A5F] rounded-t-sm" />}
                            </button>
                            <button onClick={() => setDiscoveryTab('bntalk')} className={`pb-2 text-[14px] font-bold transition-all relative whitespace-nowrap ${discoveryTab === 'bntalk' ? 'text-[#1F3A5F]' : 'text-[#A0AABF] hover:text-[#667085]'}`}>
                                서재 최신 등록 {discoveryTab === 'bntalk' && <span className="absolute bottom-[-17px] left-0 w-full h-[2px] bg-[#1F3A5F] rounded-t-sm" />}
                            </button>
                        </div>
                    </div>

                    {/* 💡 [핵심] 가로 스크롤(Swipe) 컨테이너: 세로 높이를 1줄로 확 줄임 */}
                    <div className="w-full relative">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-20 h-[240px]"><Loader2 className="animate-spin text-[#1F3A5F]" size={32} /></div>
                        ) : (
                            <div className="flex overflow-x-auto scrollbar-hide gap-4 md:gap-5 pb-4 snap-x snap-mandatory animate-in fade-in duration-500">
                                {(() => {
                                    let activeBooks = [];
                                    if (discoveryTab === 'library') activeBooks = libraryPopular.slice(0, 10);
                                    else if (discoveryTab === 'naver') activeBooks = naverNewArrivals.slice(0, 10);
                                    else activeBooks = newArrivals.slice(0, 10);

                                    if (activeBooks.length === 0) {
                                        return (
                                            <div className="w-full flex flex-col items-center justify-center text-[#A0AABF] font-medium border border-[#E7E2D9] border-dashed rounded-lg bg-white h-[200px]">
                                                <Search className="mb-3 opacity-30" size={32} />
                                                데이터를 수집 중이거나 아직 등록된 책이 없습니다.
                                            </div>
                                        );
                                    }

                                    return activeBooks.map((book, i) => {
                                        const isInternal = discoveryTab === 'bntalk' || !!book.internal_work_id;

                                        return (
                                            <div 
                                                key={`discovery-${i}`} 
                                                onClick={() => {
                                                    if (isInternal) {
                                                        // 1. 우리 사이트에 있는 경우: 광장(상세) 페이지로 이동
                                                        router.push(`/works/${book.internal_work_id || book.work_id}`);
                                                    } else {
                                                        // 2. 없는 경우: 구글 도서 ISBN 검색 결과로 아웃링크 (새 창)
                                                        if (book.isbn) {
                                                            window.open(`https://books.google.co.kr/books?vid=ISBN${book.isbn}`, '_blank', 'noopener,noreferrer');
                                                        } else {
                                                            // ISBN이 없는 예외 케이스는 제목으로 검색
                                                            window.open(`https://www.google.co.kr/search?tbm=bks&q=${encodeURIComponent(book.title)}`, '_blank', 'noopener,noreferrer');
                                                        }
                                                    }
                                                }} 
                                                className="w-[120px] md:w-[150px] shrink-0 snap-start group cursor-pointer flex flex-col relative min-w-0">
                                                
                                                {/* 💡 [수정] 하드코딩된 img 태그를 걷어내고 공통 컴포넌트인 FloatingCover 적용 */}
                                                <div className="relative mb-3 w-full">
                                                    <FloatingCover 
                                                        src={book.cover} 
                                                        className="w-full aspect-[1/1.45]" 
                                                        iconSize={24} 
                                                    />
                                                    
                                                    {/* 서재 연결 배지 (FloatingCover 위에 절대 위치로 띄움) */}
                                                    {isInternal && (
                                                        <div className="absolute top-1.5 right-1.5 bg-[#1F3A5F]/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm flex items-center gap-0.5 z-10 pointer-events-none">
                                                            <BookOpen size={8} /> 서재
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col flex-1 px-0.5">
                                                    <h3 className="font-bold text-[#1D2433] text-[12px] md:text-[13px] leading-snug line-clamp-2 mb-1 group-hover:text-[#C89B3C] transition-colors">{book.title}</h3>
                                                    <p className="text-[10px] md:text-[11px] text-[#667085] line-clamp-1 font-medium">{book.author || book.discoverer}</p>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </div>
                </Container>
            </section>

            {/* ▼ Section 3: 동적 워드 클라우드 & 사색 작가들 ▼ */}
            <section className="w-full mt-[32px]">
                <Container>
                    <div className="mb-6">
                        <span className="text-[12px] font-bold text-[#C89B3C] tracking-widest uppercase mb-1.5 block">Trending Thoughts</span>
                        <h2 className="text-[24px] font-black text-[#1D2433] mb-1.5 tracking-tight">BnTalkers Tag</h2>
                        <p className="text-[#667085] font-medium text-[14px]">많이 읽히는 책보다, 많이 생각되는 주제를 보여줍니다.</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[320px] lg:h-[320px]">
                        
                        {/* Left (60%): 고밀도 팩킹 워드 클라우드 */}
                        <InsightCard className="lg:w-[60%] w-full h-full relative flex items-center justify-center p-2 hover:shadow-[0_8px_30px_rgba(29,36,51,0.06)] transition-shadow overflow-visible">
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
                                <span className="text-[#A0AABF] font-medium text-[15px] text-center border p-4 rounded-md">아직 수집된 사색의 조각이 없습니다.</span>
                            )}
                        </InsightCard>

                        {/* Right (40%): 사색을 유발한 작가들 */}
                        <InsightCard className="lg:w-[40%] w-full h-full flex flex-col !p-5 bg-[#FFFFFF] hover:shadow-[0_8px_30px_rgba(29,36,51,0.06)] transition-shadow">
                            <h3 className="text-[16px] font-extrabold text-[#1D2433] mb-4 flex items-center gap-2 border-b border-[#E7E2D9] pb-3 shrink-0">
                                <PenTool size={16} className="text-[#C89B3C]" />
                                우리를 사색에 잠기게 한 작가들
                            </h3>
                            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pr-1">
                                <div className="grid grid-cols-2 gap-2 pb-1">
                                    {inspiringAuthors && inspiringAuthors.length > 0 ? (
                                        inspiringAuthors.slice(0, 5).map((author, index) => {
                                            const authorId = author?.contributor_id || author?.id;
                                            const authorName = author?.author_name || author?.name || "이름 없는 작가";
                                            const profileImg = author?.author_profile_image || author?.profile_image;
                                            const displayTag = author?.top_keyword || author?.keyword || "#정보없음";

                                            return (
                                                <div 
                                                    key={`author-${authorId || index}`} 
                                                    className="flex items-center gap-2.5 group cursor-pointer p-2 hover:bg-[#F7F5F1] rounded-lg transition-all"
                                                    onClick={() => router.push(`/author/${authorId || ''}`)}
                                                >
                                                    <div className="w-[36px] h-[36px] flex items-center justify-center shrink-0">
                                                        {profileImg ? (
                                                            <img src={profileImg} alt={authorName} className="w-full h-full rounded-full object-cover shadow-sm ring-2 ring-transparent group-hover:ring-[#EEF2F7] transition-all" />
                                                        ) : (
                                                            <div className="w-full h-full rounded-full bg-[#EEF2F7] border border-[#E7E2D9] flex items-center justify-center text-[#A0AABF]"><PenTool size={14} /></div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                                                        <span className="font-bold text-[#1D2433] text-[13px] truncate group-hover:text-[#1F3A5F] transition-colors">{authorName}</span>
                                                        <div className="flex items-center mt-0.5">
                                                            <span className="text-[10px] font-bold text-[#1F3A5F] bg-[#EEF2F7] px-1.5 py-0.5 rounded-sm shrink-0 border border-[#E7E2D9]/50 shadow-sm truncate max-w-full">{displayTag}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="col-span-2 flex flex-col items-center justify-center text-[#A0AABF] text-[13px] text-center border-dashed rounded-md bg-[#F7F5F1] p-4 h-[200px] border">
                                            <PenTool size={20} className="mb-2 opacity-30"/>
                                            아직 수집된 작가 데이터가 없습니다.<br/>서재를 채워주세요.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </InsightCard>
                    </div>
                </Container>
            </section>

            {/* ▼ Section 4: 하단 통계 대시보드 ▼ */}
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