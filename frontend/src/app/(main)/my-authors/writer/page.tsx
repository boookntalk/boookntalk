// 파일 경로: src/app/(main)/my-authors/writer/page.tsx
// 역할 및 기능: BoooknTalk의 '나의 작가 > 작가' 라우트를 처리하고 화면 분할된 클라이언트 컴포넌트를 렌더링합니다.

import React from 'react';
import AuthorWriterClient from './AuthorWriterClient';

// 함수 기능: 작가 페이지 진입 시 좌우 분할된 AuthorWriterClient UI를 화면에 그립니다.
export default function AuthorWriterPage() {
    return <AuthorWriterClient />;
}