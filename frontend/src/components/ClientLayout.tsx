'use client';

import React, { useState } from 'react';
import AddBookFAB from '@/components/AddBookFAB';
import AddBookModal from '@/components/AddBookModal';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* 중복된 main 태그를 제거하여 layout.tsx의 main 설정만 따릅니다. */}
      {children}
      
      <AddBookFAB onClick={() => setIsModalOpen(true)} />
      
      <AddBookModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}