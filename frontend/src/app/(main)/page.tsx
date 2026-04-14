// 경로: frontend/src/app/(main)/page.tsx
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { 
    Quote, MessageCircle, ArrowRight, BookOpen, ChevronRight, 
    ChevronLeft, Star, Loader2, TrendingUp, Flame, HelpCircle, 
    PenTool, Crown, Search, AlignLeft
} from 'lucide-react';

import { useSession, signIn } from "next-auth/react";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import HomeLayout from '@/components/layout/HomeLayout'; // 💡 공통 레이아웃 적용

// 공통 컴포넌트
import { FloatingCover } from '@/components/common/FloatingCover';
import { InsightCard } from '@/components/common/InsightCard';
import { SmartTruncatedText } from '@/components/common/SmartTruncatedText';
import { AuthorAvatar } from '@/components/common/AuthorAvatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; 

// 💡 shadcn/ui 컴포넌트
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const WordCloudChart = dynamic(() => import('@/components/common/WordCloudChart'), { ssr: false });

let memoryCache: any = null;
let cachedCoverIdx = 0;

export default function Home() {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ total_sentences: 0, total_pages: 0, reading_books: 0 });
    
    const [heroSentences, setHeroSentences] = useState<any[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [readersChoice, setReadersChoice] = useState<any>(null); 
    const [bestLongReviews, setBestLongReviews] = useState<any[]>([]); 
    const [rcReviewIndex, setRcReviewIndex] = useState(0); 
    const [lrReviewIndex, setLrReviewIndex] = useState(0); 
    
    const [coverFlowBooks, setCoverFlowBooks] = useState<any[]>([]);
    const [activeCoverflowIndex, setActiveCoverflowIndex] = useState(0);
    const [selectedGenre, setSelectedGenre] = useState<string>('All');
    const [trendingTags, setTrendingTags] = useState<any[]>([]);
    const [inspiringAuthors, setInspiringAuthors] = useState<any[]>([]);

    const [libraryPopular, setLibraryPopular] = useState<any[]>([]);
    const [naverNewArrivals, setNaverNewArrivals] = useState<any[]>([]);
    const [newArrivals, setNewArrivals] = useState<any[]>([]); 

    const dragStartX = useRef<number | null>(null);
    const isDragging = useRef<boolean>(false);
    const isInitialized = useRef<boolean>(false);
   
    const router = useRouter();
    const { data: session, status } = useSession();

    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [selectedBookForModal, setSelectedBookForModal] = useState<any>(null);

    useEffect(() => {
        const savedCoverIndex = sessionStorage.getItem('bnt_coverIndex');
        if (savedCoverIndex !== null) setActiveCoverflowIndex(parseInt(savedCoverIndex, 10));
        isInitialized.current = true;
    }, []);

    useEffect(() => { 
        if (isInitialized.current) {
            sessionStorage.setItem('bnt_coverIndex', activeCoverflowIndex.toString()); 
            cachedCoverIdx = activeCoverflowIndex; 
        }
    }, [activeCoverflowIndex]);

    const cleanAuthorName = (name: string) => {
        if (!name) return '';
        let clean = name.split(',')[0].split('(')[0].split(';')[0].split('|')[0];
        clean = clean.replace(/\s*(장편소설|장소설|소설|지음|옮김|저자|편자|그림|글|지은이|옮긴이)\s*$/g, '');
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
        if (offset !== 0) return;
        const clickedBook = coverFlowBooks[idx];
        if (status === "authenticated") {
            router.push(`/works/${clickedBook.work_id || clickedBook.id}`); 
        } else {
            setSelectedBookForModal(clickedBook);
            setIsGuestModalOpen(true);
        }
    };

    useEffect(() => {
        if (heroSentences.length === 0) return;
        const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % heroSentences.length), 5000);
        return () => clearInterval(timer);
    }, [heroSentences.length]);

    useEffect(() => {
        if (!readersChoice || readersChoice.length <= 1) return;
        const timer = setInterval(() => setRcReviewIndex((prev) => (prev + 1) % readersChoice.length), 5000);
        return () => clearInterval(timer);
    }, [readersChoice]);

    useEffect(() => {
        if (!bestLongReviews || bestLongReviews.length <= 1) return;
        const timer = setInterval(() => setLrReviewIndex((prev) => (prev + 1) % bestLongReviews.length), 5000);
        return () => clearInterval(timer);
    }, [bestLongReviews]);

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

        if (status === "loading") return () => clearTimeout(safetyTimer);

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
        <HomeLayout 
            heroSection={
                isLoading ? (
                    <div className="flex justify-center items-center py-12 h-[380px]">
                        <Loader2 className="animate-spin text-[#1F3A5F]" size={32} />
                    </div>
                ) : coverFlowBooks.length > 0 ? (
                    <div 
                        className="relative w-full h-[380px] flex justify-center items-center cursor-grab active:cursor-grabbing select-none touch-pan-y"
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
                )
            }
        >
            {/* 비로그인 안내 모달 */}
            <Dialog open={isGuestModalOpen} onOpenChange={setIsGuestModalOpen}>
                <DialogContent className="sm:max-w-md bg-white border border-[#E7E2D9] rounded-xl outline-none">
                    <DialogHeader className="mb-2">
                        <DialogTitle className="text-xl font-bold text-[#1F3A5F] text-center truncate">
                            {selectedBookForModal?.title}
                        </DialogTitle>
                        <DialogDescription className="text-[#A0AABF] text-center text-sm truncate">
                            {selectedBookForModal?.author}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center pb-4">
                        <div className="w-[140px] h-[205px] relative rounded-sm overflow-hidden shadow-sm border border-[#E7E2D9]">
                            {selectedBookForModal?.cover ? (
                                <Image src={selectedBookForModal.cover} alt={selectedBookForModal.title} fill className="object-cover" unoptimized draggable={false} />
                            ) : (
                                <div className="w-full h-full bg-[#F7F5F1] flex flex-col items-center justify-center text-xs text-[#A0AABF]">
                                    <BookOpen className="opacity-30 mb-2" size={32} /><span>No Cover</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 text-center">
                            <p className="text-[13px] text-[#4B5E76] font-medium leading-relaxed">
                                로그인하시면 이 책의<br />깊이 있는 리뷰와 사색을 확인할 수 있습니다.
                            </p>
                        </div>
                        <button onClick={() => router.push('/login')} className="mt-5 w-full py-3 bg-[#1F3A5F] text-white rounded-lg text-[14px] font-bold tracking-tight hover:bg-[#1D2433] transition-colors">
                            BoooknTalk 로그인하기
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* A-Z 인덱스 탭 */}
            <div className="w-full overflow-x-auto scrollbar-hide pb-2">
                <div className="flex items-center justify-between w-full border-t border-[#E7E2D9] pt-6 px-1 min-w-max gap-x-1 mb-4">
                    {indexChars.map((char) => (
                        <button key={char} onClick={() => handleIndexClick(char)} className={`flex-shrink-0 transition-all duration-200 text-[10px] md:text-[11px] tracking-tighter font-medium ${selectedGenre === char ? 'text-[#1F3A5F] font-black scale-110 translate-y-[-1px]' : 'text-[#A0AABF] hover:text-[#1D2433] hover:font-bold'}`}>
                            {char}
                        </button>
                    ))}
                </div>
            </div>

            {/* Section 1: 오늘의 문장 & 리뷰 (shadcn Tabs 적용) */}
            <section className="w-full mb-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch lg:h-[300px]">
                    <div className="lg:col-span-6 relative rounded-sm overflow-hidden shadow-sm group bg-[#162335] flex flex-col border border-[#1F3A5F]/20 h-full min-h-[280px]">
                        {heroSentences.length > 0 ? (
                            <>
                                <div className="flex w-full h-full transition-transform duration-700 ease-in-out flex-1" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                                    {heroSentences.map((sentence, idx) => (
                                        <div key={sentence.id || idx} onClick={handleSquareNavigation} className="w-full h-full flex-shrink-0 relative cursor-pointer overflow-hidden flex flex-col">
                                            <div className="absolute inset-0 z-0">
                                                {sentence.cover ? <Image src={sentence.cover} alt="Background" fill className="object-cover blur-[50px] scale-125 opacity-40 mix-blend-overlay" unoptimized /> : <div className="w-full h-full bg-[#162335]"></div>}
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#162335] via-[#162335]/80 to-transparent"></div>
                                            </div>
                                            <div className="relative z-10 flex flex-col w-full h-full p-6 md:p-8">
                                                <div className="flex items-center gap-2 mb-4 shrink-0">
                                                    <Quote size={14} className="text-[#C89B3C]" />
                                                    <span className="text-[12px] font-black tracking-widest text-[#C89B3C] uppercase">Today's Sentence</span>
                                                </div>
                                                <div className="relative flex-1 min-h-0 flex flex-col justify-center" onClick={(e) => { e.stopPropagation(); handleSentenceClick(sentence); }}>
                                                    <SmartTruncatedText content={`${sentence.text} ${sentence.page ? `- ${sentence.page}p` : ''}`} textClassName="text-[18px] md:text-[20px] font-serif font-medium leading-[1.6] break-keep tracking-tight text-white drop-shadow-md line-clamp-3" wrapQuotes={true}/>
                                                </div>
                                                <div className="flex items-end justify-between w-full mt-4 pt-4 border-t border-white/10 shrink-0">
                                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                                        <FloatingCover src={sentence.cover} className="w-[36px] h-[52px]" iconSize={14} />
                                                        <div className="flex flex-col text-left justify-center min-w-0 pr-2">
                                                            <p className="text-[14px] font-bold text-white mb-0.5 line-clamp-1">{sentence.book}</p>
                                                            <p className="text-[11px] text-[#A0AABF] font-medium mb-1 line-clamp-1">저자 : {cleanAuthorName(sentence.author)}</p>
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
                            <div className="w-full h-full flex flex-col items-center justify-center"><Loader2 className="animate-spin text-[#C89B3C]" size={28} /></div>
                        )}
                    </div>

                    <Card className="lg:col-span-6 h-full flex flex-col border-[#EEF2F7] shadow-sm rounded-sm">
                        <CardContent className="p-6 h-full flex flex-col">
                            <Tabs defaultValue="short" className="w-full h-full flex flex-col">
                                <TabsList className="bg-transparent border-b border-[#EEF2F7] w-full justify-start rounded-none p-0 h-auto mb-4">
                                    <TabsTrigger value="short" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1F3A5F] data-[state=active]:text-[#1F3A5F] rounded-none px-4 pb-2 bg-transparent shadow-none text-[13px] font-extrabold text-[#A0AABF]">
                                        <MessageCircle size={14} className="mr-1.5" /> 한줄평
                                    </TabsTrigger>
                                    <TabsTrigger value="long" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1F3A5F] data-[state=active]:text-[#1F3A5F] rounded-none px-4 pb-2 bg-transparent shadow-none text-[13px] font-extrabold text-[#A0AABF]">
                                        <AlignLeft size={14} className="mr-1.5" /> 긴줄평
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="short" className="flex-1 mt-0 outline-none flex flex-col min-h-0">
                                    {readersChoice && readersChoice.length > 0 && readersChoice[rcReviewIndex] ? (
                                        <div className="flex-1 flex flex-col h-full animate-in fade-in duration-500">
                                            <div onClick={() => handleSentenceClick({ work_id: readersChoice[rcReviewIndex].work_id, book: readersChoice[rcReviewIndex].title })} className="flex items-center gap-3 mb-4 cursor-pointer shrink-0 group/mini">
                                                <FloatingCover src={readersChoice[rcReviewIndex].cover} className="w-[32px] h-[46px]" iconSize={14} />
                                                <div className="flex flex-col justify-center flex-1 min-w-0">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="text-[13px] font-bold text-[#1D2433] line-clamp-1">{readersChoice[rcReviewIndex].title}</span>
                                                        <span className="text-[11px] font-medium text-[#A0AABF]">{readersChoice[rcReviewIndex].user}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 relative flex flex-col justify-center bg-[#F7F5F1]/50 rounded-md p-4 border border-[#EEF2F7]">
                                                <div className="pl-4 relative z-10 w-full h-full flex items-center">
                                                    <Quote size={16} className="text-[#C89B3C]/20 absolute -top-1 -left-4" />
                                                    <SmartTruncatedText content={readersChoice[rcReviewIndex].text} textClassName="text-[14px] font-medium text-[#1D2433] font-serif" />
                                                </div>
                                            </div>
                                            <div className="flex justify-center gap-2 mt-4 shrink-0">
                                                {readersChoice.map((_: any, i: number) => (
                                                    <button key={i} onClick={() => setRcReviewIndex(i)} className={`h-1.5 rounded-sm ${rcReviewIndex === i ? 'w-4 bg-[#1F3A5F]' : 'w-1.5 bg-[#E7E2D9]'}`} />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-[#A0AABF] text-[12px]"><Loader2 className="animate-spin mb-2"/>한줄평 로딩중...</div>
                                    )}
                                </TabsContent>

                                <TabsContent value="long" className="flex-1 mt-0 outline-none flex flex-col min-h-0">
                                    {bestLongReviews && bestLongReviews.length > 0 && bestLongReviews[lrReviewIndex] ? (
                                        <div className="flex-1 flex flex-col h-full animate-in fade-in duration-500">
                                            <div onClick={() => handleSentenceClick(bestLongReviews[lrReviewIndex])} className="flex gap-4 cursor-pointer h-full">
                                                <div className="w-[80px] shrink-0">
                                                    <FloatingCover src={bestLongReviews[lrReviewIndex].cover} className="w-full aspect-[1/1.45]" iconSize={20} />
                                                </div>
                                                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                                                    <h3 className="text-[14px] font-bold text-[#1D2433] line-clamp-1">{bestLongReviews[lrReviewIndex].title}</h3>
                                                    <SmartTruncatedText content={bestLongReviews[lrReviewIndex].text?.replace(/<[^>]*>?/gm, '')} textClassName="text-[13px] leading-[1.6] text-[#667085] font-serif line-clamp-4 mt-2" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-[#A0AABF] text-[12px]"><Loader2 className="animate-spin mb-2"/>긴줄평 로딩중...</div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Section 2: 디스커버리 허브 (shadcn Tabs) */}
            <section className="w-full mb-10">
                <Tabs defaultValue="library" className="w-full">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 border-b border-[#E7E2D9] pb-4 gap-4">
                        <div>
                            <span className="text-[12px] font-bold text-[#C89B3C] tracking-widest uppercase mb-2 block">Discovery Hub</span>
                            <h2 className="text-[24px] font-black text-[#1D2433]">새로운 영감을 발견하세요</h2>
                        </div>
                        <TabsList className="bg-transparent p-0 h-auto gap-6 justify-start">
                            <TabsTrigger value="library" className="p-0 pb-2 bg-transparent shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#1F3A5F] data-[state=active]:text-[#1F3A5F] text-[14px] font-bold text-[#A0AABF]">도서관 인기 대출</TabsTrigger>
                            <TabsTrigger value="naver" className="p-0 pb-2 bg-transparent shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#1F3A5F] data-[state=active]:text-[#1F3A5F] text-[14px] font-bold text-[#A0AABF]">이달의 주목 신간</TabsTrigger>
                            <TabsTrigger value="bntalk" className="p-0 pb-2 bg-transparent shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#1F3A5F] data-[state=active]:text-[#1F3A5F] text-[14px] font-bold text-[#A0AABF]">서재 최신 등록</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="w-full relative">
                        <TabsContent value="library" className="mt-0 flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                            {libraryPopular.map((book, i) => (
                                <div key={i} className="w-[120px] shrink-0 cursor-pointer" onClick={() => window.open(`https://books.google.co.kr/books?vid=ISBN${book.isbn}`, '_blank')}>
                                    <FloatingCover src={book.cover} className="w-full aspect-[1/1.45] mb-2" iconSize={24} />
                                    <h3 className="font-bold text-[12px] line-clamp-2">{book.title}</h3>
                                </div>
                            ))}
                        </TabsContent>
                        <TabsContent value="naver" className="mt-0 flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                            {naverNewArrivals.map((book, i) => (
                                <div key={i} className="w-[120px] shrink-0 cursor-pointer" onClick={() => window.open(`https://www.google.co.kr/search?tbm=bks&q=${encodeURIComponent(book.title)}`, '_blank')}>
                                    <FloatingCover src={book.cover} className="w-full aspect-[1/1.45] mb-2" iconSize={24} />
                                    <h3 className="font-bold text-[12px] line-clamp-2">{book.title}</h3>
                                </div>
                            ))}
                        </TabsContent>
                        <TabsContent value="bntalk" className="mt-0 flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                            {newArrivals.map((book, i) => (
                                <div key={i} className="w-[120px] shrink-0 cursor-pointer" onClick={() => router.push(`/works/${book.internal_work_id || book.work_id}`)}>
                                    <FloatingCover src={book.cover} className="w-full aspect-[1/1.45] mb-2" iconSize={24} />
                                    <h3 className="font-bold text-[12px] line-clamp-2">{book.title}</h3>
                                </div>
                            ))}
                        </TabsContent>
                    </div>
                </Tabs>
            </section>

            {/* Section 4: 하단 통계 대시보드 */}
            <section className="w-full">
                <Card className="border-[#EEF2F7] shadow-sm rounded-sm">
                    <CardContent className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center justify-center text-center md:border-r border-[#EEF2F7]">
                            <span className="text-[13px] font-bold text-[#667085] tracking-widest uppercase mb-3">누적 사색 기록</span>
                            <span className="text-[36px] font-black text-[#1D2433]">{stats.total_sentences.toLocaleString()}<span className="text-[16px] ml-1">개</span></span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center md:border-r border-[#EEF2F7]">
                            <span className="text-[13px] font-bold text-[#667085] tracking-widest uppercase mb-3">이번 주 넘긴 페이지</span>
                            <span className="text-[36px] font-black text-[#1F3A5F]">{stats.total_pages.toLocaleString()}<span className="text-[16px] ml-1">p</span></span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center">
                            <span className="text-[13px] font-bold text-[#667085] tracking-widest uppercase mb-3">현재 함께 읽는 책</span>
                            <span className="text-[36px] font-black text-[#1D2433]">{stats.reading_books.toLocaleString()}<span className="text-[16px] ml-1">권</span></span>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </HomeLayout>
    );
}