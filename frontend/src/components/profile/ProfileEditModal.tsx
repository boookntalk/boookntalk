'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Save, User as UserIcon, Quote, X } from 'lucide-react';

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: any;
}

export default function ProfileEditModal({ isOpen, onClose, session }: ProfileEditModalProps) {
    const router = useRouter();
    const [nickname, setNickname] = useState('');
    const [bio, setBio] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // 모달이 열릴 때마다 최신 프로필 정보 불러오기
    useEffect(() => {
        if (isOpen && session?.user?.email) {
            const fetchProfile = async () => {
                setIsLoading(true);
                try {
                    const res = await fetch(`http://127.0.0.1:8000/api/users/${session.user.email}/profile`);
                    if (!res.ok) throw new Error('프로필 정보를 불러오지 못했습니다.');
                    const data = await res.json();
                    setNickname(data.nickname || '');
                    setBio(data.bio || '');
                } catch (error) {
                    toast.error('프로필 정보를 불러오는데 실패했습니다.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProfile();
        }
    }, [isOpen, session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim()) {
            toast.warning('닉네임을 입력해 주세요.');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/users/${session?.user?.email}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nickname: nickname.trim(),
                    bio: bio.trim()
                })
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 400 && data.detail === '이미 사용 중인 닉네임입니다.') {
                    toast.error('앗! 이미 누군가 사용 중인 닉네임입니다.');
                    return;
                }
                throw new Error(data.detail || '저장 실패');
            }

            toast.success('프로필이 성공적으로 저장되었습니다!');
            router.refresh();
            onClose(); // 저장 성공 시 모달 닫기
            
        } catch (error) {
            console.error(error);
            toast.error('프로필 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* 뒷배경 어둡게 */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* 모달 컨텐츠 (스크롤 가능하도록 max-h 설정) */}
            <div className="relative w-full max-w-[500px] m-4 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] animate-in fade-in zoom-in-95 duration-200">
                
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white z-10">
                    <h2 className="text-[18px] font-bold text-[#1d1d1f]">프로필 설정</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* 바디 (내부 스크롤 영역) */}
                <div className="p-6 overflow-y-auto bg-[#fafafa]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-[#0066cc]"/>
                        </div>
                    ) : (
                        <form id="profile-form" onSubmit={handleSubmit}>
                            {/* 프로필 이미지 */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100 mb-3">
                                    {session?.user?.image ? (
                                        <img src={session.user.image} alt="프로필" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <UserIcon size={32} />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[12px] text-gray-400 font-medium">구글 계정 이미지</p>
                            </div>

                            {/* 닉네임 */}
                            <div className="mb-5">
                                <label className="block text-[13px] font-bold text-[#1d1d1f] mb-2">
                                    닉네임 <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="예: 독서왕"
                                    maxLength={20}
                                    className="w-full h-11 bg-white border border-gray-200 focus:border-[#0066cc] rounded-xl px-4 text-[14px] text-[#1d1d1f] outline-none transition-all shadow-sm focus:ring-4 focus:ring-[#0066cc]/10"
                                />
                            </div>

                            {/* 한 줄 소개 */}
                            <div className="mb-2">
                                <label className="block text-[13px] font-bold text-[#1d1d1f] mb-2 flex items-center gap-1.5">
                                    <Quote size={12} className="text-gray-400" /> 한 줄 소개
                                </label>
                                <textarea 
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="나의 독서 취향이나 다짐을 자유롭게 적어주세요."
                                    maxLength={100}
                                    rows={3}
                                    className="w-full bg-white border border-gray-200 focus:border-[#0066cc] rounded-xl p-4 text-[14px] text-[#1d1d1f] outline-none transition-all shadow-sm focus:ring-4 focus:ring-[#0066cc]/10 resize-none"
                                />
                                <div className="flex justify-end mt-1.5">
                                    <span className="text-[11px] text-gray-400">{bio.length} / 100</span>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* 푸터 (버튼 고정 영역) */}
                <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-end gap-2">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        취소
                    </button>
                    <button 
                        type="submit" 
                        form="profile-form"
                        disabled={isSaving || !nickname.trim() || isLoading}
                        className="bg-[#0066cc] text-white px-6 py-2.5 rounded-xl font-bold text-[14px] flex items-center gap-2 hover:bg-[#0052a3] transition-all disabled:opacity-50 shadow-md shadow-blue-500/20"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? '저장 중...' : '저장하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}