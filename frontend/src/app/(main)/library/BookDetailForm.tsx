'use client';

import React, { useState, useEffect } from 'react';
import { Star, Calendar as CalendarIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

// 반쪽 별을 위한 SVG 그래디언트 (기존 로직 유지)
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

interface BookDetailFormProps {
    initialData: any;
    onClose: () => void;
}

export default function BookDetailForm({ initialData, onClose }: BookDetailFormProps) {
    const router = useRouter();

    // 1. 상태 초기화 로직 (기존 유지)
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

    // 2. 날짜 자동 세팅 로직 (기존 유지)
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
        }
    }, [status]);

    // 3. 별점 토글 로직 (기존 유지)
    const handleStarClick = (index: number) => {
        const clickedValue = index + 1;
        if (rating === clickedValue) {
            setRating(clickedValue - 0.5);
        } else if (rating === clickedValue - 0.5) {
            setRating(clickedValue - 1);
        } else {
            setRating(clickedValue);
        }
    };

    // 4. 저장 로직 (기존 유지 + 토스트 추가)
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
        };

        try {
            const targetId = initialData.library_id || initialData.id;
            // [주의] 실제 백엔드 주소가 localhost:8000 인지 확인 필요 (프록시 설정 여부에 따라 다름)
            const res = await fetch(`http://localhost:8000/api/my-library/${targetId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("도서 정보가 저장되었습니다.");
                router.refresh();
                onClose();
                window.location.reload(); // 데이터 즉시 반영을 위해 새로고침
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
        <div className="grid gap-6">
            <StarGradientDef />
            
            {/* 1. 상단 책 정보 (디자인 개선) */}
            <div className="flex gap-5 items-start">
                <div className="relative w-24 h-32 shrink-0 rounded-md overflow-hidden shadow-md border border-gray-100">
                    {initialData?.cover ? (
                        <img src={initialData.cover} className="w-full h-full object-cover" alt="cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Image</div>
                    )}
                </div>
                <div className="flex flex-col gap-1.5 pt-1 w-full min-w-0">
                    <h3 className="text-xl font-bold text-[#1d1d1f] leading-snug line-clamp-2" title={initialData?.title}>
                        {initialData?.title}
                    </h3>
                    <p className="text-sm text-[#86868b] font-medium line-clamp-1">
                        {initialData?.author}
                    </p>
                    {/* ISBN 뱃지 */}
                    {(initialData?.isbn || initialData?.isbn10) && (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-gray-500 border-gray-200 bg-gray-50 w-fit mt-1">
                            ISBN {initialData.isbn || initialData.isbn10}
                        </span>
                    )}
                </div>
            </div>

            {/* 2. 상태 선택 (Tabs 컴포넌트 활용) */}
            <div className="grid gap-4">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-[#1d1d1f]">독서 상태</Label>
                    
                    {/* 별점 표시 (우측 정렬) */}
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-blue-600 mr-2">{rating.toFixed(1)}점</span>
                        <div className="flex gap-0.5 cursor-pointer">
                            {[0, 1, 2, 3, 4].map((i) => {
                                let fill = "#E5E5E7";
                                if (rating >= i + 1) fill = "#FFCC00";
                                else if (rating > i) fill = "url(#half-star)";

                                return (
                                    <Star 
                                        key={i}
                                        size={20}
                                        className="transition-transform active:scale-90"
                                        fill={fill}
                                        strokeWidth={0} // 테두리 제거 (깔끔하게)
                                        onClick={() => handleStarClick(i)}
                                    />
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

            {/* 3. 날짜 입력 (읽고 싶은 책일 때는 숨김) */}
            {status !== 'wish' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid gap-2">
                        <Label htmlFor="start_date" className="text-xs text-gray-500 flex items-center gap-1">
                            <CalendarIcon size={12} /> 시작일
                        </Label>
                        <Input 
                            id="start_date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-sm"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="finish_date" className="text-xs text-gray-500 flex items-center gap-1">
                            <CalendarIcon size={12} /> 완독일
                        </Label>
                        <Input 
                            id="finish_date"
                            type="date"
                            value={finishDate}
                            onChange={(e) => setFinishDate(e.target.value)}
                            disabled={status !== 'finished'}
                            className={status !== 'finished' ? 'opacity-50' : 'text-sm'}
                        />
                    </div>
                </div>
            )}

            {/* 4. 한줄평 */}
            <div className="grid gap-2">
                <Label htmlFor="review" className="text-sm font-semibold">한 줄 평</Label>
                <Textarea
                    id="review"
                    placeholder="이 책에서 얻은 영감이나 문장을 기록해보세요."
                    className="resize-none min-h-[100px] text-sm"
                    value={shortReview}
                    onChange={(e) => setShortReview(e.target.value)}
                />
            </div>

            {/* 5. 하단 버튼 */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                <Button variant="outline" onClick={onClose} disabled={isSaving} className="w-24">
                    취소
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="w-32 bg-[#1d1d1f] hover:bg-[#333]">
                    {isSaving ? "저장 중..." : "기록 완료"}
                </Button>
            </div>
        </div>
    );
}