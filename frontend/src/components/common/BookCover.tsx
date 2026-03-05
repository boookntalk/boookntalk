'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Book, Loader2 } from 'lucide-react'; // 로딩 아이콘 추가

interface BookCoverProps {
    src?: string | null;
    alt: string;
    className?: string;
}

export default function BookCover({ src, alt, className }: BookCoverProps) {
    const [imgSrc, setImgSrc] = useState<string | null>(src || null);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가

    // [핵심] 외부에서 src가 변경되면(백그라운드 작업 완료 후) 상태를 동기화
    useEffect(() => {
        if (src) {
            setImgSrc(src);
            setHasError(false);
            setIsLoading(true);
        }
    }, [src]);

    if (!imgSrc || hasError) {
        return (
            <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 border border-gray-200 ${className}`}>
                <Book size={24} className="mb-1 opacity-40" />
                <span className="text-[10px] font-bold uppercase">No Image</span>
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden bg-gray-50 flex items-center justify-center ${className}`}>
            {/* 로딩 표시기 */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-50">
                    <Loader2 size={16} className="animate-spin text-gray-300" />
                </div>
            )}
            
            <Image
                src={imgSrc}
                alt={alt}
                fill
                className={`object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setIsLoading(false)} // 로딩 완료 시 표시
                onError={() => {
                    console.error("Image Load Error:", imgSrc);
                    setHasError(true);
                    setIsLoading(false);
                }}
                sizes="(max-width: 768px) 100vw, 200px"
                unoptimized={imgSrc.includes('aladin.co.kr')} // 외부 URL일 때만 최적화 해제
            />
        </div>
    );
}