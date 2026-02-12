'use client';

import React from 'react';
import Image from 'next/image';
import { 
    X, Edit3, Trash2, Share2, ChevronLeft, 
    Calendar, Clock, Quote, Plus, MoreHorizontal,
    Users, Heart, MessageCircle, ThumbsUp,
    Star
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // [NEW] 아바타 추가
import { 
    Sheet, 
    SheetContent, 
    SheetClose,
    SheetTitle 
} from "@/components/ui/sheet";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface BookDetailViewProps {
    book: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// [MOCK DATA] 다른 회원들의 가상 데이터
const COMMUNITY_REVIEWS = [
    {
        id: 1,
        user: { name: "책읽는고양이", avatar: "" },
        rating: 5,
        content: "올해 읽은 책 중 단연 최고였습니다. 작가의 통찰력이 돋보이네요.",
        date: "2일 전",
        likes: 12,
        type: "REVIEW"
    },
    {
        id: 2,
        user: { name: "MidnightReader", avatar: "" },
        rating: 4,
        content: "중반부까지는 조금 지루했지만 결말이 모든 것을 보상해줍니다.",
        date: "5일 전",
        likes: 8,
        type: "REVIEW"
    },
    {
        id: 3,
        user: { name: "Alex Kim", avatar: "" },
        content: "진정한 발견은 새로운 땅을 찾는 것이 아니라 새로운 눈을 갖는 것이다.",
        page: 124,
        date: "1주 전",
        likes: 25,
        type: "SENTENCE" // 문장 수집
    }
];

export default function BookDetailView({ book, open, onOpenChange }: BookDetailViewProps) {
    if (!book) return null;

    const totalPage = book.total_page || 300;
    const currentPage = book.current_page || (book.status === 'READING' ? 216 : 0);
    const progress = Math.round((currentPage / totalPage) * 100);
    const remainingPage = totalPage - currentPage;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent 
                className="w-[95vw] sm:max-w-[1200px] p-0 bg-[#F5F7FA] overflow-y-auto border-none sm:rounded-l-[32px]"
                side="right"
            >
                <VisuallyHidden>
                    <SheetTitle>도서 상세 정보</SheetTitle>
                </VisuallyHidden>

                <div className="max-w-6xl mx-auto min-h-full flex flex-col">
                    
                    {/* 1. 헤더 */}
                    <header className="flex items-center justify-between px-8 py-6 bg-[#F5F7FA]">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <button onClick={() => onOpenChange(false)} className="hover:text-gray-900 transition-colors flex items-center gap-1">
                                <ChevronLeft size={16} />
                                서재 홈
                            </button>
                            <span>/</span>
                            <span>상세 정보</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="gap-2 rounded-full border-gray-300 text-gray-600 bg-white">
                                <Share2 size={14} />
                                공유
                            </Button>
                            <SheetClose asChild>
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-200">
                                    <X size={20} />
                                </Button>
                            </SheetClose>
                        </div>
                    </header>

                    {/* 2. 메인 컨텐츠 */}
                    <main className="flex-1 px-8 pb-10">
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 grid grid-cols-1 lg:grid-cols-12 gap-10">
                            
                            {/* 좌측: 책 정보 */}
                            <div className="lg:col-span-4 flex flex-col items-center text-center lg:border-r lg:border-gray-100 lg:pr-10">
                                <div className="relative w-48 aspect-[1/1.5] shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-lg mb-8 transition-transform hover:scale-105 duration-500">
                                    {book.cover ? (
                                        <Image src={book.cover} alt={book.title} fill className="object-cover rounded-lg" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">No Cover</div>
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold text-[#1d1d1f] mb-2 leading-tight">{book.title}</h2>
                                <p className="text-gray-500 mb-8 font-medium">{book.author}</p>

                                <div className="w-full border border-gray-100 rounded-2xl py-4 bg-gray-50/50 mb-8 grid grid-cols-2 divide-x divide-gray-200">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">저자</p>
                                        <p className="text-sm font-semibold text-gray-700">{book.author}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">카테고리</p>
                                        <p className="text-sm font-semibold text-gray-700">소설</p> 
                                    </div>
                                </div>

                                <div className="w-full flex gap-3">
                                    <Button variant="outline" className="flex-1 rounded-xl h-11 border-gray-300 gap-2 text-gray-600 hover:bg-gray-50">
                                        <Edit3 size={16} /> 기록 수정
                                    </Button>
                                    <Button variant="outline" className="w-11 h-11 rounded-xl border-gray-300 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 p-0">
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </div>

                            {/* 우측: 대시보드 */}
                            <div className="lg:col-span-8 flex flex-col">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-lg font-bold text-[#1d1d1f]">나의 독서 현황</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        book.status === 'READING' ? 'bg-blue-50 text-blue-600' : 
                                        book.status === 'COMPLETED' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {book.status === 'READING' ? '읽는 중' : book.status === 'COMPLETED' ? '완독' : '읽고 싶은'}
                                    </span>
                                </div>

                                {/* 타임라인 & 진행률 등 (기존 코드 유지) */}
                                <div className="mb-10 px-2">
                                    <div className="relative flex justify-between items-center text-xs font-medium text-gray-400 mb-2">
                                        <span className={book.status === 'WISH' ? 'text-blue-600 font-bold' : ''}>읽고 싶은</span>
                                        <span className={book.status === 'READING' ? 'text-blue-600 font-bold' : ''}>읽는 중</span>
                                        <span className={book.status === 'COMPLETED' ? 'text-blue-600 font-bold' : ''}>완독</span>
                                        <div className="absolute top-8 left-0 w-full h-1 bg-gray-100 rounded-full -z-10"></div>
                                        <div 
                                            className="absolute top-8 left-0 h-1 bg-blue-500 rounded-full -z-10 transition-all duration-500"
                                            style={{ width: book.status === 'COMPLETED' ? '100%' : book.status === 'READING' ? '50%' : '0%' }}
                                        ></div>
                                    </div>
                                    <div className="relative flex justify-between mt-4">
                                        {[0, 1, 2].map((step) => {
                                            let isActive = false;
                                            if (book.status === 'WISH' && step === 0) isActive = true;
                                            if (book.status === 'READING' && step <= 1) isActive = true;
                                            if (book.status === 'COMPLETED' && step <= 2) isActive = true;
                                            return (
                                                <div key={step} className={`w-3 h-3 rounded-full border-2 transition-colors ${isActive ? 'bg-white border-blue-500 ring-4 ring-blue-50' : 'bg-gray-200 border-transparent'}`} />
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">현재 진행률</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-extrabold text-[#0066cc]">{progress}%</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-700">{currentPage} / {totalPage} p</p>
                                            <p className="text-xs text-gray-400">{remainingPage}p 남음</p>
                                        </div>
                                    </div>
                                    <Progress value={progress} className="h-3 bg-gray-200" indicatorClassName="bg-[#0066cc]" />
                                </div>

                                {/* 별점 */}
                                <div>
                                    <p className="text-sm font-bold text-gray-700 mb-2">나의 평점</p>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} size={24} fill={star <= (book.rating || 0) ? "#FFCC00" : "#E5E7EB"} className={star <= (book.rating || 0) ? "text-[#FFCC00]" : "text-gray-200"} />
                                        ))}
                                        <span className="text-sm font-bold text-[#1d1d1f] ml-2">{book.rating?.toFixed(1) || 0}점</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. 하단 탭 영역 (나의 기록 vs 멤버들의 생각) */}
                        <div className="mt-10">
                            <Tabs defaultValue="review" className="w-full">
                                <TabsList className="bg-transparent border-b border-gray-200 w-full justify-start h-auto p-0 mb-6 gap-8">
                                    <TabsTrigger value="review" className="tab-trigger-custom">
                                        나의 기록 (My Archive)
                                    </TabsTrigger>
                                    <TabsTrigger value="community" className="tab-trigger-custom flex items-center gap-1.5">
                                        <Users size={16} />
                                        멤버들의 생각 (Community)
                                    </TabsTrigger>
                                </TabsList>

                                {/* [TAB 1] 나의 기록 */}
                                <TabsContent value="review" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="bg-[#E3F2FD] p-6 rounded-2xl flex flex-col justify-between min-h-[200px]">
                                        <div>
                                            <p className="text-xs font-bold text-blue-600 mb-3">한 줄 평</p>
                                            <h4 className="text-xl font-bold text-[#0066cc] leading-snug">
                                                "{book.short_review || '아직 남긴 한줄평이 없습니다.'}"
                                            </h4>
                                        </div>
                                        <div className="self-end p-2 bg-white/40 rounded-full text-blue-500 cursor-pointer hover:bg-white/60 transition-colors">
                                            <Edit3 size={16} />
                                        </div>
                                    </div>

                                    {/* 메모 추가 카드 */}
                                    <div className="bg-white border-2 border-dashed border-gray-200 p-6 rounded-2xl flex flex-col justify-center items-center min-h-[200px] group hover:border-blue-300 transition-colors cursor-pointer text-gray-400 hover:text-blue-500">
                                        <Plus size={32} className="mb-2" />
                                        <span className="font-medium text-sm">새로운 메모 작성</span>
                                    </div>
                                </TabsContent>
                                
                                {/* [TAB 2] 멤버들의 생각 (NEW) */}
                                <TabsContent value="community" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        
                                        {/* 통계 사이드바 */}
                                        <div className="lg:col-span-1 space-y-4">
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <Users size={16} className="text-blue-500"/> 독서 통계
                                                </h4>
                                                <div className="flex items-end gap-2 mb-2">
                                                    <span className="text-3xl font-extrabold text-[#1d1d1f]">128</span>
                                                    <span className="text-sm text-gray-500 mb-1">명이 읽었어요</span>
                                                </div>
                                                <div className="w-full bg-gray-100 h-1.5 rounded-full mb-4">
                                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '70%'}}></div>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-500">
                                                    <span>평균 평점</span>
                                                    <span className="font-bold text-[#1d1d1f] flex items-center gap-1">
                                                        <Star size={12} fill="#FFCC00" className="text-[#FFCC00]"/> 4.5
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 피드 리스트 */}
                                        <div className="lg:col-span-2 space-y-4">
                                            {COMMUNITY_REVIEWS.map((item) => (
                                                <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
                                                    {/* 아바타 */}
                                                    <Avatar className="w-10 h-10 border border-gray-100">
                                                        <AvatarImage src={item.user.avatar} />
                                                        <AvatarFallback className="bg-gray-100 text-gray-500 text-xs font-bold">
                                                            {item.user.name.slice(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    {/* 내용 */}
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-sm font-bold text-[#1d1d1f]">{item.user.name}</span>
                                                            <span className="text-xs text-gray-400">{item.date}</span>
                                                        </div>

                                                        {/* 문장 수집일 경우 스타일 다르게 */}
                                                        {item.type === 'SENTENCE' ? (
                                                            <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-400 mb-3 mt-1">
                                                                <p className="text-sm text-gray-700 italic font-serif leading-relaxed">"{item.content}"</p>
                                                                <p className="text-xs text-gray-400 mt-2 text-right">p.{item.page}</p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex items-center gap-0.5 mb-2">
                                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                                        <Star key={s} size={12} fill={s <= (item.rating || 0) ? "#FFCC00" : "#E5E7EB"} className="text-transparent" />
                                                                    ))}
                                                                </div>
                                                                <p className="text-sm text-gray-600 leading-relaxed mb-3">{item.content}</p>
                                                            </>
                                                        )}

                                                        {/* 좋아요 액션 */}
                                                        <div className="flex items-center gap-4">
                                                            <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors group">
                                                                <Heart size={14} className="group-hover:fill-red-500" />
                                                                <span>{item.likes}</span>
                                                            </button>
                                                            <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-500 transition-colors">
                                                                <MessageCircle size={14} />
                                                                <span>댓글 달기</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                            </Tabs>
                        </div>
                    </main>
                </div>
            </SheetContent>

            {/* 스타일 태그 (커스텀 클래스용) */}
            <style jsx global>{`
                .tab-trigger-custom {
                    background-color: transparent;
                    border-bottom-width: 2px;
                    border-color: transparent;
                    border-radius: 0;
                    padding-left: 0;
                    padding-right: 0;
                    padding-bottom: 0.75rem;
                    font-size: 1rem;
                    font-weight: 500;
                    color: #9CA3AF;
                }
                .tab-trigger-custom[data-state='active'] {
                    border-color: #2563EB;
                    color: #2563EB;
                    box-shadow: none;
                }
            `}</style>
        </Sheet>
    );
}