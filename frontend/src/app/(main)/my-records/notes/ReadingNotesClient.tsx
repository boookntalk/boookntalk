'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { Home, ChevronRight, PenTool, Globe, Lock, BookOpen, Loader2, Hash, MessageSquareQuote, Calendar } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCardAuthor } from '@/utils/formatters';

import { BookRecordCard } from '@/components/common/BookRecordCard';
import { SmartTruncatedText } from '@/components/common/SmartTruncatedText';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ▼ 스마트 말줄임 툴팁 컴포넌트 (유지)
function TruncatedMemo({ content }: { content: string }) {
    const textRef = useRef<HTMLParagraphElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        const checkTruncation = () => {
            if (textRef.current) {
                setIsTruncated(textRef.current.scrollHeight > textRef.current.clientHeight);
            }
        };
        checkTruncation();
        window.addEventListener('resize', checkTruncation);
        return () => window.removeEventListener('resize', checkTruncation);
    }, [content]);

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex-1 mb-4 w-full text-left cursor-pointer">
                        <p ref={textRef} className="text-[13px] text-gray-600 leading-relaxed font-medium break-keep line-clamp-4">
                            {content || "기록된 내용이 없습니다."}
                        </p>
                    </div>
                </TooltipTrigger>
                {isTruncated && (
                    <TooltipContent side="top" align="center" className="w-[280px] bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-gray-100 max-h-[250px] overflow-y-auto scrollbar-hide z-50">
                        <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">{content}</p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
}

export default function ReadingNotesClient({ initialNotes = [] }: { initialNotes?: any[] }) {
    const { status } = useSession();
    const router = useRouter();
    const [notes, setNotes] = useState<any[]>(initialNotes);

    if (status === 'loading') return <div className="w-full h-full flex justify-center items-center"><Loader2 className="animate-spin text-[#0066cc]" size={40} /></div>;

    const togglePublicStatus = async (noteId: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_public: newStatus } : n));
        try {
            await fetch(`${API_URL}/api/memos/${noteId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_public: newStatus }) });
            toast.success(newStatus ? "전체 공개되었습니다." : "비공개되었습니다.");
        } catch {
            setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_public: currentStatus } : n));
            toast.error("상태 변경 실패");
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#F5F5F7]">
            {/* 상단 네비게이션 */}
            <div className="flex-none bg-[#F5F5F7]/90 backdrop-blur-md z-30 pt-4 px-[var(--spacing-1cm,32px)] border-b border-gray-200 sticky top-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[13px] font-bold text-gray-400">
                        <Link href="/" className="flex items-center gap-1.5 hover:text-[#0066cc]"><Home size={15} /> 홈</Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-gray-400">나의 기록</span>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-[#1d1d1f] flex items-center gap-1"><PenTool size={14} /> 독서노트</span>
                    </div>
                </div>
                <div className="flex flex-col mb-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-[22px] font-black text-[#1d1d1f] flex items-center gap-2"><PenTool size={24} className="text-[#0066cc] fill-blue-100" /> 독서노트</h1>
                        <Badge variant="secondary" className="bg-gray-200/50 text-gray-500 text-[12px] font-bold px-2 py-0.5">{notes.length}개</Badge>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="p-[var(--spacing-1cm,32px)] pt-6 pb-32">
                    {notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400 bg-white rounded-sm p-4 shadow-sm border border-dashed border-gray-200 mt-4">
                            <PenTool size={40} strokeWidth={1.5} className="mb-3 opacity-30 text-[#0066cc]" />
                            <p className="font-bold text-[14px] text-gray-500 mb-1">아직 작성된 독서 노트가 없습니다.</p>
                        </div>
                    ) : (
                        <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
                            {notes.map((note) => (
                                <BookRecordCard 
                                    key={note.id} id={note.id}
                                    onClick={() => router.push(`/library/${note.library_id}#memo`)}
                                    book_cover={note.book_cover} book_title={note.book_title} book_author={note.book_author}
                                    children={<SmartTruncatedText content={note.content} wrapQuotes={false} />}
                                    footerLeft={<><Calendar size={12} /> {note.created_at?.split('T')[0]}</>}
                                    footerRight={
                                        <button onClick={() => togglePublicStatus(note.id, note.is_public)} className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${note.is_public ? 'text-[#0066cc] bg-blue-50 hover:bg-blue-100' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}>
                                            {note.is_public ? <Globe size={10}/> : <Lock size={10}/>} {note.is_public ? '전체 공개' : '나만 보기'}
                                        </button>
                                    }
                                />
                            ))}
                        </main>
                    )}
                </div>
            </div>
        </div>
    );
}