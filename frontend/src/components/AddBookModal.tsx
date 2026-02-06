'use client';

import React, { useState } from 'react';
import { X, BookOpen, Loader2, Info } from 'lucide-react';
import { useSession } from "next-auth/react"; 

export default function AddBookModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: session } = useSession(); 
  
  const [isbn, setIsbn] = useState('');
  const [extraCode, setExtraCode] = useState('');
  const [bookData, setBookData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 1. 도서 검색 (변경 없음)
  const handleSearch = async () => {
    if (!isbn.trim()) {
      alert("ISBN을 입력하거나, ISBN이 없는 도서 등록 절차를 확인해 주세요.");
      return;
    }
    setLoading(true);
    try {
      // API 주소는 환경변수(process.env.NEXT_PUBLIC_API_URL) 사용을 권장하지만, 일단 현재 설정 유지
      const res = await fetch(`http://localhost:8000/api/books/search/${isbn}?extra=${extraCode}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setBookData(data);
    } catch (error) {
      alert("도서 정보를 가져오는데 실패했습니다. 정확한 ISBN인지 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // 2. 최종 등록 (핵심 수정!)
  const handleFinalRegister = async () => {
    if (!bookData) return;

    if (!session?.user?.email) {
      alert("로그인 정보가 없습니다. 다시 로그인해 주세요.");
      return;
    }

    const payload = {
      ...bookData,
      extraCode: extraCode,
      // [중요 수정] 백엔드가 이메일을 통해 유저 ID를 찾으므로 'user_email'로 보냅니다.
      user_email: session.user.email, 
      nickname: session.user.name
    };

    try {
      const res = await fetch('http://localhost:8000/api/books/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert("📚 서재에 성공적으로 등록되었습니다!");
        onClose();
        // 등록 후 새로고침하여 목록 갱신
        window.location.reload(); 
      } else {
        const errorData = await res.json();
        alert(`등록 실패: ${errorData.detail || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error(error);
      alert("등록 중 서버 오류가 발생했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-lg text-[#1d1d1f]">새 도서 등록</h2>
          <button onClick={onClose} className="hover:bg-gray-200 p-1 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-8">
          {!bookData ? (
            // 검색 전 화면
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 ml-1">도서 식별 번호 (ISBN)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="ISBN 13자리 입력"
                    className="flex-[3] px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-[15px] transition-all"
                  />
                  <input
                    type="text"
                    value={extraCode}
                    onChange={(e) => setExtraCode(e.target.value)}
                    placeholder="옵션" 
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-[15px] italic text-center transition-all"
                  />
                </div>
                
                {/* 안내 문구 */}
                <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-[13px] text-blue-700 leading-relaxed">
                    ISBN이 없는 도서의 경우, 임의의 13자리를 입력하시면 <span className="font-bold underline">BnT 고유 ID</span>로 등록됩니다.
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleSearch} 
                disabled={loading} 
                className="w-full bg-[#1d1d1f] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:bg-black hover:shadow-lg disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "도서 정보 조회하기"}
              </button>
            </div>
          ) : (
            // 검색 결과 화면
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {bookData.cover ? (
                        <img src={bookData.cover} alt="cover" className="w-24 h-36 object-cover rounded shadow-md shrink-0" />
                    ) : (
                        <div className="w-24 h-36 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">이미지 없음</div>
                    )}
                    <div className="flex flex-col justify-between py-1">
                        <div>
                            <h3 className="font-bold text-lg leading-tight line-clamp-2">{bookData.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{bookData.author}</p>
                        </div>
                        
                        <div>
                            <p className="text-xs text-blue-600 font-semibold bg-white border border-blue-100 inline-block px-2 py-1 rounded shadow-sm">
                                {bookData.pageCount ? `${bookData.pageCount} 페이지` : '페이지 정보 없음'}
                            </p>
                            {bookData.previewLink && (
                            <a href={bookData.previewLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-gray-400 mt-2 hover:text-black transition-colors">
                                <BookOpen className="w-3 h-3" /> 미리보기
                            </a>
                            )}
                        </div>
                    </div>
                </div>
                
                <button onClick={handleFinalRegister} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
                    이 책으로 서재 등록 완료
                </button>
                <button onClick={() => setBookData(null)} className="w-full mt-4 text-gray-400 text-[13px] hover:text-gray-600 hover:underline transition-colors">
                    뒤로 가기 (다시 검색)
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}