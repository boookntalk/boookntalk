import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import { FontSize } from '@/lib/tiptap/FontSize';
import { PenTool, Eye, Trash2, ImageIcon, HelpCircle, Loader2, Heading1, Heading2, Bold, Italic, List, Quote, RotateCcw, Type } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// [1] 최상위 래퍼 컴포넌트: DB에서 '진짜 닉네임'을 가져오는 역할만 전담합니다.
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
                    
                    // ▼▼▼ [핵심 정리] 지저분한 user.name || user.email.split 대체 로직을 모두 삭제했습니다. ▼▼▼
                    // 오직 'DB에 등록한 닉네임'만 바라보고, 없으면 무조건 '익명'으로 처리합니다.
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

    // 진짜 닉네임을 서버에서 가져오는 찰나의 순간에는 빈 스켈레톤 UI를 보여줍니다.
    if (!realNickname) {
        return <div className="w-full h-[300px] bg-white rounded-[24px] shadow-sm border border-gray-100 mt-[var(--spacing-1cm,32px)] animate-pulse" />;
    }

    // 닉네임이 준비되면, 진짜 에디터 컴포넌트를 렌더링합니다.
    return <LongReviewEditor recordId={recordId} user={user} realNickname={realNickname} />;
}


// ============================================================================
// [2] 실제 에디터 컴포넌트: 준비된 진짜 닉네임을 받아 에디터를 렌더링합니다.
// ============================================================================
function LongReviewEditor({ recordId, user, realNickname }: { recordId?: number; user?: any; realNickname: string }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); 
    const [isEditing, setIsEditing] = useState(false); 
    const [isDraft, setIsDraft] = useState(true); 
    const [hasReview, setHasReview] = useState(false); 
    const [isLoading, setIsLoading] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            FontSize as any,
            Color,
            Image.configure({
                HTMLAttributes: { class: 'rounded-xl max-w-full my-4 mx-auto block shadow-sm' },
            }),
            // ▼ [핵심] DB에서 가져온 진짜 닉네임(realNickname)을 적용합니다!
            Placeholder.configure({
                placeholder: `${realNickname}님의 생각을 보여주세요.`,
            }),
        ],
        immediatelyRender: false,
        onUpdate: ({ editor }) => setContent(editor.getHTML()),
        editorProps: {
            attributes: {
                class: 'prose prose-sm md:prose-base lg:prose-lg outline-none min-h-[600px] max-w-none text-[#1d1d1f] leading-relaxed py-6',
            },
        },
    });

    // --- [데이터 Fetch] ---
    useEffect(() => {
        if (!recordId || isNaN(recordId) || !editor) return;
        const fetchLongReview = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/records/${recordId}/long-review`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.long_review_title || data.long_review_content) {
                        setTitle(data.long_review_title || '');
                        setContent(data.long_review_content || '');
                        setIsDraft(data.is_long_review_draft);
                        setHasReview(true);
                        editor.commands.setContent(data.long_review_content || '');
                        setIsEditing(false);
                    } else {
                        setHasReview(false);
                        setIsEditing(false); 
                    }
                }
            } finally { setIsLoading(false); }
        };
        fetchLongReview();
    }, [recordId, editor]);

    // --- [자동 포커스] ---
    useEffect(() => {
        if (isEditing && titleInputRef.current) {
            titleInputRef.current.focus();
        }
    }, [isEditing]);

    // --- [이미지 업로드 로직] ---
    const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !recordId || !editor) return;
        const formData = new FormData();
        formData.append('file', file);
        setIsImageUploading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/records/${recordId}/long-review/images`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                editor.chain().focus().setImage({ src: data.url }).run();
                toast.success('이미지가 삽입되었습니다.');
            }
        } finally { setIsImageUploading(false); }
    }, [recordId, editor]);

    // --- [저장 및 삭제 로직] ---
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
                setIsDraft(saveAsDraft);
                setHasReview(true);
                if (!saveAsDraft) setIsEditing(false);
            }
        } finally { setIsLoading(false); }
    };

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
                editor?.commands.clearContent();
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

    const MenuButton = ({ onClick, isActive, children }: any) => (
        <button
            type="button"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-blue-50 text-[#0066cc]' : 'text-gray-400 hover:text-gray-600'}`}
        >
            {children}
        </button>
    );

    if (!editor && !isLoading) return null;

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
                            <div className="relative group flex items-center">
                                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 text-[12px] font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                                    {isImageUploading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                                    이미지 추가
                                </button>
                                <HelpCircle size={14} className="text-gray-300 ml-1.5 cursor-help hover:text-[#0066cc] transition-colors" />
                                
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-56 p-2.5 bg-[#1d1d1f] text-white text-[11px] leading-relaxed rounded-xl shadow-xl z-50">
                                    <p>클릭하여 이미지를 업로드하거나,</p>
                                    <p className="text-blue-300 font-bold">에디터 창에 파일을 드래그 앤 드롭</p>
                                    <p>하여 글 중간에 바로 넣을 수 있습니다.</p>
                                </div>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                            
                            <div className="w-[1px] h-3 bg-gray-200 mx-1" />
                            
                            {hasReview && (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors">
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

            {/* 2. 스티키 슬림 툴바 */}
            {isEditing && (
                <div className="sticky top-0 z-30 flex items-center justify-center py-1.5 px-4 bg-white/90 backdrop-blur-md border-b border-gray-50">
                    <div className="flex items-center gap-0.5 px-2 py-0.5 bg-gray-50 rounded-xl border border-gray-100">
                        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}><Heading1 size={16} /></MenuButton>
                        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}><Heading2 size={16} /></MenuButton>
                        <div className="w-[1px] h-3 bg-gray-200 mx-1" />
                        <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold size={16} /></MenuButton>
                        <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic size={16} /></MenuButton>
                        <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}><List size={16} /></MenuButton>
                        <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')}><Quote size={16} /></MenuButton>
                        <div className="w-[1px] h-3 bg-gray-200 mx-1" />
                        <MenuButton onClick={() => editor.chain().focus().setFontSize('18px').run()} isActive={editor.isActive('textStyle', { fontSize: '18px' })}><span className="text-[11px] font-black">18</span></MenuButton>
                        <MenuButton onClick={() => editor.chain().focus().unsetFontSize().run()}><RotateCcw size={14} /></MenuButton>
                        <button onClick={() => editor.chain().focus().setColor('#0066cc').run()} className="p-1.5 text-[#0066cc] hover:bg-blue-50 rounded-lg transition-colors"><Type size={16} /></button>
                    </div>
                </div>
            )}

            {/* 3. 본문 영역 */}
            <div className="px-8 md:px-12 py-6">
                {isEditing ? (
                    <div className="
                        [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
                        [&_.is-editor-empty:first-child::before]:text-gray-300
                        [&_.is-editor-empty:first-child::before]:float-left
                        [&_.is-editor-empty:first-child::before]:h-0
                        [&_.is-editor-empty:first-child::before]:pointer-events-none
                        [&_.is-editor-empty:first-child::before]:font-normal
                    ">
                        <input 
                            ref={titleInputRef}
                            type="text"
                            placeholder="제목을 입력하세요"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    editor?.commands.focus();
                                }
                            }}
                            className="w-full text-[24px] font-black text-[#1d1d1f] placeholder-gray-200 outline-none border-none bg-transparent mb-4"
                        />
                        <EditorContent editor={editor} />
                    </div>
                ) : (
                    hasReview ? (
                        <div className="animate-in fade-in duration-500">
                            <h1 className="text-[28px] font-black text-[#1d1d1f] mb-6 leading-tight">{title || "제목 없는 긴줄평"}</h1>
                            <div 
                                className="prose prose-base max-w-none text-[#1d1d1f] leading-relaxed break-keep"
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