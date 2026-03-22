// src/app/(main)/my-records/insights/page.tsx
import React from 'react';
import InsightsClient from './InsightsClient';

export default function InsightsPage() {
    // TODO: NextAuth 등 세션에서 실제 로그인한 유저 이메일을 가져와서 넣어주세요!
    // (지금은 테스트용 이메일을 강제로 주입해 봅니다)
    const currentUserEmail = "boookntalk@gmail.com"; 

    return <InsightsClient userEmail={currentUserEmail} />;
}