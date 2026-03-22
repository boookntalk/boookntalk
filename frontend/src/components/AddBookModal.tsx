// 파일 경로: frontend/src/components/AddBookModal.tsx
// 역할 및 기능: 외부 API에서 도서를 검색하고, 검색된 도서를 BoooknTalk 마스터 API에 전송하여 도서 등록, 서재 저장, 통계 업데이트를 한 번에 처리하는 모달 컴포넌트입니다.

'use client';

import React, { useState } from 'react';
import { X, Search, Book, Loader2, Info } from 'lucide-react';
import Image from 'next/image';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

/**
 * 함수 기능: 도서 검색 및 등록을 위한 전체 모달 UI를 렌더링하고 상태(State)를 관리합니다.
 */
export default function AddBookModal({ isOpen, onClose, userEmail }: AddBookModalProps) {
  const [isbnInput, setIsbnInput] = useState('');
  const [addonInput, setAddonInput] = useState(''); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [error, setError] = useState('');

  /**
   * 함수 기능: 사용자가 입력한 ISBN 값의 유효성을 검사하고, 백엔드 API를 호출하여 도서 메타데이터를 검색 및 상태에 저장합니다.
   */
  const handleSearch = async () => {
    const cleanIsbn = isbnInput.trim().replace(/-/g, '');
    
    if (!cleanIsbn) {
      setError('ISBN을 입력해주세요.');
      return;
    }

    if (cleanIsbn.length !== 10 && cleanIsbn.length !== 13) {
      setError('ISBN은 10자리 또는 13자리여야 합니다.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearchResult(null);

    try {
      const res = await fetch(`http://localhost:8000/api/books/search/${cleanIsbn}`);
      
      if (!res.ok) {
        throw new Error('도서를 찾을 수 없습니다.');
      }
      
      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      setError('도서 정보를 불러오지 못했습니다. ISBN을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 함수 기능: 단일 마스터 API(/api/books)를 호출하여 도서 메타데이터 저장, 서재 등록, 인사이트 통계 업데이트를 백엔드에 일괄 위임합니다.
   */
  const handleRegister = async () => {
    if (!searchResult || !userEmail) {
      alert("로그인 정보가 없거나 도서 정보가 없습니다.");
      return;
    }

    try {
      setIsLoading(true);
      
      // 시스템에 도서 등록 및 서재 추가를 한 번에 요청하는 페이로드 구성
      const payload = {
        user_email: userEmail,
        title: searchResult.title,
        author: searchResult.author,
        publisher: searchResult.publisher,
        pubDate: searchResult.pubDate,
        description: searchResult.description,
        isbn: searchResult.isbn,      
        isbn10: searchResult.isbn10,
        addon_code: addonInput.trim(), 
        cover: searchResult.cover,
        pageCount: searchResult.pageCount,
        categoryName: searchResult.categoryName,
        detailed_authors: searchResult.detailed_authors,
        originalTitle: searchResult.originalTitle,
        binding_type: searchResult.binding_type,
        kdc_code: searchResult.kdc_code,
        language: searchResult.language,
        size_mm: searchResult.size_mm,
        price: searchResult.price
      };

      // 단일 마스터 노드로 데이터 전송
      const res = await fetch("http://localhost:8000/api/books", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.detail || '도서 등록에 실패했습니다.');
        } catch (e) {
            throw new Error(`서버 에러 발생: ${res.status}`);
        }
      }

      // 불필요한 이중 API 호출 로직 제거 완료. 백엔드에서 서재 등록과 트리거 발동을 모두 처리합니다.

      alert('도서가 성공적으로 내 서재에 담겼습니다!');
      onClose();
      
      // 인사이트 화면의 최신화된 카운트를 즉시 반영하기 위해 리로드 실행
      window.location.reload(); 
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 함수 기능: 부가기호 입력 필드의 값을 숫자 5자리로만 제한하여 상태에 반영합니다.
   */
  const handleAddonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 5) setAddonInput(val);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-[#1d1d1f]">새 도서 등록</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={22} className="text-gray-500" />
          </button>
        </div>

        {/* 바디 */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* 검색 입력 영역 */}
          <div className="flex flex-col gap-4 mb-6">
            <label className="text-xs font-bold text-gray-500 ml-1">ISBN 정보 입력</label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={isbnInput}
                  onChange={(e) => setIsbnInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="ISBN 13자리 또는 10자리"
                  className="w-full pl-10 pr-3 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all text-sm font-medium"
                />
                <Search className="absolute left-3.5 top-3.5 text-gray-400" size={20} />
              </div>

              <div className="w-28 flex-shrink-0">
                <input
                  type="text"
                  value={addonInput}
                  onChange={handleAddonChange}
                  placeholder="5자리(선택)"
                  className="w-full px-3 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all text-sm text-center font-medium"
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-[#1d1d1f] text-white px-5 rounded-xl font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 whitespace-nowrap text-sm"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : '검색'}
              </button>
            </div>

            <div className="flex flex-col gap-3 bg-blue-50 p-4 rounded-xl text-blue-700 border border-blue-100">
              <div className="flex items-start gap-2.5">
                <Info size={18} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm leading-snug">
                  ISBN-13 또는 ISBN-10을 입력해주세요.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Info size={18} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm leading-snug">
                  세트 도서의 경우 박스 바코드보다 <strong className="font-semibold underline decoration-blue-300 underline-offset-2">읽으실 낱권의 바코드</strong>를 입력하는 것을 추천해요.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 mb-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 animate-pulse border border-red-100">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {searchResult ? (
            <div className="border border-gray-200 rounded-2xl p-4 flex gap-5 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="relative w-28 h-40 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-100 shadow-inner">
                {(searchResult.cover || searchResult.cover_image) ? (
                  <Image
                    src={searchResult.cover || searchResult.cover_image}
                    alt={searchResult.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                    <Book size={32} />
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between flex-1 py-1">
                <div>
                  <h3 className="font-bold text-[#1d1d1f] text-lg leading-tight mb-2 line-clamp-2">
                    {searchResult.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">{searchResult.author}</p>
                  <p className="text-xs text-gray-400">{searchResult.publisher} · {searchResult.pubDate}</p>
                </div>
                
                <button
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="mt-3 w-full bg-[#0066cc] text-white py-3 rounded-xl font-semibold hover:bg-[#0052a3] transition-colors active:scale-[0.98] shadow-md shadow-blue-500/20"
                >
                  {isLoading ? '저장 중...' : '내 서재에 담기'}
                </button>
              </div>
            </div>
          ) : (
            !isLoading && !error && (
              <div className="flex flex-col items-center justify-center pt-2 pb-6">
                <div className="relative w-full aspect-[2/1] max-w-[400px]">
                  <Image 
                    src="/guide_isbn.png" 
                    alt="ISBN 가이드"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}