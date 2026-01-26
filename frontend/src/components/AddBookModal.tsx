'use client';

import React, { useState } from 'react';
// BookOpen을 추가로 임포트합니다.
import { X, ExternalLink, BookOpen, Loader2, Info } from 'lucide-react';
import { useSession } from "next-auth/react"; // 1. 세션 임포트 필요

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}
  
export default function AddBookModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // 컴포넌트 내부에서 Hooks 사용
  const { data: session } = useSession(); 
  
  const [isbn, setIsbn] = useState('');
  const [extraCode, setExtraCode] = useState('');
  const [bookData, setBookData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // [수정] handleSearch 함수
  const handleSearch = async () => {
    if (!isbn.trim()) {
      alert("ISBN을 입력하거나, ISBN이 없는 도서 등록 절차를 확인해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/books/search/${isbn}?extra=${extraCode}`);
      const data = await res.json();
      setBookData(data);
    } catch (error) {
      alert("도서 정보를 가져오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // [중요: 이동] 컴포넌트 내부로 함수를 옮겨야 에러가 발생하지 않습니다.
  const handleFinalRegister = async () => {
    if (!bookData) return;

    const payload = {
      ...bookData,
      extraCode: extraCode,
      user_id: session?.user?.email, // 보통 email이나 고유 ID를 사용합니다.
      nickname: session?.user?.name
    };

    try {
      const res = await fetch('http://localhost:8000/api/books/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert("서재에 성공적으로 등록되었습니다!");
        onClose(); // 이제 onClose를 인식합니다.
        window.location.href = '/library';
      }
    } catch (error) {
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-lg text-[#1d1d1f]">새 도서 등록</h2>
          <button onClick={onClose} className="hover:bg-gray-200 p-1 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {!bookData ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 ml-1">도서 식별 번호</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="ISBN 13자리 입력"
                    className="flex-[3] px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-[15px]"
                  />
                  <input
                    type="text"
                    value={extraCode}
                    onChange={(e) => setExtraCode(e.target.value)}
                    placeholder="option" 
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-[15px] italic text-center"
                  />
                </div>
                <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-[13px] text-blue-700 leading-relaxed">
                    ISBN이 없는 도서의 경우, 조회 시 <span className="font-bold text-blue-800 underline underline-offset-2">BnT에서 생성된 고유 ID</span>로 등록 처리가 진행됩니다.
                  </p>
                </div>
              </div>
              <button onClick={handleSearch} disabled={loading} className="w-full bg-[#1d1d1f] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "도서 정보 조회하기"}
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
                <div className="flex gap-4 mb-6">
                    <img src={bookData.cover} alt="cover" className="w-24 h-36 object-cover rounded shadow-md" />
                    <div>
                        <h3 className="font-bold text-lg leading-tight">{bookData.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{bookData.author}</p>
                        <p className="text-xs text-blue-600 mt-2 font-semibold bg-blue-50 inline-block px-2 py-1 rounded">
                            {bookData.pageCount}페이지
                        </p>
                        {bookData.previewLink && (
                          <a href={bookData.previewLink} target="_blank" className="flex items-center gap-1 text-[11px] text-gray-400 mt-2 hover:text-black">
                            <BookOpen className="w-3 h-3" /> 미리보기 가능
                          </a>
                        )}
                    </div>
                </div>
                <button onClick={handleFinalRegister} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">
                    이 책으로 서재 등록 완료
                </button>
                <button onClick={() => setBookData(null)} className="w-full mt-4 text-gray-400 text-[13px] hover:underline">
                    다시 검색하기
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// // AddBookModal.tsx 내부의 등록 핸들러
// const handleFinalRegister = async () => {
//   const payload = {
//     ...bookData,
//     extraCode: extraCode,
//     user_id: session?.user?.id, // 세션에서 유저 ID 가져오기
//     nickname: session?.user?.name
//   };

//   try {
//     const res = await fetch('http://localhost:8000/api/books/register', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload)
//     });
    
//     if (res.ok) {
//       alert("서재에 성공적으로 등록되었습니다!");
//       onClose();
//       // 등록 후 '나의 서재' 페이지 리로드 또는 이동
//       window.location.href = '/library';
//     }
//   } catch (error) {
//     alert("등록 중 오류가 발생했습니다.");
//   }
// };