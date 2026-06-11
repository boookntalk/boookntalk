// 파일 경로: frontend/src/app/(main)/works/[id]/page.tsx
// 역할 및 기능: 작품(Work) 상세 페이지. '다른 판본'의 개수를 현재 렌더링 중인 판본을 제외한 순수 나머지 개수로 계산(editions.length - 1)하여 표시하고, Work-Hub 패턴으로 판본을 스위칭하는 기능을 제공합니다.

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useSession, signIn } from "next-auth/react";
import { Loader2, Star, Users, BookCopy, MessageSquare, PenTool, User, ArrowLeft, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { formatDetailAuthor } from '@/utils/formatters';

import HeroDetailLayout from '@/components/layout/HeroDetailLayout'; 
import EditionSelectModal from '@/components/work/EditionSelectModal';
import LongReviewListSection from '@/components/book-detail/LongReviewListSection';

export default function WorkHubPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams(); 
    const workId = params.id as string;
    const editionId = searchParams.get('edition'); 
    
    const { data: session, status } = useSession();

    const [work, setWork] = useState<any>(null);
    const [editions, setEditions] = useState<any[]>([]); 
    const [isLoading, setIsLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [isEditionDropdownOpen, setIsEditionDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [shortReviews, setShortReviews] = useState<any[]>([]);
    const [longReviews, setLongReviews] = useState<any[]>([]);
    const [isReviewsLoading, setIsReviewsLoading] = useState(false);
    
    const initialTab = searchParams.get('tab') === 'long_review' ? 'long_reviews' : 'short_reviews';
    const [activeTab, setActiveTab] = useState(initialTab);

    // 드롭다운 외부 클릭 시 닫기 로직
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsEditionDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // [1] 작품 상세 정보 로드
    useEffect(() => {
        if (!workId) return;

        const fetchWorkDetail = async () => {
            setIsLoading(true);
            try {
                const queryStr = editionId ? `?edition_id=${editionId}` : '';
                const res = await fetch(`http://localhost:8000/api/works/${workId}${queryStr}`);
                
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
    }, [workId, editionId, router]);

    // [2] 판본(Edition) 리스트 로드
    useEffect(() => {
        if (!workId) return;

        const fetchWorkEditions = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/works/${workId}/editions`);
                if (res.ok) {
                    const data = await res.json();
                    setEditions(data);
                }
            } catch (error) {
                console.error("판본 목록 조회 에러:", error);
            }
        };

        fetchWorkEditions();
    }, [workId]);

    // [3] 리뷰 데이터 로드
    useEffect(() => {
        if (!workId) return;

        const fetchReviews = async () => {
            setIsReviewsLoading(true);
            try {
                if (activeTab === 'short_reviews') {
                    const res = await fetch(`http://localhost:8000/api/works/${workId}/short-reviews`);
                    if (res.ok) setShortReviews(await res.json());
                } else if (activeTab === 'long_reviews') {
                    const res = await fetch(`http://localhost:8000/api/works/${workId}/long-reviews`);
                    if (res.ok) setLongReviews(await res.json());
                }
            } catch (error) {
                console.error("리뷰 로딩 에러:", error);
            } finally {
                setIsReviewsLoading(false);
            }
        };

        fetchReviews();
    }, [workId, activeTab]);

    if (isLoading) {
        return (
            <div className="w-full h-[calc(100vh-64px)] bg-[#F5F5F7] flex justify-center items-center">
                <Loader2 className="animate-spin text-[#0066cc]" size={40} />
            </div>
        );
    }

    if (!work) return null;

    /**
     * 기능: 도서의 상단 핵심 정보(히어로 영역)를 렌더링합니다. 제목 우측에 본인을 제외한 다른 판본의 개수를 표시하고 드롭다운을 통해 스위칭 기능을 제공합니다.
     */
    const renderHeroContent = () => {
        // 본인을 제외한 나머지 판본의 개수 계산 (음수 방지)
        const otherEditionsCount = Math.max(0, editions.length - 1);

        return (
            <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-[var(--spacing-1cm,32px)] pb-10 items-stretch">
                
                {/* 1. 좌측 컬럼: 표지 + 서재 담기 버튼 */}
                <div className="flex flex-col w-40 md:w-44 lg:w-48 shrink-0 z-10">
                    <div className="w-full relative aspect-[1/1.45] rounded-sm shadow-md border border-gray-100 bg-gray-50 flex items-center justify-center">
                        {work.best_cover ? (
                            <Image src={work.best_cover} alt={work.title} fill className="object-cover" priority />
                        ) : (
                            <span className="text-gray-400 font-bold text-sm">No Cover</span>
                        )}
                    </div>

                    <div className="mt-auto pt-4 w-full hidden lg:flex">
                        <button 
                            onClick={() => {
                                if (status === 'unauthenticated') return signIn('google');
                                setIsModalOpen(true);
                            }}
                            className="flex items-center justify-center w-full py-3.5 px-2 bg-[#1d1d1f] text-white rounded-lg font-bold hover:bg-black transition-transform active:scale-95 shadow-md text-[13px] break-keep text-center cursor-pointer"
                        >
                            서재에 담을 판본 선택
                        </button>
                    </div>
                </div>

                {/* 2. 중앙 컬럼: 도서 메타데이터 및 소개글 */}
                <div className="flex flex-col flex-1 min-w-0 z-10 pt-1 lg:border-r lg:border-gray-100 lg:pr-8">
                    {work.category && <span className="text-[12px] font-bold text-[#0066cc] mb-2">{work.category}</span>}
                        <div className="w-full flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                            <h1 className="text-[26px] md:text-[32px] font-black text-[#1d1d1f] leading-tight tracking-tight break-keep flex-1">
                                {work.title}
                            </h1>

                            <div className="relative shrink-0" ref={dropdownRef}>
                            <button 
                                // 💡 다른 판본이 1개 이상일 때만 클릭 작동 및 메뉴 열림
                                onClick={() => otherEditionsCount > 0 && setIsEditionDropdownOpen(!isEditionDropdownOpen)}
                                disabled={otherEditionsCount === 0}
                                className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-[13px] font-bold transition-all ${
                                    otherEditionsCount > 0 
                                        ? 'border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700 cursor-pointer' 
                                        : 'border-gray-100 bg-gray-50 text-gray-400 cursor-default opacity-80' // 💡 비활성화 시각 처리
                                }`}
                            >
                                <span>다른 판본 ({otherEditionsCount})</span>
                                
                                {/* 💡 다른 판본이 있을 때만 화살표 아이콘 노출 */}
                                {otherEditionsCount > 0 && (
                                    <ChevronDown size={16} className={`transition-transform ${isEditionDropdownOpen ? 'rotate-180' : ''}`} />
                                )}
                            </button>

                            {/* 드롭다운 메뉴 (조건부 렌더링을 방어적으로 한 번 더 적용) */}
                            {otherEditionsCount > 0 && isEditionDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-[260px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="max-h-[320px] overflow-y-auto scrollbar-hide flex flex-col">
                                        {editions.map((ed: any) => {
                                            const isCurrent = String(ed.edition_id) === String(editionId) || (!editionId && ed.cover_image === work.best_cover);
                                            const pubYear = ed.publish_date ? ed.publish_date.substring(0, 4) : '연도미상';
                                            
                                            return (
                                                <button
                                                    key={ed.edition_id}
                                                    onClick={() => {
                                                        setIsEditionDropdownOpen(false);
                                                        router.push(`/works/${workId}?edition=${ed.edition_id}`);
                                                    }}
                                                    className={`flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 border-b border-gray-50 last:border-0 ${isCurrent ? 'bg-blue-50/50' : ''}`}
                                                >
                                                    {/* 미니 표지 */}
                                                    <div className="w-8 h-11 bg-gray-100 rounded-sm border border-gray-200 overflow-hidden shrink-0 relative flex items-center justify-center">
                                                        {ed.cover_image ? (
                                                            <img src={ed.cover_image} alt="cover" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <BookCopy size={12} className="text-gray-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className={`text-[13px] font-bold line-clamp-1 mb-0.5 ${isCurrent ? 'text-[#0066cc]' : 'text-[#1d1d1f]'}`}>
                                                            {ed.publisher || '출판사 미상'}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500 font-medium">
                                                            {pubYear} 판본
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="text-[15px] text-gray-500 font-medium mb-5 truncate">
                        {formatDetailAuthor(work.author)}
                    </p>
                    
                    <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100 w-full overflow-x-auto scrollbar-hide shrink-0">
                        <div className="flex flex-col shrink-0">
                            <span className="text-[11px] text-gray-400 font-bold mb-1">통합 평점</span>
                            <div className="flex items-center gap-1.5 text-amber-400">
                                <Star size={18} fill="currentColor" />
                                <span className="text-[18px] font-black text-[#1d1d1f]">{work.average_rating}</span>
                            </div>
                        </div>
                        <div className="w-[1px] h-10 bg-gray-200 shrink-0"></div>
                        <div className="flex flex-col shrink-0">
                            <span className="text-[11px] text-gray-400 font-bold mb-1">담은 사람</span>
                            <div className="flex items-center gap-1.5 text-emerald-500">
                                <Users size={18} />
                                <span className="text-[18px] font-black text-[#1d1d1f]">{work.total_added}<span className="text-[13px] font-medium text-gray-500 ml-1">명</span></span>
                            </div>
                        </div>
                        <div className="w-[1px] h-10 bg-gray-200 shrink-0"></div>
                        <div className="flex flex-col shrink-0">
                            <span className="text-[11px] text-gray-400 font-bold mb-1">등록된 판본</span>
                            <div className="flex items-center gap-1.5 text-[#0066cc]">
                                <BookCopy size={18} />
                                <span className="text-[18px] font-black text-[#1d1d1f]">{work.edition_count}<span className="text-[13px] font-medium text-gray-500 ml-1">개</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="text-[14px] text-gray-600 leading-relaxed break-keep line-clamp-6 mt-auto">
                        {work.description || "이 작품에 대한 상세 소개가 아직 없습니다."}
                    </div>

                    <div className="mt-6 flex lg:hidden">
                        <button 
                            onClick={() => {
                                if (status === 'unauthenticated') return signIn('google');
                                setIsModalOpen(true);
                            }}
                            className="flex items-center justify-center w-full px-8 py-3.5 bg-[#1d1d1f] text-white rounded-lg font-bold hover:bg-black transition-transform active:scale-95 shadow-md text-[14px]"
                        >
                            서재에 담을 판본 선택
                        </button>
                    </div>
                </div>

                {/* 3. 우측 컬럼: 작가 상세 정보 */}
                {work.authorInfo && (
                    <div className="w-full lg:w-[300px] xl:w-[340px] flex flex-col min-w-0 z-10 shrink-0">
                        <div className="flex flex-col h-full gap-6">
                            <div className="flex flex-col">
                                <h2 className="text-[12px] font-black tracking-widest text-gray-400 uppercase mb-4">Author</h2>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0 relative overflow-hidden flex items-center justify-center border border-gray-200">
                                        {work.authorInfo.photo ? (
                                            <Image src={work.authorInfo.photo} alt={work.authorInfo.name} fill className="object-cover" />
                                        ) : (
                                            <User size={20} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-extrabold text-[#1d1d1f]">{work.authorInfo.name}</h3>
                                        {work.authorInfo.role && <p className="text-[11px] font-bold text-[#0066cc] mt-0.5">{work.authorInfo.role}</p>}
                                    </div>
                                </div>
                                
                                <p className="text-[13px] leading-relaxed text-gray-600 font-medium break-keep line-clamp-4 mb-4">
                                    {work.authorInfo.bio || "등록된 저자 소개가 없습니다."}
                                </p>
                            </div>

                            {work.authorOtherBooks && work.authorOtherBooks.length > 0 && (
                                <div className="pt-5 border-t border-gray-100 mt-auto">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-[12px] font-extrabold text-gray-500 uppercase tracking-wide">대표작</h3>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {work.authorOtherBooks.map((book: any) => (
                                            <div 
                                                key={book.id} 
                                                onClick={() => router.push(`/works/${book.id}`)} 
                                                className="flex items-center gap-3 cursor-pointer group rounded-xl hover:bg-gray-50 transition-all p-2 -ml-2 border border-transparent hover:border-gray-100"
                                            >
                                                <div className="w-10 h-14 shrink-0 relative bg-gray-100 border border-gray-200 shadow-sm rounded-sm overflow-hidden flex items-center justify-center">
                                                    {book.cover ? (
                                                        <Image src={book.cover} alt={book.title} fill className="object-cover" />
                                                    ) : (
                                                        <BookCopy size={12} className="text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <h4 className="text-[13px] font-bold text-[#1d1d1f] line-clamp-1 leading-tight group-hover:text-[#0066cc] transition-colors mb-1">{book.title}</h4>
                                                    <span className="text-[11px] font-bold text-gray-400">BoooknTalk 광장</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    /**
     * 기능: 하단의 한줄평/긴줄평 스위칭 탭 영역을 렌더링합니다.
     */
    const renderTabs = () => (
        <div className="flex items-center gap-6 w-full pt-4">
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
    );

    /**
     * 기능: 상단에 이전 화면으로 복귀하는 브레드크럼(History Back)을 렌더링합니다.
     */
    const renderBreadcrumb = () => (
        <div className="w-full flex items-center">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-gray-500 hover:text-[#1d1d1f] transition-colors text-[14px] font-bold cursor-pointer">
                <ArrowLeft size={18} /> 돌아가기
            </button>
        </div>
    );

    return (
        <>
            <HeroDetailLayout
                breadcrumb={renderBreadcrumb()}
                heroContent={renderHeroContent()}
                tabs={renderTabs()}
            >
                <div className="mt-8">
                    {isReviewsLoading ? (
                        <div className="py-20 flex justify-center items-center bg-white rounded-lg border border-gray-100 border-dashed">
                            <Loader2 className="animate-spin text-[#0066cc]" size={32} />
                        </div>
                    ) : activeTab === 'short_reviews' ? (
                        shortReviews.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {shortReviews.map(review => (
                                    <div key={review.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-4 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 relative overflow-hidden flex items-center justify-center border border-gray-200">
                                                {review.user_image ? (
                                                    <Image src={review.user_image} alt="profile" fill className="object-cover" />
                                                ) : (
                                                    <User size={20} className="text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-[14px] text-[#1d1d1f]">{review.user_name}</span>
                                                    <span className="text-[12px] text-gray-400">{review.created_at.substring(0, 10)}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-0.5 text-amber-400">
                                                    <Star size={12} fill="currentColor" />
                                                    <span className="text-[12px] font-bold text-gray-600 pt-[1px]">{review.rating}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[14px] text-gray-700 leading-relaxed break-keep">{review.short_review}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center bg-white rounded-lg border border-gray-100 border-dashed">
                                <MessageSquare size={40} strokeWidth={1.5} className="mb-4 text-gray-300" />
                                <span className="text-gray-400 font-medium text-[14px]">아직 작성된 한줄평이 없습니다. 첫 번째 기록을 남겨보세요!</span>
                            </div>
                        )
                    ) : (
                        <LongReviewListSection workId={Number(workId)} currentUser={session?.user} />
                    )}
                </div>
            </HeroDetailLayout>
            
            <EditionSelectModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                workId={workId} 
                workTitle={work.title} 
                userEmail={session?.user?.email || ''} 
            />
        </>
    );
}