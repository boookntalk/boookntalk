// 파일 경로: frontend/src/app/(main)/works/[id]/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useSession, signIn } from "next-auth/react";
import Container from '@/components/layout/Container';
import Footer from '@/components/layout/Footer';
import { Loader2, Star, Users, BookCopy, Plus, MessageSquare, PenTool, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatDetailAuthor } from '@/utils/formatters';

import EditionSelectModal from '@/components/work/EditionSelectModal';
import LongReviewListSection from '@/components/book-detail/LongReviewListSection';
import StandardContainer from '@/components/layout/StandardContainer';

export default function WorkHubPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams(); 
    const workId = params.id as string;
    const { data: session, status } = useSession();

    const [work, setWork] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [shortReviews, setShortReviews] = useState<any[]>([]);
    const [longReviews, setLongReviews] = useState<any[]>([]);
    const [isReviewsLoading, setIsReviewsLoading] = useState(false);
    
    const initialTab = searchParams.get('tab') === 'long_review' ? 'long_reviews' : 'short_reviews';
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        if (!workId) return;

        const fetchReviews = async () => {
            setIsReviewsLoading(true);
            try {
                if (activeTab === 'short_reviews') {
                    const res = await fetch(`http://localhost:8000/api/works/${workId}/short-reviews`);
                    if (res.ok) setShortReviews(await res.json());
                } else if (activeTab === 'long_reviews') {
                    const res = await fetch(`http://localhost:8000/api/work/${workId}/long-reviews`);
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
        <StandardContainer>
            <div className="w-full h-full overflow-y-auto scrollbar-hide bg-[#F5F5F7] flex flex-col">
                <Container className="pt-[var(--spacing-1cm,32px)] pb-20">
                    
                    {/* 2. 작품 마스터 영역 (상단) */}
                    {/* 💡 lg:flex-row로 3단 분리가 가능하도록 구조를 업그레이드했습니다. */}
                    <div className="w-full bg-white rounded-sm p-[var(--spacing-1cm,32px)] shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-10 mb-8 relative overflow-hidden">
                        
                        {/* 컬럼 1: 대표 표지 */}
                        <div className="w-40 md:w-56 shrink-0 relative aspect-[1/1.4] rounded-sm shadow-md border border-gray-100 bg-gray-50 flex items-center justify-center z-10">
                            {work.best_cover ? (
                                <Image src={work.best_cover} alt={work.title} fill className="object-cover" priority />
                            ) : (
                                <span className="text-gray-400 font-bold text-sm">No Cover</span>
                            )}
                        </div>

                        {/* 컬럼 2: 책 정보 및 통계 */}
                        {/* 💡 우측에 작가 정보가 들어올 수 있도록 lg:border-r 및 padding을 추가했습니다. */}
                        <div className="flex flex-col flex-1 min-w-0 z-10 pt-2 lg:border-r lg:border-gray-100 lg:pr-10">
                            {work.category && <span className="text-[12px] font-bold text-[#0066cc] mb-2">{work.category}</span>}
                            
                            <h1 className="text-[28px] md:text-[36px] font-black text-[#1d1d1f] leading-tight tracking-tight mb-2 truncate">
                                {work.title}
                            </h1>
                            <p className="text-[16px] text-gray-500 font-medium mb-6 truncate">
                                {formatDetailAuthor(work.author)}
                            </p>
                            
                            {/* 통합 통계 뱃지 */}
                            <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100 w-full overflow-x-auto scrollbar-hide shrink-0">
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

                            {/* 작품 소개글 */}
                            <div className="text-[14px] text-gray-600 leading-relaxed break-keep min-h-[100px]">
                                {work.description || "이 작품에 대한 상세 소개가 아직 없습니다."}
                            </div>

                            {/* 액션 버튼 */}
                            <div className="mt-auto pt-8 flex">
                                <button 
                                    onClick={() => {
                                        if (status === 'unauthenticated') return signIn('google');
                                        setIsModalOpen(true);
                                    }}
                                    className="flex items-center justify-center gap-2 w-full md:w-fit px-8 py-3.5 bg-[#1d1d1f] text-white rounded-lg font-bold hover:bg-black transition-transform active:scale-95 shadow-lg shrink-0"
                                >
                                    <Plus size={18} /> 내 서재에 담을 판본 선택하기
                                </button>
                            </div>
                        </div>

                        {/* ▼▼▼ 핵심 추가: 컬럼 3 작가 상세 프로필 및 대표작 ▼▼▼ */}
                        {work.authorInfo && (
                            <div className="w-full lg:w-1/3 flex flex-col min-w-0 z-10 shrink-0">
                                <div className="flex flex-col h-full gap-6">
                                    <div className="flex flex-col">
                                        <h2 className="text-[12px] font-black tracking-widest text-gray-400 uppercase mb-4">Author</h2>
                                        <div className="flex items-center gap-3 mb-4">
                                            {/* 작가 사진 */}
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
                                        
                                        <p className="text-[14px] leading-relaxed text-gray-600 font-medium break-keep line-clamp-4 mb-4">
                                            {work.authorInfo.bio || "등록된 저자 소개가 없습니다."}
                                        </p>
                                    </div>

                                    {/* 작가의 다른 대표작 목록 */}
                                    {work.authorOtherBooks && work.authorOtherBooks.length > 0 && (
                                        <div className="pt-6 border-t border-gray-100 mt-auto">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-[12px] font-extrabold text-gray-500 uppercase tracking-wide">대표작</h3>
                                                {/* 더보기 버튼 (옵션) */}
                                            </div>
                                            
                                            <div className="flex flex-col gap-2">
                                                {work.authorOtherBooks.map((book: any) => (
                                                    <div 
                                                        key={book.id} 
                                                        onClick={() => router.push(`/works/${book.id}`)} 
                                                        className="flex items-center gap-3 cursor-pointer group rounded-xl hover:bg-gray-50 transition-all p-2 -ml-2 border border-transparent hover:border-gray-100"
                                                    >
                                                        {/* 다른 책 표지 */}
                                                        <div className="w-10 h-14 shrink-0 relative bg-gray-100 border border-gray-200 shadow-sm rounded-sm overflow-hidden flex items-center justify-center">
                                                            {book.cover ? (
                                                                <Image src={book.cover} alt={book.title} fill className="object-cover" />
                                                            ) : (
                                                                <BookCopy size={12} className="text-gray-300" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                            <h4 className="text-[14px] font-bold text-[#1d1d1f] line-clamp-1 leading-tight group-hover:text-[#0066cc] transition-colors mb-1">{book.title}</h4>
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
                        {/* ▲▲▲ 작가 영역 끝 ▲▲▲ */}

                    </div>

                    {/* 3. 통합 소셜 라운지 영역 (하단) */}
                    <div className="mt-12">
                        <h2 className="text-[20px] font-black text-[#1d1d1f] mb-6">BoooknTalkers의 사색</h2>
                        
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
                </Container>

                <EditionSelectModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    workId={workId} 
                    workTitle={work.title} 
                    userEmail={session?.user?.email || ''} 
                />
                <Footer />
            </div>
        </StandardContainer>
    );
}