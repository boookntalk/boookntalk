import React from 'react';
import LongReviewsClient from './LongReviewsClient';

// 긴줄평 목록 페이지 (서버 컴포넌트)
export default function LongReviewsPage() {
    // 이제 LongReviewsClient 내부에서 API를 직접 호출하므로, 프롭스를 넘기지 않습니다.
    return <LongReviewsClient />;
}