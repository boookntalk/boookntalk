'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import AddBookModal from '@/components/AddBookModal';

interface GlobalAddBookFABProps {
  userEmail?: string; // 로그인 안 했을 수도 있으므로 옵셔널 처리
}

export default function GlobalAddBookFAB({ userEmail }: GlobalAddBookFABProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 로그인을 안 했거나 이메일이 없으면 버튼을 아예 숨김
  if (!userEmail) return null;

  return (
    <>
      {/* 1. 플로팅 버튼 (화면 우측 하단 고정, 최상위 z-index) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-10 right-10 w-14 h-14 bg-[#0066cc] text-white rounded-full shadow-xl 
                   flex items-center justify-center hover:bg-[#0052a3] transition-all 
                   hover:scale-110 active:scale-95 z-[9999] group"
        aria-label="새 도서 등록"
      >
        <Plus 
            size={28} 
            strokeWidth={2.5}
            className="group-hover:rotate-90 transition-transform duration-300" 
        />
      </button>

      {/* 2. 도서 등록 모달 */}
      {isModalOpen && (
        <AddBookModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          userEmail={userEmail}
        />
      )}
    </>
  );
}