// 파일 경로: frontend/src/components/common/SmartTruncatedText.tsx
// 역할 및 기능: 긴 텍스트를 말줄임표(...)로 처리하고, 내용이 길어 잘렸을 경우 마우스를 올리면 원문을 보여주는 지능형 툴팁 컴포넌트입니다.

'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SmartTruncatedTextProps {
  content: string;
  textClassName?: string;
  wrapQuotes?: boolean;
}

export function SmartTruncatedText({ content, textClassName = "", wrapQuotes = false }: SmartTruncatedTextProps) {
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

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

  const displayContent = wrapQuotes ? `"${content}"` : content;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            ref={textRef} 
            className={`line-clamp-3 overflow-hidden text-ellipsis cursor-pointer ${textClassName}`}
          >
            {displayContent}
          </div>
        </TooltipTrigger>

        {isTruncated && (
          <TooltipContent 
            side="top"    
            align="start"    
            sideOffset={8}   
            collisionPadding={16} 
            // 💡 [폭 확장] 기존 max-w-[400px]에서 lg:max-w-[750px]로 대폭 확장하여 도서 상세 본문 너비와 밸런스를 맞췄습니다.
            className="z-[100] max-w-[calc(100vw-32px)] md:max-w-[650px] lg:max-w-[750px] max-h-[300px] overflow-y-auto scrollbar-hide bg-[#1d1d1f] text-[#F7F5F1] p-5 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] border border-[#333333] break-words"
          >
            {/* 💡 기획자님 폰트 표준(14px)과 줄간격(leading-relaxed) 유지 */}
            <p className="text-[14px] leading-relaxed font-medium font-sans">
              {displayContent}
            </p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}