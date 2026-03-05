'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Container from '@/components/layout/Container'; 
import { ArrowLeft, BookOpen, Star, Library } from 'lucide-react';

export default function UserLibraryPage() {
    const params = useParams();
    
    // ▼▼▼ [수정] 이 부분이 빠져 있었습니다. 추가해주세요! ▼▼▼
    const router = useRouter(); 
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    const userId = params.userId; 
    
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        
        // 백엔드 API 호출
        fetch(`http://localhost:8000/api/library/users/${userId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                return res.json();
            })
            .then(data => {
                setData(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, [userId]);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">Loading...</div>;
    if (!data) return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">사용자를 찾을 수 없습니다.</div>;

    const { profile, stats, books } = data;

    return (
        <div className="min-h-screen bg-[#F5F5F7] pb-20">
            {/* 1. 상단 네비게이션 */}
            <div className="bg-white sticky top-0 z-40 border-b border-gray-100">
                <Container className="py-4 flex items-center gap-4 max-w-[1000px]">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <span className="font-bold text-lg text-[#1d1d1f]">{profile.nickname}의 서재</span>
                </Container>
            </div>

            {/* 2. 프로필 헤더 */}
            <div className="bg-white pb-10 pt-8 border-b border-gray-200">
                <Container className="flex flex-col md:flex-row items-center md:items-start gap-8 max-w-[1000px]">
                    {/* 프로필 이미지 */}
                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden shrink-0 bg-gray-100">
                        {profile.profile_image ? (
                            <Image src={profile.profile_image} alt={profile.nickname} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-300">
                                {profile.nickname.charAt(0)}
                            </div>
                        )}
                    </div>

                    {/* 텍스트 정보 */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-[#1d1d1f] mb-2">{profile.nickname}</h1>
                        <p className="text-gray-500 font-medium mb-6 max-w-lg leading-relaxed">{profile.bio}</p>
                        
                        {/* 통계 배지 */}
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center md:items-start px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-[11px] font-bold text-gray-400 uppercase">Total</span>
                                <span className="text-xl font-extrabold text-[#1d1d1f]">{stats.total_books}</span>
                            </div>
                            <div className="flex flex-col items-center md:items-start px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-[11px] font-bold text-gray-400 uppercase">Finished</span>
                                <span className="text-xl font-extrabold text-[#0066cc]">{stats.finished_count}</span>
                            </div>
                             <div className="flex flex-col items-center md:items-start px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-[11px] font-bold text-gray-400 uppercase">Reading</span>
                                <span className="text-xl font-extrabold text-[#33C759]">{stats.reading_count}</span>
                            </div>
                        </div>
                    </div>
                </Container>
            </div>

            {/* 3. 책장 (Collection) */}
            <Container className="mt-10 max-w-[1000px]">
                <div className="flex items-center gap-2 mb-6">
                    <Library size={20} className="text-[#1d1d1f]" />
                    <h2 className="text-lg font-bold text-[#1d1d1f]">Collection</h2>
                </div>

                {books.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-gray-200 border-dashed">
                        <BookOpen size={40} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium">아직 서재에 담긴 책이 없습니다.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
                        {books.map((book: any) => (
                            <div 
                                key={book.record_id} 
                                // [클릭 이벤트] 이제 router가 정의되어 정상 작동합니다.
                                onClick={() => router.push(`/library/${book.record_id}`)} 
                                className="group cursor-pointer flex flex-col gap-3"
                            >
                                {/* 책 표지 */}
                                <div className="relative aspect-[1/1.5] w-full bg-white shadow-md rounded-[4px] overflow-hidden transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-xl border border-gray-100">
                                    {book.cover_image ? (
                                        <Image src={book.cover_image} alt={book.work_title} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">No Cover</div>
                                    )}
                                    
                                    {/* 상태 라벨 */}
                                    {book.status === 'READING' && (
                                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                                            Reading
                                        </div>
                                    )}
                                </div>
                                
                                {/* 책 정보 */}
                                <div>
                                    <h3 className="font-bold text-[15px] text-[#1d1d1f] leading-snug line-clamp-2 mb-1 group-hover:text-[#0066cc] transition-colors">
                                        {book.work_title}
                                    </h3>
                                    <div className="flex items-center gap-1">
                                        <Star size={12} className="text-[#FFCC00]" fill="currentColor" />
                                        <span className="text-[12px] font-bold text-gray-600">{book.rating > 0 ? book.rating : '-'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Container>
        </div>
    );
}