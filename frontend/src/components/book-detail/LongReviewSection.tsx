import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { PenTool, Eye, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// [핵심 1] Tiptap 대신 SunEditor CSS 로드
import 'suneditor/dist/css/suneditor.min.css';

// [핵심 2] Next.js SSR 환경 에러 방지를 위한 동적 렌더링 세팅
const SunEditor = dynamic(() => import('suneditor-react'), {
    ssr: false,
    loading: () => <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-xl"><Loader2 className="animate-spin text-gray-400" /></div>,
});

// ============================================================================
// [1] 최상위 래퍼 컴포넌트: DB에서 '진짜 닉네임'을 가져오는 역할만 전담
// ============================================================================
export default function LongReviewSection({ recordId, user }: { recordId?: number; user?: any }) {
    const [realNickname, setRealNickname] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.email) {
                setRealNickname('익명');
                return;
            }
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/${user.email}/profile`);
                if (res.ok) {
                    const data = await res.json();
                    setRealNickname(data.nickname || '익명');
                } else {
                    setRealNickname('익명');
                }
            } catch (error) {
                setRealNickname('익명');
            }
        };
        fetchProfile();
    }, [user]);

    if (!realNickname) {
        return <div className="w-full h-[300px] bg-white rounded-[24px] shadow-sm border border-gray-100 mt-[var(--spacing-1cm,32px)] animate-pulse" />;
    }

    return <LongReviewEditor recordId={recordId} user={user} realNickname={realNickname} />;
}

// ============================================================================
// [2] 실제 에디터 컴포넌트 (SunEditor 적용)
// ============================================================================
function LongReviewEditor({ recordId, user, realNickname }: { recordId?: number; user?: any; realNickname: string }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); 
    
    // [핵심 3] 취소를 눌렀을 때 되돌아갈 '원본 스냅샷' 데이터 상태 보관
    const [originalTitle, setOriginalTitle] = useState('');
    const [originalContent, setOriginalContent] = useState('');

    const [isEditing, setIsEditing] = useState(false); 
    const [isDraft, setIsDraft] = useState(true); 
    const [hasReview, setHasReview] = useState(false); 
    const [isLoading, setIsLoading] = useState(false);

    const titleInputRef = useRef<HTMLInputElement>(null);

    // --- [데이터 Fetch] ---
    useEffect(() => {
        if (!recordId || isNaN(recordId)) return;
        const fetchLongReview = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/records/${recordId}/long-review`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.long_review_title || data.long_review_content) {
                        setTitle(data.long_review_title || '');
                        setContent(data.long_review_content || '');
                        
                        // DB에서 불러온 진짜 원본 데이터를 백업
                        setOriginalTitle(data.long_review_title || '');
                        setOriginalContent(data.long_review_content || '');
                        
                        setIsDraft(data.is_long_review_draft);
                        setHasReview(true);
                        setIsEditing(false);
                    } else {
                        setHasReview(false);
                        setIsEditing(false); 
                    }
                }
            } finally { setIsLoading(false); }
        };
        fetchLongReview();
    }, [recordId]);

    // --- [자동 포커스] ---
    useEffect(() => {
        if (isEditing && titleInputRef.current) {
            titleInputRef.current.focus();
        }
    }, [isEditing]);

    // --- [핵심 4] SunEditor 전용 이미지 드래그 앤 드롭 업로드 가로채기 ---
    const handleImageUploadBefore = (files: any[], info: object, uploadHandler: Function) => {
        const file = files[0];
        if (!file || !recordId) {
            uploadHandler();
            return false;
        }
        
        const formData = new FormData();
        formData.append('file', file);

        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/records/${recordId}/long-review/images`, {
            method: 'POST',
            body: formData,
        })
        .then(res => res.json())
        .then(data => {
            // 성공 시 백엔드에서 받은 URL을 에디터 본문에 삽입
            const response = {
                result: [
                    { url: data.url, name: file.name, size: file.size }
                ]
            };
            uploadHandler(response);
        })
        .catch(err => {
            toast.error('이미지 업로드에 실패했습니다.');
            uploadHandler();
        });

        return undefined; // 비동기 처리를 위해 필수로 반환해야 함
    };

    // --- [저장 로직] ---
    const handleSave = async (saveAsDraft: boolean) => {
        if (!user || !recordId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/records/${recordId}/long-review`, {
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    long_review_title: title,
                    long_review_content: content,
                    is_long_review_draft: saveAsDraft 
                })
            });
            if (res.ok) {
                toast.success(saveAsDraft ? '임시저장 완료' : '긴줄평 발행 완료!');
                // 저장이 완료되면 원본 스냅샷 데이터도 방금 저장한 내용으로 갱신
                setOriginalTitle(title);
                setOriginalContent(content);
                
                setIsDraft(saveAsDraft);
                setHasReview(true);
                if (!saveAsDraft) setIsEditing(false);
            }
        } finally { setIsLoading(false); }
    };

    // --- [삭제 로직] ---
    const handleDelete = async () => {
        if (!confirm("정말 이 긴줄평을 삭제하시겠습니까? (복구할 수 없습니다)")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/records/${recordId}/long-review`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('긴줄평이 삭제되었습니다.');
                setTitle('');
                setContent('');
                setOriginalTitle('');
                setOriginalContent('');
                setHasReview(false);
                setIsDraft(true);
                setIsEditing(true);
            }
        } catch (error) {
            toast.error('삭제에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- [핵심 5] 취소 버튼 로직 (원본으로 롤백) ---
    const handleCancel = () => {
        setTitle(originalTitle);
        setContent(originalContent);
        setIsEditing(false);
    };

    return (
        <div className="w-full bg-white rounded-[24px] shadow-sm border border-gray-100 mt-[var(--spacing-1cm,32px)] overflow-hidden">
            
            {/* 1. 슬림 헤더 */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-50 bg-white">
                <div className="flex items-center gap-2">
                    <PenTool size={16} className="text-[#0066cc]" />
                    <span className="text-[14px] font-bold text-[#1d1d1f]">나의 긴줄평</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                    {isEditing ? (
                        <>
                            {hasReview && (
                                <>
                                    {/* 취소 버튼 */}
                                    <button onClick={handleCancel} className="px-3 py-1.5 text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors">
                                        취소
                                    </button>
                                    <button onClick={handleDelete} title="삭제" className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                            <button onClick={() => handleSave(false)} className="px-4 py-1.5 rounded-lg bg-[#1d1d1f] text-white text-[12px] font-bold hover:bg-black shadow-md transition-transform active:scale-95">발행하기</button>
                        </>
                    ) : (
                        hasReview && (
                            <>
                                <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-bold text-gray-500 hover:bg-gray-50">
                                    <Eye size={12} /> 수정하기
                                </button>
                                <button onClick={handleDelete} title="삭제" className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </>
                        )
                    )}
                </div>
            </div>

            {/* 2. 본문 영역 */}
            <div className="px-8 md:px-12 py-6">
                {isEditing ? (
                    <div className="suneditor-container">
                        <input 
                            ref={titleInputRef}
                            type="text"
                            placeholder="제목을 입력하세요"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    // Enter 치면 에디터 본문으로 포커스 이동
                                    document.querySelector<HTMLElement>('.sun-editor-editable')?.focus();
                                }
                            }}
                            className="w-full text-[24px] font-black text-[#1d1d1f] placeholder-gray-200 outline-none border-none bg-transparent mb-4"
                        />
                        {/* SunEditor 컴포넌트 */}
                        <SunEditor 
                            setContents={content}
                            onChange={setContent}
                            onImageUploadBefore={handleImageUploadBefore}
                            setOptions={{
                                placeholder: `${realNickname}님의 생각을 보여주세요. (이미지를 드래그 앤 드롭하여 삽입할 수 있습니다)`,
                                buttonList: [
                                    ['bold', 'underline', 'italic', 'strike'],
                                    ['fontColor', 'hiliteColor'],
                                    ['formatBlock'], // 👈 이 부분을 수정했습니다 ('h1', 'h2', 'h3' -> 'formatBlock')
                                    ['align', 'list'],
                                    ['image', 'link'],
                                    ['undo', 'redo']
                                ],
                                minHeight: "400px",
                                resizingBar: false,
                                imageResizing: true,
                            }}
                        />
                    </div>
                ) : (
                    hasReview ? (
                        <div className="animate-in fade-in duration-500">
                            <h1 className="text-[28px] font-black text-[#1d1d1f] mb-6 leading-tight">{title || "제목 없는 긴줄평"}</h1>
                            <div 
                                className="sun-editor-editable max-w-none text-[#1d1d1f] leading-relaxed break-keep p-0 border-none"
                                dangerouslySetInnerHTML={{ __html: content }}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-500">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <PenTool size={28} className="text-gray-300" />
                            </div>
                            <h3 className="text-[18px] font-bold text-[#1d1d1f] mb-2">아직 기록된 사색이 없습니다</h3>
                            <p className="text-[14px] text-gray-400 mb-8 max-w-sm leading-relaxed">
                                책을 읽으며 머문 깊은 사색의 조각들을 엮어 <br/>한 편의 멋진 긴줄평을 완성해 보세요.
                            </p>
                            <button 
                                onClick={() => setIsEditing(true)} 
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1d1d1f] text-white text-[14px] font-bold hover:bg-black shadow-lg shadow-black/10 transition-transform active:scale-95"
                            >
                                <PenTool size={16} /> 첫 긴줄평 작성하기
                            </button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}