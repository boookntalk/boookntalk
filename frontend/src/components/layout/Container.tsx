'use client';

import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

// export default function Container({ children, className = "" }: ContainerProps) {
//   return (
//     <div className={`max-w-[1200px] mx-auto px-8 ${className}`}>
//       {children}
//     </div>
//   );
// }

export default function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    // 메인 화면의 기준 사이즈를 여기에 적용합니다. 
    // mx-auto를 통해 어느 화면에서든 중앙 정렬을 유지하며 메인과 동일한 폭을 제공합니다.
    <div className={`max-w-[1440px] mx-auto px-8 ${className}`}>
      {children}
    </div>
  );
}