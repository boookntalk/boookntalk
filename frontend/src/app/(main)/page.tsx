'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Quote, MessageCircle, ArrowRight, BookOpen, Hash, Sparkles, ChevronRight, ChevronLeft, Star, Loader2, TrendingUp } from 'lucide-react';
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

    // 1. 컴포넌트 내부 상태 추가 (피드별 좋아요 상태 관리)
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

    // 3. 인덱스 추출 및 맵(Map) 생성 로직
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
        if (item.isbn) router.push(`/book/${item.isbn}`); 
        else router.push(`/search?q=${encodeURIComponent(item.book || item.title || '')}`);
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

    // 2. 공감 핸들러 추가
    const handleLikeClick = async (e: React.MouseEvent, feedId: string) => {
        e.stopPropagation(); // 카드 전체 클릭(handleSentenceClick) 이벤트 전파 방지
        
        if (!session) {
            toast('로그인이 필요해요', { 
                action: { label: '로그인', onClick: () => signIn('google') },
                duration: 3000 
            });
            return;
        }

        // 로컬 UI 즉시 업데이트
        setLikedFeeds(prev => ({ ...prev, [feedId]: !prev[feedId] }));

        try {
            // 백엔드 API 호출
            await fetch(`http://localhost:8000/api/feeds/${feedId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_email: session.user?.email })
            });
        } catch (error) {
            console.error("공감 처리 실패:", error);
            // 실패 시 상태 복구 (Rollback)
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
        if (!readersChoice || !readersChoice.reviews || readersChoice.reviews.length <= 1) return;
        const timer = setInterval(() => {
            setRcReviewIndex((prev) => (prev + 1) % readersChoice.reviews.length);
        }, 4500);
        return () => clearInterval(timer);
    }, [readersChoice]);

    useEffect(() => {
        const fetchHomeData = async () => {
            if (memoryCache && memoryCache.sessionEmail === (session?.user?.email || null)) return; 

            setIsLoading(true);
            try {
                const emailQuery = session?.user?.email ? `?user_email=${encodeURIComponent(session.user.email)}` : '';
                
                const [statsRes, ugcRes, arrivalsRes, sentencesRes, rcRes, coverFlowRes] = await Promise.all([
                    fetch('http://localhost:8000/api/home/stats'),
                    fetch('http://localhost:8000/api/home/recent-ugc?limit=6'),
                    fetch('http://localhost:8000/api/home/new-arrivals?days=3'),
                    fetch(`http://localhost:8000/api/home/today-sentences${emailQuery}`),
                    fetch('http://localhost:8000/api/home/readers-choice'),
                    fetch('http://localhost:8000/api/home/cover-flow-books') 
                ]);

                const newData = {
                    stats: statsRes.ok ? await statsRes.json() : stats,
                    ugcFeeds: ugcRes.ok ? await ugcRes.json() : [],
                    newArrivals: arrivalsRes.ok ? await arrivalsRes.json() : [],
                    heroSentences: sentencesRes.ok ? await sentencesRes.json() : [],
                    readersChoice: rcRes.ok ? await rcRes.json() : null,
                    coverFlowBooks: coverFlowRes.ok ? await coverFlowRes.json() : [],
                    sessionEmail: session?.user?.email || null
                };

                setStats(newData.stats);
                setUgcFeeds(newData.ugcFeeds);
                setNewArrivals(newData.newArrivals);
                setHeroSentences(newData.heroSentences);
                setReadersChoice(newData.readersChoice);
                setCoverFlowBooks(newData.coverFlowBooks);
                
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
            
            {/* ▼ Section 0: 수정된 커버 플로우 (인덱스를 아래로 이동, 텍스트 스타일 적용) ▼ */}
            <section className="w-full pt-[var(--spacing-1cm,32px)]">
                
                {/* 커버 플로우 영역 (상단 배치) */}
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
                            
                            // DOM 가상화 유지
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

                {/* ▼ 인덱스 바 (하단 배치, 폭 제한, 텍스트 형태 적용) ▼ */}
                <Container>
                    <div className="w-full overflow-x-auto scrollbar-hide mt-0 pb-2 max-w-4xl mx-auto">
                        <div className="flex items-center justify-between w-full border-t border-gray-100 pt-6 px-1 min-w-max gap-x-1">
                            {indexChars.map((char) => (
                                <button 
                                    key={char} 
                                    onClick={() => handleIndexClick(char)}
                                    className={`
                                        flex-shrink-0 transition-all duration-200 
                                        /* 디자인 포인트: 폰트 사이즈 축소 및 자간 조정 */
                                        text-[10px] md:text-[11px] tracking-tighter font-medium
                                        ${selectedGenre === char 
                                            ? 'text-[#0066cc] font-black scale-110 translate-y-[-1px]' 
                                            : 'text-gray-400 hover:text-[#1d1d1f] hover:font-bold'
                                        }
                                    `}
                                    /* 디자인스러운 폰트 스택 적용 */
                                    style={{ fontFamily: '"Inter", "Pretendard", -apple-system, sans-serif' }}
                                >
                                    {char}
                                </button>
                            ))}
                        </div>
                    </div>
                </Container>
                {/* ▲ 인덱스 바 끝 ▲ */}
            </section>

            {/* 나머지 Section은 이전과 동일하게 100% 유지 */}
            <section className="w-full pt-[var(--spacing-1cm,32px)]">
                <Container>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--spacing-1cm,32px)] items-stretch h-auto lg:min-h-[190px]">
                        
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
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Quote size={12} className="text-[#D4AF37]" />
                                                            <span className="text-[10px] font-extrabold tracking-widest text-[#D4AF37]">TODAY'S SENTENCE</span>
                                                        </div>
                                                        <div className="relative">
                                                            <h2 className="text-[18px] md:text-[20px] font-medium leading-[1.5] break-keep tracking-tight text-[#FDFBF7] text-left pr-4 drop-shadow-md line-clamp-2">{sentence.text}</h2>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-end justify-between w-full mt-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-[36px] h-[52px] relative rounded-md overflow-hidden shadow-sm border border-white/10 shrink-0">
                                                                {sentence.cover ? <Image src={sentence.cover} alt="Cover" fill className="object-cover" unoptimized /> : <div className="w-full h-full bg-white/20" />}
                                                            </div>
                                                            <div className="flex flex-col text-left">
                                                                <p className="text-[14px] font-bold text-[#FDFBF7] mb-0.5 drop-shadow-md line-clamp-1">{sentence.book}</p>
                                                                <p className="text-[11px] text-gray-300 font-medium mb-1 drop-shadow-md line-clamp-1">저자 : {sentence.author}</p>
                                                                <div className="flex items-center gap-1">
                                                                    <div className="flex text-[#D4AF37]"><Star size={10} fill="currentColor" /></div>
                                                                    <span className="text-[10px] text-[#D4AF37] font-bold">전체 평점: 4.8</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-7 h-7 rounded-full flex shrink-0 items-center justify-center transition-all duration-300 border border-[#D4AF37]/50 group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37]">
                                                            <ArrowRight size={14} className="text-[#D4AF37] group-hover:text-white transition-colors" />
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

                        <div className="lg:col-span-4 flex flex-col h-full min-h-[190px]">
                            <div className="flex-1 bg-[#FDFBF7] rounded-[24px] p-5 md:p-6 border border-[#EAE6DF] shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden group">
                                <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl group-hover:bg-[#D4AF37]/15 transition-colors duration-500 z-0"></div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <MessageCircle size={14} className="text-[#D4AF37]" />
                                            <span className="text-[11px] font-extrabold text-[#D4AF37] tracking-widest">독자의 한줄평</span>
                                        </div>
                                        {readersChoice && readersChoice.reviews && readersChoice.reviews.length > 0 && (
                                            <div key={`user-${rcReviewIndex}`} className="animate-in fade-in duration-500 flex items-center gap-1.5 text-right">
                                                <span className="text-[11px] font-bold text-[#95A5A6] truncate max-w-[160px]">
                                                    {readersChoice.reviews[rcReviewIndex].user} 님의 사색
                                                </span>
                                                {readersChoice.reviews[rcReviewIndex].rating > 0 && (
                                                    <div className="flex items-center gap-0.5 text-[#D4AF37]">
                                                        <Star size={10} fill="currentColor" />
                                                        <span className="text-[10px] font-bold">{readersChoice.reviews[rcReviewIndex].rating}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {readersChoice ? (
                                        <>
                                            <div onClick={() => handleSentenceClick({ isbn: readersChoice.isbn, book: "독자의 한줄평" })} className="flex items-center gap-3 mb-3 pb-3 border-b border-[#EAE6DF] cursor-pointer shrink-0">
                                                <div className="w-[32px] h-[48px] relative rounded shadow-sm overflow-hidden shrink-0 border border-black/5 bg-gray-50">
                                                    {readersChoice.cover ? <Image src={readersChoice.cover} alt="Cover" fill className="object-cover" unoptimized /> : <BookOpen size={16} className="text-gray-300 m-auto h-full flex items-center" />}
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <span className="text-[13px] font-bold text-[#1A2332] line-clamp-1 hover:text-[#D4AF37] transition-colors">{readersChoice.title}</span>
                                                    <span className="text-[11px] text-[#95A5A6] line-clamp-1 mt-0.5">{readersChoice.author}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 relative flex flex-col justify-center">
                                                {readersChoice.reviews && readersChoice.reviews.length > 0 ? (
                                                    <div key={`text-${rcReviewIndex}`} className="animate-in fade-in duration-500 h-full flex flex-col justify-center">
                                                        <div className="relative">
                                                            <Quote size={14} className="text-[#D4AF37]/20 absolute -top-1 -left-1" />
                                                            <h3 className="text-[14px] font-medium text-[#1A2332] leading-relaxed line-clamp-2 relative z-10 pl-3 break-keep font-serif">
                                                                {readersChoice.reviews[rcReviewIndex].text}
                                                            </h3>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400 text-center">아직 남겨진 한줄평이 없습니다.</p>
                                                )}
                                            </div>
                                            {readersChoice.reviews && readersChoice.reviews.length > 1 && (
                                                <div className="flex items-center justify-center gap-1.5 mt-2 shrink-0">
                                                    {readersChoice.reviews.map((_: any, i: number) => (
                                                        <button key={i} onClick={() => setRcReviewIndex(i)} className={`h-1 rounded-full transition-all duration-300 ${rcReviewIndex === i ? 'w-3 bg-[#D4AF37]' : 'w-1 bg-[#EAE6DF] hover:bg-gray-300'}`} />
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-[12px] text-gray-400">데이터를 불러오는 중...</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>

            {/* ▼ Section 2: 실시간 사색의 파편들 (수정됨) ▼ */}
            <section className="w-full mt-[var(--spacing-1cm,48px)]">
                {/* 1. 너비 일치: 전체를 Container로 감싸 위/아래 컨텐츠와 폭을 맞춥니다. */}
                <Container> 
                    <div className="mb-6 flex justify-between items-end">
                        <div>
                            <h2 className="text-[22px] font-extrabold text-[#1d1d1f] flex items-center gap-2">
                                <Sparkles className="text-[#0066cc]" size={20} /> 실시간 사색의 파편들
                            </h2>
                            <p className="text-[14px] text-gray-500 mt-1 font-medium">멤버들이 방금 남긴 짙은 여운들</p>
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
                        // 2. 너비 일치: 가로 스크롤 영역이 Container 너비를 벗어나지 않도록 설정
                        <div className="w-full overflow-x-auto scrollbar-hide pb-6 snap-x snap-mandatory">
                            <div className="flex gap-6 w-full">
                                {ugcFeeds.map((feed) => (
                                    <div 
                                        key={feed.id} 
                                        onClick={() => handleSentenceClick(feed)}
                                        // 3. 디자인: relative와 overflow-hidden으로 배경 블러 레이어를 가둡니다.
                                        className="snap-start w-[280px] md:w-[320px] rounded-[24px] p-7 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between shrink-0 h-[220px] relative overflow-hidden group"
                                    >
                                        {/* ▼▼▼ [핵심] 카드 배경 블러 레이어 ▼▼▼ */}
                                        <div className="absolute inset-0 z-0 opacity-20 transition-opacity duration-500 group-hover:opacity-30">
                                            {feed.cover ? (
                                                <Image 
                                                    src={feed.cover} 
                                                    alt="blur background"
                                                    fill
                                                    className="object-cover scale-150 blur-[40px]" 
                                                    unoptimized 
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100" />
                                            )}
                                            {/* 가독성을 위해 흰색 오버레이를 배경 위에 살짝 덮음 */}
                                            <div className="absolute inset-0 bg-white/60" /> 
                                        </div>
                                        {/* ▲▲▲ [핵심] 끝 ▲▲▲ */}

                                        {/* 컨텐츠 레이어: z-10을 주어 배경 위로 올림 */}
                                        <div className="relative z-10">
                                            {feed.type === 'sentence' ? (
                                                <Quote size={20} className="text-[#0066cc]/30 mb-3" />
                                            ) : (
                                                <div className="flex text-[#FFCC00] mb-3">
                                                    {[...Array(Math.floor(feed.rating || 5))].map((_, i) => (
                                                        <Star key={i} size={14} fill="currentColor" />
                                                    ))}
                                                </div>
                                            )}
                                            <p className={`text-[15px] leading-relaxed break-keep line-clamp-4 ${
                                                feed.type === 'sentence' ? 'font-serif font-bold text-[#1d1d1f]' : 'font-medium text-gray-700'
                                            }`}>
                                                {feed.text}
                                            </p>
                                        </div>

                                        {/* 하단 영역: 상단 경계선과 정보 노출 */}
                                        <div className="mt-4 pt-4 border-t border-gray-100/50 relative z-10">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-gray-500 text-[12px] truncate pr-2">{feed.book}</span>
                                                <span className="text-gray-400 text-[11px] shrink-0">by {feed.user}</span>
                                            </div>
                                            
                                            {/* 공감(좋아요) 버튼 */}
                                            <div className="flex justify-end items-center mt-2.5">
                                                <button 
                                                    onClick={(e) => handleLikeClick(e, feed.id)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
                                                        likedFeeds[feed.id] 
                                                        ? 'bg-rose-50 text-rose-500 shadow-sm' 
                                                        : 'bg-white/80 hover:bg-white text-gray-400 border border-gray-100'
                                                    }`}
                                                >
                                                    <Star 
                                                        size={14} 
                                                        fill={likedFeeds[feed.id] ? "currentColor" : "none"} 
                                                        className={likedFeeds[feed.id] ? 'animate-in zoom-in duration-300' : ''}
                                                    />
                                                    <span className="text-[11px] font-extrabold uppercase tracking-tighter">공감</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {ugcFeeds.length === 0 && (
                                    <div className="text-gray-400 w-full text-center py-10 font-medium h-[220px] flex items-center justify-center bg-white rounded-xl border border-dashed border-gray-200">
                                        아직 공개된 사색의 조각이 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Container>
            </section>

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

            <section className="w-full mt-[var(--spacing-1cm,48px)] relative">
                <Container>
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <h2 className="text-[22px] font-extrabold text-[#1d1d1f] flex items-center gap-2">
                                <BookOpen className="text-[#0066cc]" size={20} /> BoooknTalk 신규 등록 도서
                                <span className="ml-2 text-[14px] font-bold text-[#0066cc] bg-[#eaf4fd] px-2.5 py-1 rounded-full">
                                    총 {newArrivals.length}권
                                </span>
                            </h2>
                            <p className="text-[14px] text-gray-500 mt-1 font-medium">최근 3일 이내 BoooknTalk에 새롭게 등록된 지식들</p>
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

            <section className="w-full mt-[var(--spacing-1cm,48px)] mb-10">
                <Container>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm">
                        <div className="flex flex-col items-center justify-center text-center md:border-r border-gray-100 md:pr-6">
                            <span className="text-[13px] font-bold text-gray-400 mb-2">누적 수집된 사색의 문장</span>
                            <span className="text-[32px] font-black text-[#1d1d1f] tracking-tight">{isLoading ? "-" : stats.total_sentences.toLocaleString()}<span className="text-[18px] text-gray-400 ml-1">줄</span></span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center md:border-r border-gray-100 md:px-6">
                            <span className="text-[13px] font-bold text-gray-400 mb-2">이번 주 BoooknTalkers가 넘긴</span>
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