// 파일 경로: src/app/(main)/my-authors/timeline/AuthorTimelineClient.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ChevronRight, Clock, ExternalLink, BookOpen, Loader2, X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

// 💡 직접 넣었던 사이드바를 빼고 공통 레이아웃 컴포넌트 임포트
import SubPageLayout from '@/components/layout/SubPageLayout';

interface BookstoreModalData {
    isOpen: boolean;
    bookTitle: string;
    isbn: string;
}

export default function AuthorTimelineClient() {
    const router = useRouter();
    
    const [timelineData, setTimelineData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalData, setModalData] = useState<BookstoreModalData>({ isOpen: false, bookTitle: '', isbn: '' });

    useEffect(() => {
        const fetchTimeline = async () => {
            setIsLoading(true);
            try {
                setTimeout(() => {
                    setTimelineData([
                        { year: "2024", books: [{ id: 101, title: "불안의 책 (2024 개정판)", publish_date: "2024-05-10", is_in_square: true, isbn: "9781234567890" }] },
                        { year: "2023", books: [{ id: 102, title: "내면의 기록", publish_date: "2023-11-20", is_in_square: false, isbn: "9780987654321" }, { id: 103, title: "사색의 시간", publish_date: "2023-02-15", is_in_square: true, isbn: "9781122334455" }] },
                        { year: "2020", books: [{ id: 104, title: "초기 단편집", publish_date: "2020-08-05", is_in_square: false, isbn: "9785566778899" }] }
                    ]);
                    setIsLoading(false);
                }, 500);
            } catch (error) {
                setIsLoading(false);
            }
        };
        fetchTimeline();
    }, []);

    const handleBookClick = (book: any) => {
        if (book.is_in_square) {
            router.push(`/library/square/${book.id}`);
        } else {
            setModalData({ isOpen: true, bookTitle: book.title, isbn: book.isbn });
        }
    };

    return (
        // 💡 하드코딩된 레이아웃 껍데기를 모두 걷어내고 SubPageLayout으로 통일!
        <SubPageLayout
            breadcrumb={
                <>
                    <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors"><Home size={15} /> 홈</Link>
                    <ChevronRight size={14} className="opacity-50" />
                    <span className="text-gray-400">나의 작가</span>
                    <ChevronRight size={14} className="opacity-50" />
                    <span className="text-[#1d1d1f] flex items-center gap-1"><Clock size={14} /> 작가 타임라인</span>
                </>
            }
            titleOrTabs={
                <div className="flex items-center gap-3 pb-0 w-full">
                    <h1 className="text-[20px] md:text-[22px] font-black leading-none text-[#1d1d1f] flex items-center gap-2">
                        <Clock size={22} className="text-[#0066cc]" /> 
                        작가의 발자취
                    </h1>
                </div>
            }
        >
            <div className="w-full pb-32">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#0066cc] mb-4" />
                        <p className="text-[14px] font-bold text-gray-400 animate-pulse">발간 히스토리를 불러오는 중입니다...</p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        <div className="relative border-l-2 border-[#0066cc]/20 ml-3 md:ml-6 space-y-12">
                            {timelineData.map((yearData, index) => (
                                <div key={index} className="relative pl-8 md:pl-12">
                                    <div className="absolute w-6 h-6 bg-[#F5F5F7] border-4 border-[#0066cc] rounded-full -left-[13px] top-0 shadow-sm z-10"></div>
                                    <h2 className="text-[28px] font-black text-[#1d1d1f] leading-none mb-6 -mt-1 tracking-tight">
                                        {yearData.year}
                                    </h2>

                                    <div className="flex flex-col gap-4">
                                        {yearData.books.map((book: any) => (
                                            <div key={book.id} onClick={() => handleBookClick(book)} className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-[#0066cc]/30 hover:shadow-md transition-all cursor-pointer flex items-center justify-between">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-[16px] font-bold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors line-clamp-1">{book.title}</h3>
                                                        {!book.is_in_square && <Badge variant="outline" className="bg-gray-50 text-gray-400 border-gray-200 text-[10px] px-1.5 py-0">미등록</Badge>}
                                                    </div>
                                                    <p className="text-[14px] font-medium text-gray-400 flex items-center gap-1.5"><BookOpen size={12} /> 출간일: {book.publish_date}</p>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#e6f0fa] transition-colors shrink-0">
                                                    {book.is_in_square ? <ChevronRight size={16} className="text-gray-400 group-hover:text-[#0066cc]" /> : <ExternalLink size={14} className="text-gray-400 group-hover:text-[#0066cc]" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 외부 서점 선택 모달 */}
            {modalData.isOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-[#1d1d1f]/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-[18px] font-black text-[#1d1d1f] mb-1">외부 서점에서 보기</h3>
                                <p className="text-[14px] font-bold text-gray-400 line-clamp-1">"{modalData.bookTitle}"</p>
                            </div>
                            <button onClick={() => setModalData(prev => ({ ...prev, isOpen: false }))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-3 bg-gray-50/50">
                            <a href={`https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=All&SearchWord=${modalData.isbn}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-[#0066cc] hover:shadow-sm transition-all group">
                                <span className="text-[15px] font-bold text-[#1d1d1f] group-hover:text-[#0066cc]">알라딘에서 보기</span>
                                <ExternalLink size={16} className="text-gray-400 group-hover:text-[#0066cc]" />
                            </a>
                            <a href={`https://search.kyobobook.co.kr/search?keyword=${modalData.isbn}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-[#0066cc] hover:shadow-sm transition-all group">
                                <span className="text-[15px] font-bold text-[#1d1d1f] group-hover:text-[#0066cc]">교보문고에서 보기</span>
                                <ExternalLink size={16} className="text-gray-400 group-hover:text-[#0066cc]" />
                            </a>
                            <a href={`https://www.yes24.com/Product/Search?domain=ALL&query=${modalData.isbn}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-[#0066cc] hover:shadow-sm transition-all group">
                                <span className="text-[15px] font-bold text-[#1d1d1f] group-hover:text-[#0066cc]">YES24에서 보기</span>
                                <ExternalLink size={16} className="text-gray-400 group-hover:text-[#0066cc]" />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </SubPageLayout>
    );
}