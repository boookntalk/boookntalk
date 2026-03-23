// 파일 경로: src/app/(main)/my-authors/timeline/page.tsx
// 역할 및 기능: BoooknTalk의 '나의 작가 > 작가 타임라인' URL 라우트를 활성화하고 클라이언트 컴포넌트를 연결하는 서버 컴포넌트

import React from 'react';
import AuthorTimelineClient from './AuthorTimelineClient';

// 함수 기능: /my-authors/timeline 경로에 접근 시 AuthorTimelineClient UI를 화면에 렌더링합니다.
export default function AuthorTimelinePage() {
    return <AuthorTimelineClient />;
}