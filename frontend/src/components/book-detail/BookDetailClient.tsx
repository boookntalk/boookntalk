// frontend/src/components/book-detail/BookDetailClient.tsx

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/layout/Container';
import BookTopInfo from './BookTopInfo'; // 위에서 만든 컴포넌트 import
import { ChevronLeft } from 'lucide-react';

export default function BookDetailClient({ initialData, user }: { initialData: any, user: any }) {
    const router = useRouter();
    
    const { record, work, current_edition, my_editions } = initialData;

    // [핸들러] 에디션 변경 (다른 기록 ID로 페이지 이동)
    const handleRecordChange = (targetRecordId: string) => {
        router.push(`/library/${targetRecordId}`);
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7]">
            {/* 1. 글로벌 네비게이션 대용 (뒤로가기) */}
            <div className="bg-white border-b border-gray-200">
                {/* h-12 대신 수직 패딩(py-6)을 사용하여 내 서재의 타이틀 볼륨감을 맞춤 */}
                <Container className="pt-5 pb-6 flex items-center">
                    <button 
                        onClick={() => router.back()} 
                        className="flex items-center gap-2 text-[15px] font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors group"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="tracking-tight">서재 목록으로 돌아가기</span>
                    </button>
                </Container>
            </div>

            {/* 2. [Top Section] 책 정보 + 나의 핵심 기록 */}
            <BookTopInfo 
                record={record}
                edition={current_edition}
                work={work}
                myEditions={my_editions}
                onRecordChange={(targetRecordId) => router.push(`/library/${targetRecordId}`)}
            />

            {/* 3. [Bottom Section] 사용자 콘텐츠 (UGC) - 다음 단계 개발 영역 */}
            <Container className="py-12 max-w-[1440px]">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    
                    {/* 왼쪽: 콘텐츠 네비게이션 (Sticky Menu) */}
                    <div className="hidden md:block md:col-span-3">
                        <div className="sticky top-20">
                            <h4 className="font-bold text-gray-400 mb-4 text-xs uppercase tracking-wider">Contents</h4>
                            <ul className="space-y-4 text-sm text-gray-600 border-l border-gray-200 pl-4">
                                <li className="font-bold text-[#1d1d1f] -ml-[17px] border-l-2 border-black pl-3.5 transition-all">
                                    기억의 지층
                                </li>
                                <li className="hover:text-black cursor-pointer transition-colors">
                                    심층 리뷰
                                </li>
                                <li className="hover:text-black cursor-pointer transition-colors">
                                    독서 리포트
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* 오른쪽: 실제 콘텐츠 영역 (Placeholder) */}
                    <div className="md:col-span-9 flex flex-col gap-8">
                        {/* 문장 수집 & 메모 영역 */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 min-h-[300px] flex flex-col items-center justify-center text-center gap-4">
                            <h3 className="text-lg font-bold text-gray-300">기억의 지층 (Memory Layer)</h3>
                            <p className="text-gray-400 text-sm max-w-md">
                                여기에 사용자가 수집한 문장(Highlight)과 <br/>그때의 감정 태그가 쌓이는 공간이 됩니다.
                            </p>
                        </div>

                        {/* 히스토리 영역 */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 min-h-[200px] flex items-center justify-center text-gray-300 font-bold">
                             History & Community Area
                        </div>
                    </div>

                </div>
            </Container>
        </div>
    );
}