// 경로: frontend/src/components/layout/StandardContainer.tsx
import React from 'react';

// ▼▼▼ 여기에 size 속성이 정의되어 있어야 에러가 나지 않습니다! ▼▼▼
interface StandardContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'wide' | 'full'; 
}

export default function StandardContainer({ 
  children, 
  className = "", 
  size = "default" 
}: StandardContainerProps) {
  
  // 사이즈에 따른 max-width 클래스 결정
  const maxWidthClass = 
    size === 'wide' ? 'max-w-[var(--max-content-wide)]' : 
    size === 'full' ? 'max-w-full' : 
    'max-w-[var(--max-content-width)]';

  return (
    <div className={`w-full ${maxWidthClass} mx-auto px-4 md:px-[var(--spacing-1cm)] flex flex-col gap-[var(--spacing-1cm)] ${className}`}>
      {children}
    </div>
  );
}