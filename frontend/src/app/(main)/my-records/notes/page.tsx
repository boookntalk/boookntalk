import React from 'react';
import ReadingNotesClient from './ReadingNotesClient';

export const dynamic = 'force-dynamic';

export default function ReadingNotesPage() {
    // 클라이언트 컴포넌트에서 직접 로딩 화면을 띄우고 API를 호출하므로, 
    // 서버에서 데이터를 미리 던져주지 않습니다.
    return <ReadingNotesClient />;
}