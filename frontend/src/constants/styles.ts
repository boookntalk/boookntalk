// frontend/src/constants/styles.ts

export const DESIGN_TOKEN = {
  // 라운드 (곡률)
  ROUND: {
    MODAL: 'rounded-modal',   // tailwind.config.js에 정의한 12px 또는 50px
    CARD: 'rounded-card',     // 서재 도서 카드
    ITEM: 'rounded-button',   // 버튼, 입력창, 배지 등 공통 (12px)
  },
  
  // 공통 색상 (부우욱앤톡 브랜드 컬러)
  COLOR: {
    PRIMARY: '#0066cc',       // brand-primary
    TEXT_MAIN: '#1d1d1f',     // brand-black
    TEXT_SUB: '#86868b',      // brand-gray
    BG_LIGHT: '#f5f5f7',      // brand-bg
    STAR: '#ffcc00',          // 별점 색상
  },

  // 폰트 스타일
  FONT: {
    TITLE: 'font-bold text-[#1d1d1f]',
    SUBTITLE: 'text-[13px] text-[#86868b]',
  },
  
  SHADOW: {
        CARD: '0_10px_30px_rgba(0,0,0,0.02)', // 기본 카드 그림자
        CARD_HOVER: '0_30px_60px_rgba(0,0,0,0.12)', // 호버 시 카드 그림자
        // [추가] 표지 전용 그림자 토큰
        COVER_NORMAL: 'none', 
        COVER_HOVER: '8px_12px_20px_rgba(0,0,0,0.2)',
  }
} as const;

