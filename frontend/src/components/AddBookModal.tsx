'use client';

import React, { useState } from 'react';
// BookOpen을 추가로 임포트합니다.
import { X, ExternalLink, BookOpen, Loader2, Info } from 'lucide-react';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddBookModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isbn, setIsbn] = useState('');
  const [extraCode, setExtraCode] = useState(''); // 추가 번호 (선택)
  const [bookData, setBookData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!isbn.trim()) {
      alert("ISBN을 입력하거나, ISBN이 없는 도서 등록 절차를 확인해 주세요.");
      return;
    }
    
    setLoading(true);
    try {
      // 추가 번호(extraCode)가 있다면 함께 서버로 전송 가능
      const res = await fetch(`http://localhost:8000/api/books/search/${isbn}?extra=${extraCode}`);
      const data = await res.json();
      setBookData(data);
    } catch (error) {
      alert("도서 정보를 가져오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
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
                
                {/* ISBN + 추가번호 입력란 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="ISBN 13자리 입력"
                    className="flex-[3] px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[15px]"
                  />
                  <input
                    type="text"
                    value={extraCode}
                    onChange={(e) => setExtraCode(e.target.value)}
                    placeholder="5자리 추가기호(option)" 
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[15px] italic"
                  />
                </div>
                
                {/* ISBN 미보유 안내 문구 */}
                <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-[13px] text-blue-700 leading-relaxed">
                    ISBN이 없는 도서의 경우, 조회 시 <span className="font-bold text-blue-800 underline underline-offset-2">BnT에서 생성된 고유 ID</span>로 등록 처리가 진행됩니다.
                  </p>
                </div>
              </div>

              {/* 조회 버튼 */}
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-[#1d1d1f] text-white py-4 rounded-xl font-bold hover:bg-black disabled:bg-gray-300 flex items-center justify-center gap-2 transition-all shadow-lg shadow-gray-200"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "도서 정보 조회하기"}
              </button>
            </div>
          ) : (
            /* 결과 화면 로직... */
            <div className="animate-in fade-in duration-300">
                <div className="flex gap-4 mb-6">
                    <img src={bookData.cover} alt="cover" className="w-24 h-36 object-cover rounded shadow-md" />
                    <div>
                        <h3 className="font-bold text-lg leading-tight">{bookData.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{bookData.author}</p>
                        <p className="text-xs text-blue-600 mt-2 font-semibold bg-blue-50 inline-block px-2 py-1 rounded">
                            {bookData.pageCount}페이지
                        </p>
                    </div>
                </div>
                <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">
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