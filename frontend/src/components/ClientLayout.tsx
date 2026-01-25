'use client';

import React, { useState } from 'react';
import AddBookFAB from '@/components/AddBookFAB';
import AddBookModal from '@/components/AddBookModal';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <main>{children}</main>
      
      {/* 플로팅 버튼 클릭 시 모달 열기 */}
      <AddBookFAB onClick={() => setIsModalOpen(true)} />
      
      {/* 모달 컴포넌트 */}
      <AddBookModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}