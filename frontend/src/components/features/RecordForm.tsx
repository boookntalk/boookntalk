"use client"; // 클라이언트 컴포넌트임을 명시

import React from 'react';

// 'default' 키워드가 있는지 반드시 확인하세요.
export default function RecordForm() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
      <p className="text-slate-800 font-bold">지금 어떤 책을 읽고 계신가요?</p>
    </div>
  );
}