// 경로: frontend/src/app/[(main)]/page.tsx
// 역할 및 기능: BoooknTalk 비로그인(Guest) 사용자 및 전체 사용자를 위한 메인 랜딩 페이지. 
// 각종 추천 도서, 오늘의 독서노트, 독자의 한줄평, 매거진 형태의 긴줄평, 실시간 UGC 피드를 종합적으로 렌더링합니다.

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Quote, MessageCircle, ArrowRight, BookOpen, Hash, Sparkles, ChevronRight, ChevronLeft, Star, Loader2, TrendingUp, Layers } from 'lucide-react';
import Container from '@/components/layout/Container';
import Footer from '@/components/layout/Footer';
import { useSession, signIn } from "next-auth/react";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// 전역 메모리 캐시
let memoryCache: any = null;
let cachedCoverIdx = 0;
let cachedArrivalsIdx = 0;

export default function Home() {
    // 1. 상태 관리
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

    // 컴포넌트 내부 상태 추가 (피드별 좋아요 상태 관리)
    const [likedFeeds, setLikedFeeds] = useState<Record<string, boolean>>({});

    const dragStartX = useRef<number | null>(null);
    const isDragging = useRef<boolean>(false);
    const isInitialized = useRef<boolean>(false);
   
    const { data: session } = useSession();
    const router = useRouter();

    // 2. 뒤로가기 복원 로직
    useEffect(() => {
        const savedCoverIndex = sessionStorage.getItem('bnt_coverIndex');
        const savedArrivalsIndex = sessionStorage.getItem('bnt_arrivalsIndex');
        
        if (savedCoverIndex !== null) setActiveCoverflowIndex(parseInt(savedCoverIndex, 10));
        if (savedArrivalsIndex !== null) setArrivalsIndex(parseInt(savedArrivalsIndex, 10));
        
        if (memoryCache) {
            setStats(memoryCache.stats);
            setUgcFeeds(memoryCache.ugcFeeds);
            setNewArrivals(memoryCache.newArrivals);
            setHeroSentences(memoryCache.heroSentences);
            setReadersChoice(memoryCache.readersChoice);
            setCoverFlowBooks(memoryCache.coverFlowBooks);

            setActiveCoverflowIndex(cachedCoverIdx);
            setArrivalsIndex(cachedArrivalsIdx);
            
            setIsLoading(false);
        }
        isInitialized.current = true;
    }, []);

    useEffect(() => { if (isInitialized.current) sessionStorage.setItem('bnt_coverIndex', activeCoverflowIndex.toString()); cachedCoverIdx = activeCoverflowIndex; }, [activeCoverflowIndex]);
    useEffect(() => { if (isInitialized.current) sessionStorage.setItem('bnt_arrivalsIndex', arrivalsIndex.toString()); cachedArrivalsIdx = arrivalsIndex; }, [arrivalsIndex]);

    /**
     * 한글 초성 및 첫 글자 추출 함수
     * 기능: 도서 제목의 첫 글자를 분석하여 인덱싱을 위한 초성(또는 알파벳)을 반환합니다.
     */
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
            if (map[initial] === undefined) {
                map[initial] = idx;
            }
        });
        return map;
    }, [coverFlowBooks]);

    /**
     * 인덱스 클릭 핸들러
     * 기능: 인덱스 바의 초성을 클릭했을 때 해당 초성으로 시작하는 첫 번째 도서로 커버 플로우를 이동시킵니다.
     */
    const handleIndexClick = (char: string) => {
        setSelectedGenre(char);
        if (char === 'All') {
            setActiveCoverflowIndex(0); 
            return;
        }
        
        const targetIdx = indexMap[char];
        if (targetIdx !== undefined) {
            setActiveCoverflowIndex(targetIdx); 
        } else {
            toast(`'${char}'(으)로 시작하는 책이 아직 없습니다.`, { duration: 2000 });
        }
    };

    // 4. 일반 클릭 핸들러
    const handleCardClick = (searchKeyword: string) => {
        if (!session) {
            toast('로그인이 필요해요', { action: { label: '로그인', onClick: () => signIn('google') }, duration: 5000 });
            return;
        }
        router.push(`/search?q=${encodeURIComponent(searchKeyword)}`);
    };

    const handleSentenceClick = (item: any) => {
        if (!session) {
            toast('로그인이 필요해요', { action: { label: '로그인', onClick: () => signIn('google') }, duration: 5000 });
            return;
        }
        if (item.work_id) {
            router.push(`/works/${item.work_id}`);
        } else {
            router.push(`/search?q=${encodeURIComponent(item.book || '')}`);
        }
    };

    const handleSquareNavigation = () => {
        if (!session) {
            toast('로그인이 필요해요', { action: { label: '로그인', onClick: () => signIn('google') }, duration: 5000 });
            return;
        }
        router.push('/square');
    };

    // 5. 커버 플로우 핸들러
    const handlePointerDown = (clientX: number) => {
        dragStartX.current = clientX;
        isDragging.current = false;
    };

    const handlePointerMove = (clientX: number) => {
        if (dragStartX.current !== null && Math.abs(dragStartX.current - clientX) > 10) {
            isDragging.current = true;
        }
    };

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

    /**
     * 피드 공감 핸들러
     * 기능: 실시간 피드 카드의 '공감' 버튼 클릭 시 좋아요 상태를 토글하고 API를 호출합니다.
     */
    const handleLikeClick = async (e: React.MouseEvent, feedId: string) => {
        e.stopPropagation(); 
        
        if (!session) {
            toast('로그인이 필요해요', { 
                action: { label: '로그인', onClick: () => signIn('google') },
                duration: 3000 
            });
            return;
        }

        setLikedFeeds(prev => ({ ...prev, [feedId]: !prev[feedId] }));

        try {
            await fetch(`http://localhost:8000/api/feeds/${feedId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_email: session.user?.email })
            });
        } catch (error) {
            console.error("공감 처리 실패:", error);
            setLikedFeeds(prev => ({ ...prev, [feedId]: !prev[feedId] }));
        }
    };

    // 6. 신규 도서 무한 순환
    const nextArrivals = () => {
        if (newArrivals.length === 0) return;
        setArrivalsIndex((prev) => (prev + 1) % newArrivals.length);
    };

    const prevArrivals = () => {
        if (newArrivals.length === 0) return;
        setArrivalsIndex((prev) => (prev - 1 + newArrivals.length) % newArrivals.length);
    };

    const visibleArrivals = [];
    if (newArrivals.length > 0) {
        for (let i = 0; i < Math.min(10, newArrivals.length); i++) {
            visibleArrivals.push(newArrivals[(arrivalsIndex + i) % newArrivals.length]);
        }
    }

    // 7. Effects
    useEffect(() => {
        if (heroSentences.length === 0) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSentences.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [heroSentences.length]);

    useEffect(() => {
        if (!readersChoice || readersChoice.length <= 1) return;
        const timer = setInterval(() => {
            setRcReviewIndex((prev) => (prev + 1) % readersChoice.length);
        }, 4500);
        return () => clearInterval(timer);
    }, [readersChoice]);

    useEffect(() => {
        const fetchHomeData = async () => {
            if (memoryCache && memoryCache.sessionEmail === (session?.user?.email || null)) return; 

            setIsLoading(true);
            try {
                const emailQuery = session?.user?.email ? `?user_email=${encodeURIComponent(session.user.email)}` : '';
                
                const [statsRes, ugcRes, arrivalsRes, sentencesRes, rcRes, coverFlowRes, longReviewsRes] = await Promise.all([
                    fetch('http://localhost:8000/api/home/stats'),
                    fetch('http://localhost:8000/api/home/recent-ugc?limit=6'),
                    fetch('http://localhost:8000/api/home/new-arrivals?days=3'),
                    fetch(`http://localhost:8000/api/home/today-sentences${emailQuery}`),
                    fetch('http://localhost:8000/api/home/readers-choice'),
                    fetch('http://localhost:8000/api/home/cover-flow-books'),
                    fetch('http://localhost:8000/api/home/best-long-reviews')
                ]);

                const newData = {
                    stats: statsRes.ok ? await statsRes.json() : stats,
                    ugcFeeds: ugcRes.ok ? await ugcRes.json() : [],
                    newArrivals: arrivalsRes.ok ? await arrivalsRes.json() : [],
                    heroSentences: sentencesRes.ok ? await sentencesRes.json() : [],
                    readersChoice: rcRes.ok ? await rcRes.json() : null,
                    coverFlowBooks: coverFlowRes.ok ? await coverFlowRes.json() : [],
                    bestLongReviews: longReviewsRes.ok ? await longReviewsRes.json() : [],
                    sessionEmail: session?.user?.email || null
                };

                setStats(newData.stats);
                setUgcFeeds(newData.ugcFeeds);
                setNewArrivals(newData.newArrivals);
                setHeroSentences(newData.heroSentences);
                setReadersChoice(newData.readersChoice);
                setCoverFlowBooks(newData.coverFlowBooks);
                setBestLongReviews(newData.bestLongReviews);
                
                memoryCache = newData;
            } catch (error) {
                console.error("홈 데이터 로딩 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHomeData();
    }, [session]);

    const wordCloudTags = [
        { text: '#인생책', style: 'text-[26px] font-black text-[#0066cc]' },
        { text: '#깊은여운', style: 'text-[18px] font-bold text-gray-700' },
        { text: '#위로가필요할때', style: 'text-[15px] font-medium text-teal-600' },
        { text: '#통찰력', style: 'text-[22px] font-extrabold text-[#1d1d1f]' },
        { text: '#주말밤에', style: 'text-[14px] font-semibold text-gray-400' },
        { text: '#앉은자리에서완독', style: 'text-[17px] font-bold text-indigo-500' },
        { text: '#생각의전환', style: 'text-[20px] font-black text-rose-500' },
        { text: '#철학적인', style: 'text-[16px] font-medium text-amber-600' }
    ];

    const indexChars = ['All', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'];

    // 8. Render
    return (
        <div className="w-full h-full overflow-y-auto bg-[#F5F5F7] scrollbar-hide flex flex-col">
            
            {/* ▼ Section 0: 인덱스 커버 플로우 ▼ */}
            <section className="w-full pt-[var(--spacing-1cm,32px)]">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12 h-[380px]">
                        <Loader2 className="animate-spin text-[#0066cc]" size={32} />
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

                            if (offset === 0) {
                                transform = 'translateX(0) scale(1.1) translateZ(50px)';
                            } else if (offset < 0) {
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
                                    className="absolute transition-all duration-500 ease-out shadow-2xl rounded-xl group cursor-pointer"
                                    style={{ 
                                        transform, zIndex, opacity, width: '200px', height: '290px',
                                        pointerEvents: absOffset > 6 ? 'none' : 'auto' 
                                    }}
                                >
                                    <div className="w-full h-full relative rounded-xl overflow-hidden border border-black/5 bg-white select-none">
                                        {book.cover ? (
                                            <Image src={book.cover} alt={book.title} fill className="object-cover" unoptimized draggable={false} />
                                        ) : (
                                            <div className="w-full h-full bg-[#F5F5F7] flex flex-col items-center justify-center text-xs text-gray-400">
                                                <BookOpen className="opacity-20 mb-2" size={32} />
                                                <span>No Cover</span>
                                            </div>
                                        )}
                                        <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 transition-opacity duration-300 ${offset === 0 ? 'opacity-100' : 'opacity-0'}`}>
                                            <h3 className="font-bold text-white text-[15px] truncate mb-1">{book.title}</h3>
                                            <p className="text-[12px] text-gray-300 truncate mb-2">{book.author}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-gray-400 text-center py-20 font-medium h-[380px] flex items-center justify-center">등록된 책이 없습니다.</div>
                )}

                <Container>
                    <div className="w-full overflow-x-auto scrollbar-hide mt-0 pb-2 max-w-4xl mx-auto">
                        <div className="flex items-center justify-between w-full border-t border-gray-100 pt-6 px-1 min-w-max gap-x-1">
                            {indexChars.map((char) => (
                                <button 
                                    key={char} 
                                    onClick={() => handleIndexClick(char)}
                                    className={`
                                        flex-shrink-0 transition-all duration-200 
                                        text-[10px] md:text-[11px] tracking-tighter font-medium
                                        ${selectedGenre === char 
                                            ? 'text-[#0066cc] font-black scale-110 translate-y-[-1px]' 
                                            : 'text-gray-400 hover:text-[#1d1d1f] hover:font-bold'
                                        }
                                    `}
                                    style={{ fontFamily: '"Inter", "Pretendard", -apple-system, sans-serif' }}
                                >
                                    {char}
                                </button>
                            ))}
                        </div>
                    </div>
                </Container>
            </section>

            {/* ▼ Section 1: 오늘의 독서노트 & 독자의 한줄평 ▼ */}
            <section className="w-full pt-[var(--spacing-1cm,32px)]">
                <Container>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--spacing-1cm,32px)] items-stretch h-auto lg:min-h-[190px]">
                        
                        {/* 좌측: 오늘의 독서노트 (8비율) */}
                        <div className="lg:col-span-8 relative rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] group bg-[#1A2332] flex flex-col">
                            {heroSentences.length > 0 ? (
                                <>
                                    <div className="flex w-full h-full transition-transform duration-700 ease-in-out flex-1" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                                        {heroSentences.map((sentence, idx) => (
                                            <div key={sentence.id || idx} onClick={handleSquareNavigation} className="w-full h-full flex-shrink-0 relative cursor-pointer overflow-hidden flex flex-col">
                                                <div className="absolute inset-0 z-0">
                                                    {sentence.cover ? <Image src={sentence.cover} alt="Background" fill className="object-cover blur-[40px] scale-125 opacity-100" unoptimized /> : <div className="w-full h-full bg-[#1A2332]"></div>}
                                                    <div className="absolute inset-0 bg-[#1A2332]/50 bg-gradient-to-t from-[#1A2332]/90 via-[#1A2332]/40 to-transparent"></div>
                                                </div>
                                                <div className="relative z-10 flex flex-col justify-between w-full h-full p-5 md:p-6">
                                                    {/* 상단: 타이틀 및 독서노트 본문 */}
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <Quote size={16} className="text-[#D4AF37]" />
                                                            <span className="text-[14px] md:text-[16px] font-black tracking-[0.15em] text-[#D4AF37] uppercase">
                                                                Today's Sentence
                                                            </span>
                                                        </div>
                                                        <div className="relative" onClick={(e) => { e.stopPropagation(); handleSentenceClick(sentence); }}>
                                                            {/* 닉네임이 빠져서 원래의 타이트한 높이를 회복한 본문 */}
                                                            <h2 className="text-[18px] md:text-[20px] font-medium leading-[1.6] break-keep tracking-tight text-[#FDFBF7] text-left pr-4 drop-shadow-md h-[86px] md:h-[96px] overflow-hidden">
                                                                "{sentence.text && sentence.text.length > 90 
                                                                    ? sentence.text.slice(0, 90) + '...' 
                                                                    : sentence.text}" 
                                                                {sentence.page ? <span className="text-[#D4AF37] text-[15px] ml-2 font-bold opacity-90">- {sentence.page}p</span> : ''}
                                                            </h2>
                                                        </div>
                                                    </div>

                                                    {/* 하단: 책 정보(좌) & 닉네임 뱃지 및 이동 버튼(우) 수평 정렬! */}
                                                    <div className="flex items-end justify-between w-full mt-auto pt-2">
                                                        
                                                        {/* 좌측: 책 표지, 제목, 저자, 평점 */}
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-[36px] h-[52px] relative rounded-md overflow-hidden shadow-sm border border-white/10 shrink-0">
                                                                {sentence.cover ? <Image src={sentence.cover} alt="Cover" fill className="object-cover" unoptimized /> : <div className="w-full h-full bg-white/20" />}
                                                            </div>
                                                            <div className="flex flex-col text-left justify-center">
                                                                <p className="text-[14px] font-bold text-[#FDFBF7] mb-0.5 drop-shadow-md line-clamp-1">{sentence.book}</p>
                                                                <p className="text-[11px] text-gray-300 font-medium mb-1 drop-shadow-md line-clamp-1">저자 : {sentence.author}</p>
                                                                <div className="flex items-center gap-1">
                                                                    <div className="flex text-[#D4AF37]"><Star size={10} fill="currentColor" /></div>
                                                                    <span className="text-[10px] text-[#D4AF37] font-bold">전체 평점: 4.8</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* 우측: 닉네임 뱃지 + 화살표 버튼 */}
                                                        <div className="flex items-center gap-2 md:gap-3 shrink-0">
                                                            {/* 모바일 텍스트 깨짐 방지를 위해 max-w 조정 */}
                                                            <div className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-md border border-white/10 shadow-sm">
                                                                <span className="text-[#D4AF37] text-[10px] font-black tracking-widest uppercase">By</span>
                                                                <span className="text-[11px] md:text-[12px] text-gray-200 font-medium max-w-[60px] md:max-w-[100px] truncate">
                                                                    {sentence.user || 'BnTalker'}
                                                                </span>
                                                            </div>
                                                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex shrink-0 items-center justify-center transition-all duration-300 border border-[#D4AF37]/50 group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37]">
                                                                <ArrowRight size={14} className="text-[#D4AF37] group-hover:text-white transition-colors" />
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {heroSentences.length > 1 && (
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                                            {heroSentences.map((_, idx) => (
                                                <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }} className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-5 bg-[#D4AF37]' : 'w-1.5 bg-white/30'}`} />
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center min-h-[190px]">
                                    <Loader2 className="animate-spin text-[#D4AF37] mb-4" size={24} />
                                </div>
                            )}
                        </div>

                        {/* 우측: 독자의 한줄평 (4비율) */}
                        <div className="lg:col-span-4 flex flex-col h-full min-h-[190px]">
                            <div className="flex-1 bg-[#FDFBF7] rounded-[24px] p-5 md:p-6 border border-[#EAE6DF] shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden group">
                                <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl group-hover:bg-[#D4AF37]/15 transition-colors duration-500 z-0"></div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <MessageCircle size={14} className="text-[#D4AF37]" />
                                            <span className="text-[11px] font-extrabold text-[#D4AF37] tracking-widest">독자의 한줄평</span>
                                        </div>
                                        {!isLoading && readersChoice && readersChoice.length > 0 && (
                                            <div key={`user-${rcReviewIndex}`} className="animate-in fade-in duration-500 flex items-center gap-1.5 text-right">
                                                <span className="text-[11px] font-bold text-[#95A5A6] truncate max-w-[160px]">
                                                    {readersChoice[rcReviewIndex].user} 님의 한줄평
                                                </span>
                                                {readersChoice[rcReviewIndex].rating > 0 && (
                                                    <div className="flex items-center gap-0.5 text-[#D4AF37]">
                                                        <Star size={10} fill="currentColor" />
                                                        <span className="text-[10px] font-bold">{readersChoice[rcReviewIndex].rating}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {isLoading ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 h-full min-h-[120px]">
                                            <Loader2 className="animate-spin text-[#D4AF37] mb-3" size={24} />
                                            <span className="text-[12px] font-medium">한줄평을 불러오는 중...</span>
                                        </div>
                                    ) : readersChoice && readersChoice.length > 0 ? (
                                        <>
                                            <div key={`book-${rcReviewIndex}`} onClick={() => handleSentenceClick({ work_id: readersChoice[rcReviewIndex].work_id, book: readersChoice[rcReviewIndex].title })} className="animate-in fade-in duration-500 flex items-center gap-3 mb-3 pb-3 border-b border-[#EAE6DF] cursor-pointer shrink-0">
                                                <div className="w-[32px] h-[48px] relative rounded shadow-sm overflow-hidden shrink-0 border border-black/5 bg-gray-50">
                                                    {readersChoice[rcReviewIndex].cover ? <Image src={readersChoice[rcReviewIndex].cover} alt="Cover" fill className="object-cover" unoptimized /> : <BookOpen size={16} className="text-gray-300 m-auto h-full flex items-center" />}
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <span className="text-[13px] font-bold text-[#1A2332] line-clamp-1 hover:text-[#D4AF37] transition-colors">{readersChoice[rcReviewIndex].title}</span>
                                                    <span className="text-[11px] text-[#95A5A6] line-clamp-1 mt-0.5">{readersChoice[rcReviewIndex].author}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 relative flex flex-col justify-center">
                                                <div key={`text-${rcReviewIndex}`} className="animate-in fade-in duration-500 h-full flex flex-col justify-center">
                                                    <div className="relative">
                                                        <Quote size={14} className="text-[#D4AF37]/20 absolute -top-1 -left-1" />
                                                        <h3 className="text-[14px] font-medium text-[#1A2332] leading-relaxed line-clamp-2 relative z-10 pl-3 break-keep font-serif">
                                                            {readersChoice[rcReviewIndex].text}
                                                        </h3>
                                                    </div>
                                                </div>
                                            </div>
                                            {readersChoice.length > 1 && (
                                                <div className="flex items-center justify-center gap-1.5 mt-2 shrink-0">
                                                    {readersChoice.map((_: any, i: number) => (
                                                        <button key={i} onClick={() => setRcReviewIndex(i)} className={`h-1 rounded-full transition-all duration-300 ${rcReviewIndex === i ? 'w-3 bg-[#D4AF37]' : 'w-1 bg-[#EAE6DF] hover:bg-gray-300'}`} />
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 h-full min-h-[120px]">
                                            <MessageCircle className="mb-2 opacity-20" size={24} />
                                            <span className="text-[12px]">등록된 한줄평이 없습니다.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>

            {/* ▼ Section 1.5: BnTalkers의 긴줄평 ▼ */}
            <section className="w-full mt-[var(--spacing-1cm,48px)]">
                <Container>
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <h2 className="text-[22px] font-extrabold text-[#1d1d1f] flex items-center gap-2">
                                <Layers className="text-[#0066cc]" size={20} /> BnTalkers의 긴줄평
                            </h2>
                            <p className="text-[14px] text-gray-500 mt-1 font-medium">BnTalkers가 정성껏 남긴 깊이 있는 리뷰</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {bestLongReviews.map((review, idx) => (
                            <div 
                                key={review.id || idx} 
                                onClick={() => handleSentenceClick(review)} 
                                className="group cursor-pointer bg-white rounded-[24px] p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-500 flex gap-5"
                            >
                                <div className="w-[100px] shrink-0">
                                    <div className="relative aspect-[1/1.45] rounded-lg overflow-hidden shadow-sm group-hover:-translate-y-1 transition-transform duration-300 border border-gray-100 bg-gray-50 flex items-center justify-center">
                                        {review.cover ? (
                                            <Image src={review.cover} alt={review.title} fill className="object-cover" unoptimized />
                                        ) : (
                                            <BookOpen size={24} className="text-gray-300" />
                                        )}
                                    </div>
                                    <div className="mt-3 flex justify-center text-[#FFCC00]">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={12} fill={i < Math.floor(review.rating || 5) ? "currentColor" : "none"} className={i < Math.floor(review.rating || 5) ? "" : "text-gray-200"} />
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="mb-2">
                                            <h3 className="text-[16px] font-bold text-[#1d1d1f] line-clamp-1 group-hover:text-[#0066cc] transition-colors">
                                                {review.title}
                                            </h3>
                                            <p className="text-[11px] text-gray-400 mt-0.5">by {review.user}</p>
                                        </div>
                                        <div className="relative mt-2">
                                            <Quote size={14} className="text-gray-100 absolute -top-1 -left-2 z-0" />
                                            {/* HTML 태그 제거 및 스페이스바 정제 로직 포함 */}
                                            <p className="text-[13px] leading-[1.7] text-gray-600 line-clamp-3 break-keep relative z-10 pl-2 font-serif">
                                                {review.text?.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-400">
                                            {/* 하이드레이션 에러 방지를 위한 split 포맷팅 */}
                                            {review.created_at ? review.created_at.split('T')[0] : '최근'}
                                        </span>
                                        <span className="text-[11px] font-bold text-[#0066cc] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            긴줄평 읽기 <ArrowRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            {/* ▼ Section 2: 실시간 독서노트와 한줄평 (Grid 피드) ▼ */}
            <section className="w-full mt-[var(--spacing-1cm,48px)]">
                <Container> 
                    <div className="mb-6 flex justify-between items-end">
                        <div>
                            <h2 className="text-[22px] font-extrabold text-[#1d1d1f] flex items-center gap-2">
                                <Sparkles className="text-[#0066cc]" size={20} /> 실시간 독서노트와 한줄평
                            </h2>
                            <p className="text-[14px] text-gray-500 mt-1 font-medium">BnTalkers가 방금 남긴 짙은 여운들</p>
                        </div>
                        <button 
                            onClick={handleSquareNavigation}
                            className="text-[13px] font-bold text-gray-400 hover:text-[#0066cc] flex items-center transition-colors"
                        >
                            광장 가기 <ChevronRight size={14} />
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="animate-spin text-[#0066cc]" size={32} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
                            {ugcFeeds.map((feed) => (
                                <div 
                                    key={feed.id} 
                                    onClick={() => handleSentenceClick(feed)}
                                    className="w-full aspect-square rounded-[20px] p-5 border border-gray-200/60 shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer flex flex-col justify-between relative overflow-hidden group bg-white"
                                >
                                    <div className="absolute inset-0 z-0 bg-gray-50">
                                        {feed.cover ? (
                                            <>
                                                <Image 
                                                    src={feed.cover} 
                                                    alt="Background Cover"
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover:scale-110 blur-[2px]" 
                                                    unoptimized 
                                                />
                                                <div className="absolute inset-0 bg-white/85 backdrop-blur-[1px] transition-colors duration-500 group-hover:bg-white/70" />
                                            </>
                                        ) : (
                                            <div className="w-full h-full bg-[#f5f5f7]" />
                                        )}
                                    </div>

                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div>
                                            {/* [NEW] 직관적인 타입 구분 뱃지 및 별점 영역 */}
                                            <div className="flex items-center justify-between mb-2.5">
                                                {feed.type === 'sentence' ? (
                                                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black tracking-widest bg-[#eaf4fd] text-[#0066cc] border border-[#0066cc]/10">
                                                        <Quote size={10} /> 독서노트
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black tracking-widest bg-amber-50 text-amber-600 border border-amber-200/50">
                                                        <MessageCircle size={10} /> 한줄평
                                                    </div>
                                                )}
                                                
                                                {/* 한줄평일 경우에만 우측에 별점을 우아하게 배치 */}
                                                {feed.type !== 'sentence' && (
                                                    <div className="flex text-[#FFCC00]">
                                                        {[...Array(Math.floor(feed.rating || 5))].map((_, i) => (
                                                            <Star key={i} size={10} fill="currentColor" />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* [수정] 3줄 말줄임 (line-clamp-3) & 폰트 크기 최적화 */}
                                            <p className={`text-[13px] md:text-[14px] leading-[1.6] break-keep tracking-tight line-clamp-3 ${
                                                feed.type === 'sentence' 
                                                ? 'font-serif font-bold text-[#1d1d1f] drop-shadow-sm' 
                                                : 'font-medium text-gray-800'
                                            }`}>
                                                {feed.text}
                                            </p>
                                        </div>

                                        <div className="mt-1 pt-2 border-t border-black/10">
                                            <div className="flex flex-col gap-0.5 mb-1.5">
                                                <span className="font-extrabold text-[#1d1d1f] text-[11px] md:text-[12px] line-clamp-1">
                                                    {feed.book}
                                                </span>
                                                <span className="text-gray-500 text-[10px] md:text-[11px]">
                                                    by {feed.user}
                                                </span>
                                            </div>
                                            
                                            <div className="flex justify-end">
                                                <button 
                                                    onClick={(e) => handleLikeClick(e, feed.id)}
                                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all duration-300 border shadow-sm ${
                                                        likedFeeds[feed.id] 
                                                        ? 'bg-rose-50 border-rose-100 text-rose-500' 
                                                        : 'bg-white/60 border-white/40 text-gray-400 hover:bg-white hover:text-[#0066cc]'
                                                    }`}
                                                >
                                                    <Star 
                                                        size={10} 
                                                        fill={likedFeeds[feed.id] ? "currentColor" : "none"} 
                                                        className={likedFeeds[feed.id] ? 'animate-in zoom-in duration-300' : ''}
                                                    />
                                                    <span className="text-[10px] font-bold">공감</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {ugcFeeds.length === 0 && (
                                <div className="col-span-full text-gray-400 w-full text-center py-10 font-medium h-[200px] flex items-center justify-center bg-white rounded-xl border border-dashed border-gray-200">
                                    아직 공개된 기록이 없습니다.
                                </div>
                            )}
                        </div>
                    )}
                </Container>
            </section>

            {/* ▼ Section 3: 공감 태그 & 작가 스포트라이트 ▼ */}
            <section className="w-full mt-[var(--spacing-1cm,32px)]">
                <Container>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 flex flex-col justify-center min-h-[260px]">
                            <h3 className="text-[16px] font-extrabold text-[#1d1d1f] mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                                <Hash className="text-[#0066cc]" size={18} /> 지금 이 순간의 공감 태그
                            </h3>
                            <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-4">
                                {wordCloudTags.map((tag, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleCardClick(tag.text.replace('#', ''))}
                                        className={`${tag.style} hover:scale-110 hover:text-[#0066cc] transition-all cursor-pointer`}
                                    >
                                        {tag.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-[24px] border border-gray-100 shadow-sm p-8 flex flex-col justify-center min-h-[260px]">
                            <div className="mb-6 border-b border-gray-100/50 pb-4">
                                <span className="text-[12px] font-extrabold text-[#0066cc] tracking-widest block mb-1">AUTHOR SPOTLIGHT</span>
                                <h3 className="text-[20px] font-extrabold text-[#1d1d1f]">유발 하라리의 세계</h3>
                                <p className="text-[13px] text-gray-500 font-medium mt-1 break-keep">인류의 과거와 미래를 꿰뚫는 거대한 통찰.</p>
                            </div>
                            <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                                {['사피엔스', '호모 데우스', '21세기를 위한 21가지 제언'].map((book, i) => (
                                    <div key={i} onClick={() => handleCardClick(book)} className="w-[90px] shrink-0 group cursor-pointer">
                                        <div className="relative aspect-[1/1.45] shadow-sm rounded-md overflow-hidden mb-2 group-hover:-translate-y-1 transition-transform border border-gray-200 bg-gray-200 flex items-center justify-center">
                                            <span className="text-[10px] text-gray-400 font-bold px-1 text-center">{book}</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-[#1d1d1f] truncate text-center group-hover:text-[#0066cc]">{book}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Container>
            </section>

            {/* ▼ Section 4: 신규 등록 도서 ▼ */}
            <section className="w-full mt-[var(--spacing-1cm,48px)] relative">
                <Container>
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <h2 className="text-[22px] font-extrabold text-[#1d1d1f] flex items-center gap-2">
                                <BookOpen className="text-[#0066cc]" size={20} /> BnT 신규 등록 도서
                                <span className="ml-2 text-[14px] font-bold text-[#0066cc] bg-[#eaf4fd] px-2.5 py-1 rounded-full">
                                    총 {newArrivals.length}권
                                </span>
                            </h2>
                            <p className="text-[14px] text-gray-500 mt-1 font-medium">최근 3일 이내 BnT에 새롭게 등록된 지식들</p>
                        </div>
                        
                        {newArrivals.length > 10 && (
                            <div className="flex items-center gap-2">
                                <button onClick={prevArrivals} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-[#0066cc] hover:text-[#0066cc] transition-colors shadow-sm"><ChevronLeft size={18} /></button>
                                <button onClick={nextArrivals} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-[#0066cc] hover:text-[#0066cc] transition-colors shadow-sm"><ChevronRight size={18} /></button>
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-12"><Loader2 className="animate-spin text-[#0066cc]" size={32} /></div>
                    ) : (
                        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
                            {visibleArrivals.map((book, i) => (
                                <div key={`${book.id}-${i}`} onClick={() => handleSentenceClick(book)} className="group cursor-pointer flex flex-col animate-in fade-in duration-300">
                                    <div className="relative aspect-[1/1.45] rounded-lg overflow-hidden shadow-sm mb-2 border border-gray-100 group-hover:shadow-md transition-all duration-300">
                                        {book.cover ? <Image src={book.cover} alt={book.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized /> : <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-[10px] text-gray-400"><BookOpen className="opacity-20 mb-1" size={16} /></div>}
                                    </div>
                                    <h3 className="font-bold text-[#1d1d1f] text-[11px] truncate mb-0.5 group-hover:text-[#0066cc]">{book.title}</h3>
                                    <p className="text-[10px] text-gray-500 truncate">@{book.discoverer}</p>
                                </div>
                            ))}
                            {newArrivals.length === 0 && <div className="text-gray-400 col-span-full text-center py-10 font-medium">최근 등록된 책이 없습니다.</div>}
                        </div>
                    )}
                </Container>
            </section>

            {/* ▼ Section 5: 하단 통계 대시보드 ▼ */}
            <section className="w-full mt-[var(--spacing-1cm,48px)] mb-10">
                <Container>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm">
                        <div className="flex flex-col items-center justify-center text-center md:border-r border-gray-100 md:pr-6">
                            <span className="text-[13px] font-bold text-gray-400 mb-2">누적 수집된 독서노트</span>
                            <span className="text-[32px] font-black text-[#1d1d1f] tracking-tight">{isLoading ? "-" : stats.total_sentences.toLocaleString()}<span className="text-[18px] text-gray-400 ml-1">개</span></span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center md:border-r border-gray-100 md:px-6">
                            <span className="text-[13px] font-bold text-gray-400 mb-2">이번 주 BnTalkers가 넘긴</span>
                            <span className="text-[32px] font-black text-[#0066cc] tracking-tight">{isLoading ? "-" : stats.total_pages.toLocaleString()}<span className="text-[18px] text-gray-400 ml-1">p</span></span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center md:pl-6">
                            <span className="text-[13px] font-bold text-gray-400 mb-2">현재 완독을 향해 달리고 있는</span>
                            <span className="text-[32px] font-black text-[#1d1d1f] tracking-tight">{isLoading ? "-" : stats.reading_books.toLocaleString()}<span className="text-[18px] text-gray-400 ml-1">권</span></span>
                        </div>
                    </div>
                </Container>
            </section>
            
            <Footer />
        </div>
    );
}