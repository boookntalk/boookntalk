'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from "next-auth/react";
import { Star, Users, Loader2, BookOpen, BookmarkPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";

interface SquareWorkListProps {
    onCountLoaded?: (count: number) => void; // 부모에게 총 개수를 알려주는 안테나
}

export default function SquareWorkList({ onCountLoaded }: SquareWorkListProps) {
    const router = useRouter();
    const { data: session, status } = useSession(); 
    
    const [works, setWorks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTrendingWorks = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/square/works`);
                if (res.ok) {
                    const data = await res.json();
                    setWorks(data);
                    if (onCountLoaded) onCountLoaded(data.length); // 부모 컴포넌트에 개수 전달
                }
            } catch (error) {
                console.error("인기 도서 로딩 실패:", error);
                toast.error("도서 정보를 불러오지 못했습니다.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchTrendingWorks();
    }, [onCountLoaded]); 

    // 빠른 서재 담기 핸들러
    const handleAddWishlist = async (e: React.MouseEvent, editionId: number, bookTitle: string) => {
        e.stopPropagation();
        if (status === 'unauthenticated') return signIn('google');
        try {
            const res = await fetch(`http://localhost:8000/api/library/wishlist/quick`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ user_email: session!.user!.email, edition_id: editionId })
            });
            const data = await res.json();
            if (data.status === 'success') toast.success(`'${bookTitle}' 내 서재에 담겼습니다!`);
            else if (data.status === 'exists') toast.info(data.message);
        } catch (error) {
            toast.error("오류가 발생했습니다.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="animate-spin text-[#0066cc]" size={40} />
            </div>
        );
    }

    if (works.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-100 border-dashed">
                <BookOpen size={48} className="text-gray-200 mb-4" />
                <p className="text-gray-400 font-medium">아직 광장에 등록된 작품이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8 animate-in fade-in duration-500">
            {works.map((work, index) => (
                <div 
                    key={work.edition_id} 
                    onClick={() => router.push(`/work/${work.work_id}`)}
                    className="group cursor-pointer flex flex-col h-full bg-white rounded-sm p-4 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative"
                >
                    {/* 1. 콜라주 표지 영역 */}
                    <div className="relative aspect-[1/1.4] w-[85%] mx-auto mb-4 flex items-center justify-center">
                        
                        {/* 커버가 1장뿐이거나 없을 때 (기본형) */}
                        {(!work.covers || work.covers.length <= 1) && (
                            <div className="w-full h-full rounded-sm overflow-hidden shadow-md bg-gray-50 border border-gray-100 transition-transform duration-500 group-hover:scale-105 relative">
                                {work.covers?.[0] || work.cover ? (
                                    <Image src={work.covers?.[0] || work.cover} alt={work.title} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover" priority={index < 10} />
                                ) : (
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-400 font-bold bg-gray-100">No Cover</span>
                                )}
                            </div>
                        )}

                        {/* 커버가 2장 이상일 때 (콜라주 렌더링) */}
                        {work.covers && work.covers.length > 1 && (
                            // A안과 B안을 50% 확률로 렌더링 (확인을 위한 랜덤 로직)
                            Math.random() > 0.5 ? (
                                
                                /* ==========================================
                                    [A안] 입체적으로 겹쳐진 카드 스타일 (Apple Music 느낌)
                                    ========================================== */
                                <div className="relative w-full h-full transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2">
                                    {/* 뒤쪽 카드 */}
                                    {work.covers.length > 2 && (
                                        <div className="absolute top-0 right-0 w-[80%] h-[90%] rounded-sm shadow-sm overflow-hidden opacity-60 rotate-[6deg] translate-x-3 -z-10">
                                            <Image src={work.covers[2]} alt="cover3" fill className="object-cover blur-[1px]" />
                                        </div>
                                    )}
                                    {/* 중간 카드 */}
                                    <div className="absolute top-2 left-0 w-[85%] h-[90%] rounded-sm shadow-md overflow-hidden opacity-80 -rotate-[4deg] -translate-x-2 z-0">
                                        <Image src={work.covers[1]} alt="cover2" fill className="object-cover" />
                                    </div>
                                    {/* 맨 앞 대표 카드 */}
                                    <div className="absolute bottom-0 right-2 w-[90%] h-[95%] rounded-sm shadow-xl overflow-hidden border border-gray-200/50 z-10">
                                        <Image src={work.covers[0]} alt="cover1" fill className="object-cover" />
                                    </div>
                                </div>
                                
                            ) : (
                                
                                /* ==========================================
                                    [B안] 2x2 분할 그리드 스타일 (Spotify 플레이리스트 느낌)
                                    ========================================== */
                                <div className="w-full h-full rounded-md shadow-md bg-gray-100 border border-gray-200 overflow-hidden transition-transform duration-500 group-hover:scale-105 p-1">
                                    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 rounded-sm overflow-hidden">
                                        {/* 최대 4장까지 그리드에 채움 (남는 칸은 배경색 노출) */}
                                        {work.covers.slice(0, 4).map((cov: string, idx: number) => (
                                            <div key={idx} className="relative w-full h-full bg-white">
                                                <Image src={cov} alt={`grid-cover-${idx}`} fill className="object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                            )
                        )}
                    </div>

                    <div className="flex flex-col flex-1">
                        <h3 className="font-bold text-[#1d1d1f] text-[14px] line-clamp-1 mb-1 group-hover:text-[#0066cc] transition-colors">{work.title}</h3>
                        <p className="text-[11px] text-gray-400 line-clamp-1 mb-3">{work.author}</p>
                        
                        <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
                            <Badge className="bg-rose-50 text-rose-500 hover:bg-rose-50 border-0 h-5 px-1.5 text-[10px] font-bold">
                                인기 작품
                            </Badge>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5 text-gray-400" title="BoooknTalk 서재에 담긴 횟수">
                                    <Users size={12} />
                                    <span className="text-[10px] font-bold pt-[1px]">{work.added_count}</span>
                                </div>
                                {work.average_rating > 0 && (
                                    <div className="flex items-center gap-0.5 text-amber-400" title="평균 별점">
                                        <Star size={10} fill="currentColor" />
                                        <span className="text-[10px] font-bold text-gray-500 pt-[1px]">{work.average_rating}</span>
                                    </div>
                                )}
                                <button 
                                    onClick={(e) => handleAddWishlist(e, work.edition_id, work.title)}
                                    className="flex items-center justify-center w-5 h-5 rounded-full text-gray-400 hover:bg-[#0066cc] hover:text-white transition-colors ml-1 z-10"
                                    title="내 서재에 담기"
                                >
                                    <BookmarkPlus size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}