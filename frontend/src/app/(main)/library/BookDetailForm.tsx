'use client';

import React, { useState, useEffect } from 'react';
import { Star, Calendar as CalendarIcon, X, Book, Smartphone, Headphones, Hash, Globe, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

// 반쪽 별을 위한 SVG 그래디언트
const StarGradientDef = () => (
    <svg width="0" height="0" className="absolute hidden">
        <defs>
            <linearGradient id="half-star" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="50%" stopColor="#FFCC00" />
                <stop offset="50%" stopColor="#E5E5E7" />
            </linearGradient>
        </defs>
    </svg>
);

// [1] Props에 onSaved 콜백 추가
interface BookDetailFormProps {
    initialData: any;
    onClose: () => void;
    onSaved?: (updatedData: any) => void; // ▼ NEW
}

export default function BookDetailForm({ initialData, onClose, onSaved }: BookDetailFormProps) {
    const router = useRouter();
    
    // 기본 상태
    const [status, setStatus] = useState<string>(() => {
        const s = initialData?.status?.toLowerCase();
        if (s === 'completed') return 'finished';
        return s || 'wish';
    });
    const [rating, setRating] = useState<number>(initialData?.rating || 0);
    const [startDate, setStartDate] = useState<string>(initialData?.start_date ? initialData.start_date.split('T')[0] : '');
    const [finishDate, setFinishDate] = useState<string>(initialData?.finish_date ? initialData.finish_date.split('T')[0] : '');
    const [shortReview, setShortReview] = useState<string>(initialData?.short_review || '');
    const [isSaving, setIsSaving] = useState(false);

    // [NEW] 확장 필드 상태
    const totalPage = initialData?.edition?.page_count || initialData?.page_count || 300; // API 응답 구조에 맞게 조절
    const [currentPage, setCurrentPage] = useState<number>(initialData?.current_page || 0);
    const [readingFormat, setReadingFormat] = useState<string>(initialData?.reading_format || 'PAPER');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    //const [isPublic, setIsPublic] = useState<boolean>(initialData?.is_public ?? true);
    const [isShortReviewPublic, setIsShortReviewPublic] = useState<boolean>(initialData?.is_short_review_public ?? true);

    // 날짜 자동 세팅
    useEffect(() => {
        if (status === 'wish') { 
            setStartDate(''); 
            setFinishDate(''); 
        } else if (status === 'reading' && !startDate) {
            setStartDate(new Date().toISOString().split('T')[0]);
            setFinishDate('');
        } else if (status === 'finished' && !finishDate) {
            if (!startDate) setStartDate(new Date().toISOString().split('T')[0]);
            setFinishDate(new Date().toISOString().split('T')[0]);
            if (currentPage === 0) setCurrentPage(totalPage); // 완독 시 자동으로 끝 페이지 설정
        }
    }, [status]);

    const handleStarClick = (index: number) => {
        const clickedValue = index + 1;
        if (rating === clickedValue) setRating(clickedValue - 0.5);
        else if (rating === clickedValue - 0.5) setRating(clickedValue - 1);
        else setRating(clickedValue);
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // [핵심] 한글 조합 중(isComposing)일 때는 Enter 이벤트를 무시합니다.
        if (e.nativeEvent.isComposing) return;

        if (e.key === 'Enter' && tagInput.trim() !== '') {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSave = async () => {
        setIsSaving(true);
        let backendStatus = 'WISH';
        if (status === 'reading') backendStatus = 'READING';
        if (status === 'finished') backendStatus = 'COMPLETED';

        const payload = {
            status: backendStatus,
            rating: parseFloat(rating.toString()),
            short_review: shortReview,
            start_date: startDate || null,
            finish_date: finishDate || null,
            current_page: currentPage,
            reading_format: readingFormat,
            tags: tags,
            // is_public 대신 아래 변수명 사용
            is_short_review_public: isShortReviewPublic
        };

        try {
            const targetId = initialData.library_id || initialData.id;
            const res = await fetch(`http://localhost:8000/api/my-library/${targetId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("독서 기록이 저장되었습니다.");
                // ▼▼▼ [핵심] 부모에게 변경된 데이터 즉시 전달 ▼▼▼
                if (onSaved) {
                    onSaved(payload);
                }
                router.refresh();
                onClose();
                //window.location.reload(); 
            } else {
                toast.error("저장에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error saving book:", error);
            toast.error("서버 연결 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        // ▼▼▼ [수정됨] 최상위 div에 기획자님의 명품 1cm 패딩과 스크롤 영역을 완벽하게 세팅했습니다! ▼▼▼
        <div className="grid gap-6 p-[var(--spacing-1cm,32px)] max-h-[85vh] overflow-y-auto custom-scrollbar">
            <StarGradientDef />
            
            {/* 1. 상단 책 정보 */}
            <div className="flex gap-5 items-start">
                <div className="relative w-24 h-32 shrink-0 rounded-md overflow-hidden shadow-md border border-gray-100">
                    {initialData?.cover ? (
                        <img src={initialData.cover} className="w-full h-full object-cover" alt="cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Image</div>
                    )}
                </div>
                <div className="flex flex-col gap-1.5 pt-1 w-full min-w-0">
                    <h3 className="text-xl font-bold text-[#1d1d1f] leading-snug line-clamp-2">{initialData?.title}</h3>
                    <p className="text-sm text-[#86868b] font-medium line-clamp-1">{initialData?.author}</p>
                    
                    {/* 독서 매체 선택 칩 */}
                    <div className="flex items-center gap-2 mt-2">
                        {[
                            { id: 'PAPER', icon: Book, label: '종이책' },
                            { id: 'EBOOK', icon: Smartphone, label: '전자책' },
                            { id: 'AUDIO', icon: Headphones, label: '오디오북' }
                        ].map((media) => (
                            <button 
                                key={media.id}
                                onClick={() => setReadingFormat(media.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                                    readingFormat === media.id 
                                    ? 'bg-[#1d1d1f] text-white' 
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                <media.icon size={12} /> {media.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. 상태 선택 (Tabs) */}
            <div className="grid gap-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-[#1d1d1f]">독서 상태</Label>
                    
                    {/* 별점 (읽고 싶은 책이 아닐 때만 활성화) */}
                    <div className={`flex items-center gap-1 transition-opacity ${status === 'wish' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <span className="text-sm font-bold text-blue-600 mr-2">{rating.toFixed(1)}점</span>
                        <div className="flex gap-0.5 cursor-pointer">
                            {[0, 1, 2, 3, 4].map((i) => {
                                let fill = "#E5E5E7";
                                if (rating >= i + 1) fill = "#FFCC00";
                                else if (rating > i) fill = "url(#half-star)";
                                return (
                                    <Star key={i} size={20} className="transition-transform active:scale-90" fill={fill} strokeWidth={0} onClick={() => handleStarClick(i)} />
                                );
                            })}
                        </div>
                    </div>
                </div>

                <Tabs value={status} onValueChange={setStatus} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="wish">읽고 싶은</TabsTrigger>
                        <TabsTrigger value="reading">읽는 중</TabsTrigger>
                        <TabsTrigger value="finished">완독</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* 3. 진행률 & 날짜 (Progressive Disclosure) */}
            {status !== 'wish' && (
                <div className="bg-gray-50 p-4 rounded-xl grid grid-cols-2 gap-4 items-start animate-in fade-in slide-in-from-top-2 duration-300">
                    
                    {/* 왼쪽: 시작일 (공통) */}
                    <div className="grid gap-1.5">
                        <Label className="text-xs text-gray-500 flex items-center gap-1"><CalendarIcon size={12} /> 시작일</Label>
                        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm bg-white h-9" />
                    </div>

                    {/* 오른쪽: 완독일 (완독 상태일 때) */}
                    {status === 'finished' && (
                        <div className="grid gap-1.5 animate-in fade-in duration-300">
                            <Label className="text-xs text-gray-500 flex items-center gap-1"><CalendarIcon size={12} /> 완독일</Label>
                            <Input type="date" value={finishDate} onChange={(e) => setFinishDate(e.target.value)} className="text-sm bg-white h-9" />
                        </div>
                    )}

                    {/* 오른쪽: 현재 페이지 & 진행률 (읽는 중일 때) */}
                    {status === 'reading' && (
                        <div className="grid gap-1.5 animate-in fade-in duration-300">
                            <Label className="text-xs text-gray-500 flex items-center justify-between">
                                <span>현재 페이지</span>
                                <span className="font-bold text-blue-600">{Math.round((currentPage / totalPage) * 100)}%</span>
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="number" 
                                    value={currentPage || ''} 
                                    onChange={(e) => setCurrentPage(Number(e.target.value))} 
                                    className="text-sm bg-white font-mono h-9" 
                                    placeholder="0"
                                    min="0"
                                    max={totalPage}
                                />
                                <span className="text-sm text-gray-400 font-mono whitespace-nowrap">/ {totalPage}p</span>
                            </div>
                            {/* 진행률 바 (Input 하단에 타이트하게 배치) */}
                            <div className="w-full h-1.5 bg-gray-200 rounded-full mt-0.5 overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min((currentPage / totalPage) * 100, 100)}%` }} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 4. 한줄평 및 태그 */}
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">한줄평</Label>
                        
                        {/* 직관적인 스위치형 공개/비공개 토글 */}
                        <div 
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setIsShortReviewPublic(!isShortReviewPublic)}
                        >
                            <span className={`flex items-center gap-1 text-[12px] font-bold transition-colors ${isShortReviewPublic ? 'text-[#0066cc]' : 'text-gray-400'}`}>
                                {isShortReviewPublic ? <Globe size={13} /> : <Lock size={13} />}
                                {isShortReviewPublic ? '공개' : '비공개'}
                            </span>
                            <button
                                type="button"
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isShortReviewPublic ? 'bg-[#0066cc]' : 'bg-gray-200'}`}
                            >
                                <span 
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${isShortReviewPublic ? 'translate-x-6' : 'translate-x-1'}`} 
                                />
                            </button>
                        </div>
                    </div>
                    <Textarea
                        placeholder="이 책에서 얻은 영감이나 문장을 기록해보세요."
                        className="resize-none min-h-[60px] text-sm"
                        value={shortReview}
                        onChange={(e) => setShortReview(e.target.value)}
                    />
                </div>
                
                <div className="grid gap-2">
                    <Label className="text-sm font-semibold flex items-center gap-1"><Hash size={14} /> 나만의 태그</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                                #{tag}
                                <button onClick={() => removeTag(tag)} className="hover:text-blue-900"><X size={12} /></button>
                            </span>
                        ))}
                    </div>
                    <Input 
                        placeholder="태그 입력 후 Enter (예: 인생책, 위로)" 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="text-sm"
                    />
                </div>
            </div>
            
            {/* 5. 하단 버튼 */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                <Button variant="outline" onClick={onClose} disabled={isSaving} className="w-24">취소</Button>
                <Button onClick={handleSave} disabled={isSaving} className="w-32 bg-[#1d1d1f] hover:bg-[#333]">
                    {isSaving ? "저장 중..." : "기록 완료"}
                </Button>
            </div>
        </div>
    );
}