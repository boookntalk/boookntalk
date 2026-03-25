// 파일 경로: src/app/(main)/my-authors/translator/page.tsx
// 역할 및 기능: BoooknTalk의 '나의 작가 > 옮긴이' 라우트를 처리하고 화면 분할된 클라이언트 컴포넌트를 렌더링합니다.

import React from 'react';
import AuthorTranslatorClient from './AuthorTranslatorClient';

// 함수 기능: 옮긴이 페이지 진입 시 좌우 분할된 AuthorTranslatorClient UI를 화면에 그립니다.
export default function AuthorTranslatorPage() {
    return <AuthorTranslatorClient />;
}