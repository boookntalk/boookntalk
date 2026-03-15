'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Container from '@/components/layout/Container';
import Footer from '@/components/layout/Footer';
import { Loader2, ChevronLeft, Star, User, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function ReviewDetailPage() {
    const params = useParams();
    const router = useRouter();
    // ▼ user_id 제거하고 review_id만 깔끔하게 받습니다
    const reviewId = params.review_id as string;

    const [review, setReview] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!reviewId) return;

        const fetchReviewDetail = async () => {
            setIsLoading(true);
            try {
                // ▼ 호출 API 주소도 심플하게 변경!
                const res = await fetch(`http://localhost:8000/api/reviews/${reviewId}`);
                if (res.ok) {
                    const data = await res.json();
                    setReview(data);
                } else {
                    toast.error("존재하지 않거나 삭제된 서평입니다.");
                    router.back();
                }
            } catch (error) {
                console.error("서평 상세 로딩 에러:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviewDetail();
    }, [reviewId, router]);

    if (isLoading) {
        return (
            <div className="w-full h-[calc(100vh-64px)] bg-[#F5F5F7] flex justify-center items-center">
                <Loader2 className="animate-spin text-[#0066cc]" size={40} />
            </div>
        );
    }

    if (!review) return null;

    return (
        <div className="w-full h-full overflow-y-auto scrollbar-hide bg-[#F5F5F7] flex flex-col">
            <Container className="pt-[var(--spacing-1cm,32px)] pb-32 max-w-3xl">
                
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[13px] font-bold text-gray-400 hover:text-[#1d1d1f] transition-colors mb-8">
                    <ChevronLeft size={16} /> 이전으로 돌아가기
                </button>

                <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div onClick={() => router.push(`/work/${review.book.work_id}`)} className="flex items-center gap-4 p-6 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors group">
                        <div className="w-12 h-16 relative rounded shadow-sm overflow-hidden bg-white border border-gray-200 shrink-0">
                            {review.book.cover ? <Image src={review.book.cover} alt="cover" fill className="object-cover" /> : <BookOpen size={20} className="m-auto mt-5 text-gray-300" />}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[15px] font-bold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors line-clamp-1">{review.book.title}</h4>
                            <p className="text-[12px] text-gray-500 line-clamp-1 mt-0.5">{review.book.author}</p>
                            <div className="flex items-center gap-1 mt-1.5 text-amber-400">
                                <Star size={12} fill="currentColor" />
                                <span className="text-[12px] font-bold text-gray-700">{review.rating}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 md:p-10 border-b border-gray-100">
                        <h1 className="text-[28px] md:text-[32px] font-black text-[#1d1d1f] leading-tight mb-8 break-keep">{review.title}</h1>
                        <div className="flex items-center justify-between">
                            <Link href={`/library/${review.author.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <div className="w-10 h-10 rounded-full bg-gray-100 relative overflow-hidden flex items-center justify-center border border-gray-200">
                                    {review.author.profile_image ? <Image src={review.author.profile_image} alt="profile" fill className="object-cover" /> : <User size={20} className="text-gray-400" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-[14px] text-[#1d1d1f]">{review.author.nickname}</span>
                                    <span className="text-[12px] text-gray-400">{review.created_at.substring(0, 10)}</span>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="p-8 md:p-10 text-[16px] text-[#333333] leading-loose break-words whitespace-pre-wrap">
                        <div dangerouslySetInnerHTML={{ __html: review.content }} className="prose prose-blue max-w-none" />
                    </div>
                </article>

            </Container>
            <Footer />
        </div>
    );
}