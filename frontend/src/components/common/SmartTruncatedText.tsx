// 파일 경로: frontend/src/components/common/SmartTruncatedText.tsx
// 역할 및 기능: 긴 텍스트를 말줄임표(...)로 처리하고, 내용이 길어 잘렸을 경우 마우스를 올리면 원문을 보여주는 지능형 툴팁 컴포넌트입니다.
// 업데이트: shadcn/ui 툴팁(Portal 기반)을 적용하여 화면 밖으로 잘리는 현상을 완벽하게 해결하고, 심리스한 다크 테마를 적용했습니다.

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

  // 텍스트가 컨테이너를 넘어갔는지(말줄임이 발생했는지) 계산
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
    // 💡 delayDuration을 200ms로 설정하여 마우스를 스칠 때마다 번쩍거리는 것을 방지
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        {/* 말줄임표가 적용된 원본 텍스트 */}
        <TooltipTrigger asChild>
          <div 
            ref={textRef} 
            className={`line-clamp-3 overflow-hidden text-ellipsis cursor-pointer ${textClassName}`}
          >
            {displayContent}
          </div>
        </TooltipTrigger>

        {/* 💡 텍스트가 잘렸을 때(isTruncated)만 툴팁 렌더링 */}
        {isTruncated && (
          <TooltipContent 
            side="bottom"    // 기본적으로 아래로 띄웁니다.
            align="start"    // 왼쪽 정렬
            sideOffset={8}   // 본문과 8px 간격 유지
            collisionPadding={16} // 화면 가장자리에 닿기 16px 전에 위치를 강제로 뒤집음(Auto-Flip)
            // ▼ 기획자님의 시그니처 다크 테마 적용! ▼
            className="z-[100] max-w-[300px] sm:max-w-[400px] bg-[#1d1d1f] text-[#F7F5F1] p-4 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] border border-[#333333] break-words"
          >
            <p className="text-[13px] leading-relaxed font-medium font-sans">
              {displayContent}
            </p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}