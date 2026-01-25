'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface AddBookFABProps {
  onClick: () => void;
}

export default function AddBookFAB({ onClick }: AddBookFABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 w-14 h-14 bg-[#1d1d1f] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-black hover:scale-105 transition-all z-40"
      title="도서 등록"
    >
      <Plus className="w-7 h-7" />
    </button>
  );
}