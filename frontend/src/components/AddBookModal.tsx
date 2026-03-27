// 파일 경로: frontend/src/components/AddBookModal.tsx
// 역할 및 기능: 외부 API에서 도서를 검색하고, 사용자가 선택한 독서 상태(4단계)와 함께 BoooknTalk 마스터 API에 전송하여 도서 등록, 서재 저장, 통계 업데이트를 한 번에 처리하는 모달 컴포넌트입니다.

'use client';

import React, { useState } from 'react';
// ▼ [추가] 독서 상태용 아이콘: Heart, Library, BookOpen, CheckCircle 추가
import { X, Search, Book, Loader2, Info, Heart, Library, BookOpen, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

// ▼ [추가] 기획자님과 확정한 4단계 독서 라이프사이클 표준 데이터 정의
const STATUS_OPTIONS = [
    { key: 'WISH', label: '읽고 싶은 책', desc: '아직 소장하지 않았고, 나중에 사거나 빌려 볼 책', icon: Heart },
    { key: 'UNREAD', label: '읽기 전', desc: '책꽂이에 꽂혀있지만, 아직 읽지 않은 진짜 내 책', icon: Library },
    { key: 'READING', label: '현재 읽는 중', desc: '지금 책갈피를 꽂아두고 읽어 내려가는 책', icon: BookOpen },
    { key: 'COMPLETED', label: '다 읽었어요', desc: '마지막 장까지 완독하여 기록을 남길 책', icon: CheckCircle }, // 💡 여기 수정!
];
// const STATUS_OPTIONS = [
//     { key: 'WISH', label: '읽고 싶은 책', desc: '❤️ 아직 소장하지 않았고, 나중에 사거나 빌려 볼 책', icon: Heart },
//     { key: 'UNREAD', label: '읽기 전', desc: '📚 책꽂이에 꽂혀있지만, 아직 읽지 않은 진짜 내 책', icon: Library },
//     { key: 'READING', label: '현재 읽는 중', desc: '📖 지금 책갈피를 꽂아두고 읽어 내려가는 책', icon: BookOpen },
//     { key: 'COMPLETED', label: '다 읽었어요', desc: '✅ 마지막 장까지 완독하여 기록을 남길 책', icon: CheckCircle }, // 💡 여기 수정!
// ];

export default function AddBookModal({ isOpen, onClose, userEmail }: AddBookModalProps) {
  const [isbnInput, setIsbnInput] = useState('');
  const [addonInput, setAddonInput] = useState(''); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [error, setError] = useState('');

  // ▼ [추가] 사용자가 선택한 독서 상태 저장 (기본값: 'WISH')
  const [selectedStatus, setSelectedStatus] = useState<string>('WISH');

  const handleSearch = async () => {
    // ... (검색 유효성 검사 로직 동일) ...
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
    setSelectedStatus('WISH'); // 💡 [추가] 새 검색 시 상태를 기본값으로 초기화

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

  const handleRegister = async () => {
    if (!searchResult || !userEmail) {
      alert("로그인 정보가 없거나 도서 정보가 없습니다.");
      return;
    }

    try {
      setIsLoading(true);
      
      const payload = {
        user_email: userEmail,
        // ▼▼▼ [핵심 수정] 사용자가 선택한 독서 상태값을 백엔드에 전송! ▼▼▼
        status: selectedStatus, 
        // ▲▲▲ 수술 완료 ▲▲▲
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

      const res = await fetch("http://localhost:8000/api/books", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // ... (에러 처리 로직 동일 유지) ...
        const errorText = await res.text();
        try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.detail || '도서 등록에 실패했습니다.');
        } catch (e) {
            throw new Error(`서버 에러 발생: ${res.status}`);
        }
      }

      alert('도서가 성공적으로 내 서재에 담겼습니다!');
      onClose();
      
      window.location.reload(); 
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 5) setAddonInput(val);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* w-full max-w-lg -> max-w-2xl로 확장 (상태 선택 공간 확보) */}
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* 헤더 (동일) */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-[#1d1d1f]">새 도서 등록</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={22} className="text-gray-500" />
          </button>
        </div>

        {/* 바디 */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
          
          {/* 검색 입력 영역 (동일) */}
          <div className="flex flex-col gap-4">
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
            {/* ... (가이드 박스 유지) ... */}
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
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 animate-pulse border border-red-100">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* ▼ [NEW] 검색 결과 및 상태 선택 통합 레이아웃 ▼ */}
          {searchResult ? (
            <div className="flex flex-col gap-8">
              {/* 도서 정보 카드 (동일 유지, 우측 하단 버튼만 삭제) */}
              <div className="border border-gray-200 rounded-2xl p-4 flex gap-5 bg-white shadow-sm">
                <div className="relative w-24 h-36 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-100 shadow-inner">
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

                <div className="flex flex-col justify-center flex-1 py-1">
                    <h3 className="font-bold text-[#1d1d1f] text-lg leading-tight mb-2 line-clamp-2">
                      {searchResult.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">{searchResult.author}</p>
                    <p className="text-xs text-gray-400">{searchResult.publisher} · {searchResult.pubDate}</p>
                </div>
              </div>

              {/* ▼▼▼ [핵심 NEW] 독서 상태 선택 섹션 ▼▼▼ */}
              <div className="flex flex-col gap-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-[#1d1d1f]">어떤 상태로 서재에 담을까요?</label>
                    <span className="text-xs font-bold text-[#0066cc]">필수 선택</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {STATUS_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected = selectedStatus === option.key;
                        
                        return (
                            <button
                                key={option.key}
                                onClick={() => setSelectedStatus(option.key)}
                                className={`flex flex-col gap-2 p-4 rounded-xl border-2 transition-all text-left group
                                    ${isSelected 
                                        ? 'bg-[#0066cc]/5 border-[#0066cc] shadow-sm' 
                                        : 'bg-white border-gray-100 hover:border-[#0066cc]/30'}`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Icon size={18} className={isSelected ? 'text-[#0066cc]' : 'text-gray-400 group-hover:text-[#0066cc]'} />
                                    <span className={`text-[15px] font-bold ${isSelected ? 'text-[#0066cc]' : 'text-[#1d1d1f]'}`}>
                                        {option.label}
                                    </span>
                                </div>
                                <p className={`text-xs leading-snug pl-7 ${isSelected ? 'text-[#0066cc]/80 font-medium' : 'text-gray-400'}`}>
                                    {option.desc}
                                </p>
                            </button>
                        );
                    })}
                </div>
              </div>

              {/* 최종 등록 버튼 (하단 고정) */}
              <button
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full bg-[#0066cc] text-white py-4 rounded-xl font-semibold hover:bg-[#0052a3] transition-colors active:scale-[0.98] shadow-lg shadow-blue-500/20 disabled:opacity-50 text-base"
              >
                {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : `내 서재에 "${STATUS_OPTIONS.find(o => o.key === selectedStatus)?.label}" 상태로 담기`}
              </button>
            </div>
          ) : (
            // ... (가이드 이미지 유지) ...
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