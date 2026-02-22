'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { BookType, Plus, Loader2, Library } from 'lucide-react';

const formatCardAuthor = (authorStr: string) => {
    if (!authorStr) return "저자 미상";

    return authorStr
        // 1. 역할이 다른 저자 그룹 사이의 구분자를 쌍반점( ; )으로 변경
        .replace(/\)\s*,\s*/g, ') ; ')
        
        // 2. 한국어 역할 표기 변환
        .replace(/\(지은이\)/g, '지음')
        .replace(/\(저자\)/g, '지음')
        .replace(/\(글\)/g, '글')
        .replace(/\(옮긴이\)/g, '옮김')
        .replace(/\(역자\)/g, '옮김')
        .replace(/\(번역\)/g, '옮김')
        .replace(/\(그림\)/g, '그림')
        .replace(/\(삽화\)/g, '그림')
        .replace(/\(엮은이\)/g, '엮음')
        .replace(/\(편저\)/g, '엮음')
        .replace(/\(감수\)/g, '감수')

        // 3. [NEW] 원서(영문) 역할 표기 변환 (대소문자 무시 플래그 'i' 사용)
        .replace(/\(author\)/gi, '지음')
        .replace(/\(writer\)/gi, '지음')
        .replace(/\(translator\)/gi, '옮김')
        .replace(/\(illustrator\)/gi, '그림')
        .replace(/\(editor\)/gi, '엮음')
        
        // 4. 미처 처리되지 않은 기타 괄호가 있다면 제거
        .replace(/[()]/g, '')
        .trim();
};

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const { data: session } = useSession();
    const router = useRouter();

    const [savingIsbn, setSavingIsbn] = useState<string | null>(null);

    // 1. 로컬 DB 키워드 검색
    useEffect(() => {
        if (!query) return;

        const fetchResults = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/books/search/keyword?query=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error('검색 실패');
                const data = await res.json();
                setResults(data.items || []);
                setTotal(data.total || 0);
            } catch (error) {
                toast.error('검색 결과를 불러오는데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    // 2. 다른 회원이 등록한 책을 내 서재로 가져오기 (0.1초 컷)
    const handleAddToLibrary = async (book: any) => {
        if (!session?.user?.email) {
            toast.error('로그인이 필요한 기능입니다.');
            return;
        }

        setSavingIsbn(book.isbn);
        try {
            // 이미 DB에 있는 책이므로 기존 /api/books 에 던지면 빠르게 연결만 해줍니다.
            const payload = {
                user_email: session.user.email,
                title: book.title,
                author: book.author,
                publisher: book.publisher,
                pubDate: book.pubDate,
                cover: book.cover,
                description: book.description,
                isbn: book.isbn,
                pageCount: book.pageCount,
                categoryName: book.categoryName,
                price: book.price
            };

            const bookRes = await fetch('http://127.0.0.1:8000/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!bookRes.ok) {
                const errData = await bookRes.json();
                if (errData.detail === "이미 서재에 등록된 도서입니다.") {
                    toast.info('이미 내 서재에 담겨있는 책입니다.', {
                        action: { label: '서재로 이동', onClick: () => router.push('/library') }
                    });
                    return;
                }
                throw new Error('서재 등록 실패');
            }
            
            router.refresh();

            toast.success('내 서재에 성공적으로 담겼습니다!', {
                action: { label: '서재로 이동', onClick: () => router.push('/library') }
            });

        } catch (error) {
            console.error(error);
            toast.error('서재에 담는 중 오류가 발생했습니다.');
        } finally {
            setSavingIsbn(null);
        }
    };

    if (!query) {
        return (
            <div className="max-w-[1440px] mx-auto px-6 py-20 text-center text-gray-500">
                검색어를 입력해주세요.
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto px-6 py-10 min-h-[calc(100vh-56px)]">
            <div className="mb-8 border-b border-gray-200 pb-6 flex items-end justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#1d1d1f] tracking-tight">
                        <span className="text-[#0066cc]">'{query}'</span> 검색 결과
                    </h1>
                    <p className="text-[14px] text-gray-500 mt-2 font-medium flex items-center gap-1.5">
                        <Library size={14} />
                        BoooknTalk 멤버들이 등록한 {total.toLocaleString()}건의 도서를 찾았습니다.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                    <Loader2 size={40} className="animate-spin mb-4 text-[#0066cc]" />
                    <p className="font-medium text-sm">서재를 탐색하는 중입니다...</p>
                </div>
            ) : results.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
                    {results.map((book, idx) => (
                        <div key={`${book.isbn}-${idx}`} className="flex flex-col group relative">
                            {/* 표지 영역 */}
                            <div className="relative aspect-[1/1.45] w-full bg-gray-50 rounded-r-lg rounded-l-sm shadow-[0_4px_10px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden mb-3 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
                                {book.cover ? (
                                    <Image src={book.cover} alt={book.title} fill className="object-cover" unoptimized />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                        <BookType size={32} className="mb-2 opacity-30" />
                                        <span className="text-[10px] font-bold">No Cover</span>
                                    </div>
                                )}
                                
                                {/* 책등(Spine) 효과 */}
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />

                                {/* 마우스 호버 시 나타나는 오버레이 (서재 담기 액션) */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                    <button 
                                        onClick={() => handleAddToLibrary(book)}
                                        disabled={savingIsbn === book.isbn}
                                        className="bg-[#0066cc] text-white px-5 py-2.5 rounded-full font-bold text-[13px] flex items-center gap-1.5 hover:bg-[#0052a3] hover:scale-105 transition-all disabled:opacity-50 shadow-lg"
                                    >
                                        {savingIsbn === book.isbn ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Plus size={16} strokeWidth={2.5} />
                                        )}
                                        {savingIsbn === book.isbn ? '담는 중...' : '내 서재에 담기'}
                                    </button>
                                </div>
                            </div>

                            {/* 도서 메타데이터 영역 */}
                            <h3 className="font-bold text-[#1d1d1f] text-[14px] leading-snug line-clamp-2 mb-1 group-hover:text-[#0066cc] transition-colors break-keep">
                                {book.title}
                            </h3>
                            <p className="text-[12px] text-gray-500 line-clamp-1 mb-0.5">
                                {book.author.replace(/;/g, ' • ').replace(/\|/g, ' • ')}
                            </p>
                            <p className="text-[11px] text-gray-400 font-medium">
                                {book.publisher}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-32 text-center text-gray-500 bg-gray-50 rounded-2xl border border-gray-100">
                    <BookType size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-[15px] font-bold text-gray-600 mb-1">아직 등록된 책이 없습니다.</p>
                    <p className="text-[13px]">우측 하단의 <strong className="text-[#0066cc]">+</strong > 버튼을 눌러 이 책의 첫 번째 발견자가 되어보세요!</p>
                </div>
            )}
        </div>
    );
}

// Next.js 14 요구사항: useSearchParams를 사용하는 컴포넌트는 Suspense로 감싸야 함
export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#0066cc]"/>
            </div>
        }>
            <SearchResultsContent />
        </Suspense>
    );
}