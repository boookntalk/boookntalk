/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // ▼▼▼ [추가] 우리 백엔드 서버(로컬) 이미지 허용 통행증 ▼▼▼
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**', // 8000번 포트에서 오는 모든 경로의 이미지 허용
      },
      // [1] 공유해주신 URL에 해당하는 도메인 (필수!)
      {
        protocol: 'https',
        hostname: 'shopping-phinf.pstatic.net',
      },
      // [2] 네이버 도서 검색 썸네일 (필수)
      {
        protocol: 'https',
        hostname: 'bookthumb-phinf.pstatic.net',
      },
      // [3] 네이버 통합 검색 등 (권장)
      {
        protocol: 'https',
        hostname: 'search.pstatic.net',
      },
      // [4] 기타 (국립중앙도서관, 알라딘, 구글 등)
      {
        protocol: 'http',
        hostname: 'u-lib.nl.go.kr',
      },
      {
        protocol: 'https',
        hostname: 'u-lib.nl.go.kr',
      },
      {
        protocol: 'https',
        hostname: 'image.aladin.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'books.google.com',
      },
    ],
  },
};

module.exports = nextConfig;