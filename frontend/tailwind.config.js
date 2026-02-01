/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. 경로 최적화: src 폴더를 기준으로 간결하게 정리합니다.
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'cover-hover': '8px 12px 12px rgba(0, 0, 0, 0.4)', // 공백을 사용해 정의
      },
      borderRadius: {
        'modal': '20px',    // 50px에서 20px로 수정 (이미지상의 곡률이 훨씬 정갈해집니다)
        'card': '12px',
        'button': '12px',
      },
      // 2. 부우욱앤톡 전용 폰트 설정
      fontFamily: {
        serif: ['Nanum Myeongjo', 'serif'],
        sans: ['Pretendard', 'Inter', 'sans-serif'], // 앱 전반의 가독성을 위한 고딕 계열 추가
      },
      // 4. 브랜드 컬러 시스템 구축
      colors: {
        brand: {
          primary: '#0066cc',
          black: '#1d1d1f',
          gray: '#86868b',
          bg: '#f5f5f7',
        }
      },

      // 5. Park UI(Ark UI) 컴포넌트의 부드러운 움직임을 위한 애니메이션
      keyframes: {
        'fade-in': { 'from': { opacity: '0' }, 'to': { opacity: '1' } },
        'fade-out': { 'from': { opacity: '1' }, 'to': { opacity: '0' } },
        'zoom-in': { 'from': { transform: 'scale(0.95)', opacity: '0' }, 'to': { transform: 'scale(1)', opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-in',
        'zoom-in': 'zoom-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'), // Park UI의 애니메이션 처리를 위해 권장되는 플러그인
  ],
}

// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [
//     "./src/**/*.{js,ts,jsx,tsx,mdx}", // src 폴더 내부 모든 파일 감시
//     "./app/**/*.{js,ts,jsx,tsx,mdx}",
//     "./pages/**/*.{js,ts,jsx,tsx,mdx}",
//     "./components/**/*.{js,ts,jsx,tsx,mdx}",
//   ],
//   theme: {
//     extend: {
//       fontFamily: {
//         serif: ['Nanum Myeongjo', 'serif'],
//       },
//     },
//   },
//   plugins: [],
// }