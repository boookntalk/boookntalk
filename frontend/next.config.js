const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ▼▼▼ [수정] 최신 Next.js 규격에 맞게 turbopack 설정 변경 ▼▼▼
  turbopack: {
    // 절대 경로를 사용하여 경고를 제거하고 루트를 확실히 지정
    root: path.resolve(__dirname, '../'), 
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      // ▼▼▼ [추가] 우리 백엔드 서버(로컬) 이미지 허용 통행증 ▼▼▼
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/static/**', // static 경로 명시
      },
      // [1] 공유해주신 URL에 해당하는 도메인 (필수!)
      { protocol: 'https', hostname: 'shopping-phinf.pstatic.net', },
      // [2] 네이버 도서 검색 썸네일 (필수)
      { protocol: 'https', hostname: 'bookthumb-phinf.pstatic.net', },
      // [3] 네이버 통합 검색 등 (권장)
      { protocol: 'https', hostname: 'search.pstatic.net', },
      // [4] 기타 (국립중앙도서관, 알라딘, 구글 등)
      { protocol: 'http', hostname: 'u-lib.nl.go.kr', },
      { protocol: 'https', hostname: 'u-lib.nl.go.kr', },
      { protocol: 'https', hostname: 'image.aladin.co.kr', },
      { protocol: 'https', hostname: 'books.google.com', },
    ],
  },
};

module.exports = nextConfig;