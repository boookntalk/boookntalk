//frontend/src/components/common/SmartTruncatedText.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SmartTruncatedTextProps {
    content: string;
    textClassName?: string;
    wrapQuotes?: boolean; 
}

export function SmartTruncatedText({ 
    content, 
    textClassName = "text-[13px] text-gray-600", 
    wrapQuotes = false 
}: SmartTruncatedTextProps) {
    const textRef = useRef<HTMLParagraphElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        const checkTruncation = () => {
            if (textRef.current) {
                // 4줄 높이보다 실제 텍스트가 큰지 확인
                setIsTruncated(textRef.current.scrollHeight > textRef.current.clientHeight);
            }
        };
        checkTruncation();
        window.addEventListener('resize', checkTruncation);
        return () => window.removeEventListener('resize', checkTruncation);
    }, [content]);

    if (!content) return <p className={`${textClassName} italic`}>기록된 내용이 없습니다.</p>;

    const displayText = wrapQuotes ? `"${content}"` : content;

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex-1 w-full text-left mb-4 cursor-pointer">
                        <p ref={textRef} className={`${textClassName} leading-relaxed font-medium break-keep line-clamp-4`}>
                            {displayText}
                        </p>
                    </div>
                </TooltipTrigger>
                {isTruncated && (
                    <TooltipContent 
                        side="top" 
                        align="center"
                        className="w-[300px] bg-white/95 backdrop-blur-md p-5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100 max-h-[300px] overflow-y-auto scrollbar-hide z-50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                            {displayText}
                        </p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
}