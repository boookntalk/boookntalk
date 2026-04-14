// 경로: frontend/src/app/(main)/my-records/notes/ReadingNotesClient.tsx
// 역할 및 기능: BoooknTalk 독서노트 클라이언트 화면. SubPageLayout 마스터 템플릿을 적용하여 1cm 간격 룰을 준수하고, 기존의 불필요한 div 래퍼와 하드코딩된 배경색(bg-[#F5F5F7])을 모두 제거하여 UI 충돌을 완벽하게 해결했습니다.

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Home, ChevronRight, PenTool, Globe, Lock, Calendar } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

import { BookRecordCard } from '@/components/common/BookRecordCard';
import { SmartTruncatedText } from '@/components/common/SmartTruncatedText';

// 💡 공통 레이아웃 컴포넌트 임포트
import StandardContainer from '@/components/layout/StandardContainer';
import SubPageLayout from '@/components/layout/SubPageLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ReadingNotesClient() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    const [notes, setNotes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
            return;
        }

        if (session?.user?.email) {
            fetchReadingNotes(session.user.email);
        }
    }, [session, status, router]);

    /**
     * 기능: 로그인한 사용자의 이메일을 기반으로 백엔드 API에서 독서 노트 목록을 불러옵니다.
     */
    const fetchReadingNotes = async (email: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/memos/user/${email}`);
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            }
        } catch (error) {
            console.error("독서 노트 로딩 실패:", error);
            toast.error("데이터를 불러오는 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 기능: 특정 독서 노트의 공개/비공개 상태를 토글(전환)하고 서버에 반영합니다.
     */
    const togglePublicStatus = async (noteId: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_public: newStatus } : n));
        try {
            await fetch(`${API_URL}/api/memos/${noteId}`, { 
                method: 'PATCH', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ is_public: newStatus }) 
            });
            toast.success(newStatus ? "전체 공개되었습니다." : "비공개되었습니다.");
        } catch {
            setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_public: currentStatus } : n));
            toast.error("상태 변경 실패");
        }
    };

    if (isLoading || status === 'loading') {
        return (
            <StandardContainer size="wide" className="min-h-[60vh] flex flex-col justify-center items-center">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
                    <div className="w-2.5 h-2.5 bg-[#0066cc]/80 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
                    <div className="w-2.5 h-2.5 bg-[#0066cc]/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                </div>
                <p className="text-[13px] font-bold text-gray-400 tracking-wide animate-pulse">
                    사색의 흔적을 불러오는 중...
                </p>
            </StandardContainer>
        );
    }

    return (
        // 💡 모든 외부 div 껍데기를 없애고 오직 SubPageLayout 하나로만 화면을 구성합니다.
        <SubPageLayout
            breadcrumb={
                <>
                    <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                        <Home size={15} /> <span>홈</span>
                    </Link>
                    <ChevronRight size={14} className="opacity-50" />
                    <span className="text-gray-400">나의 기록</span>
                    <ChevronRight size={14} className="opacity-50" />
                    <span className="text-[#1d1d1f] flex items-center gap-1">
                        <PenTool size={14} /> 독서노트
                    </span>
                </>
            }
            titleOrTabs={
                <div className="flex items-center gap-3 pb-0 w-full">
                    {/* H1 폰트 공백(line-height)을 없애 카드 시작 위치를 내 서재와 일치시킴 */}
                    <h1 className="text-[20px] md:text-[22px] font-black leading-none text-[#1d1d1f] flex items-center gap-2">
                        <PenTool size={22} className="text-[#0066cc] fill-blue-100" /> 
                        독서노트
                    </h1>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[12px] font-bold px-2 py-0.5 mt-1">
                        {notes.length}개
                    </Badge>
                </div>
            }
        >
            <div className="flex flex-col gap-10">
                {notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-gray-400 bg-white rounded-3xl border border-dashed border-[#E7E2D9] mt-4">
                        <PenTool size={40} strokeWidth={1.5} className="mb-3 opacity-30 text-[#0066cc]" />
                        <p className="font-bold text-[14px] text-gray-500 mb-1">아직 작성된 독서 노트가 없습니다.</p>
                        <p className="text-[12px] text-gray-400">책을 읽으며 떠오른 생각과 문장을 기록해 보세요!</p>
                    </div>
                ) : (
                    <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {notes.map((note) => (
                            <BookRecordCard 
                                key={note.id} 
                                id={note.id}
                                onClick={() => router.push(`/library/${note.library_id}#memo`)}
                                book_cover={note.book_cover} 
                                book_title={note.book_title} 
                                book_author={note.book_author}
                                children={
                                    <SmartTruncatedText 
                                        content={note.content} 
                                        wrapQuotes={false} 
                                        textClassName="text-[14px] text-gray-600 leading-relaxed" 
                                    />
                                }
                                footerLeft={<><Calendar size={12} /> {note.created_at?.split('T')[0]}</>}
                                footerRight={
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePublicStatus(note.id, note.is_public);
                                        }} 
                                        className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${note.is_public ? 'text-[#0066cc] bg-blue-50 hover:bg-blue-100' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
                                    >
                                        {note.is_public ? <Globe size={10}/> : <Lock size={10}/>} {note.is_public ? '전체 공개' : '나만 보기'}
                                    </button>
                                }
                            />
                        ))}
                    </main>
                )}
            </div>
        </SubPageLayout>
    );
}