// 파일 경로: src/types/next-auth.d.ts
// 역할 및 기능: NextAuth의 기본 세션 및 토큰 타입에 BoooknTalk 전용 커스텀 속성인 'role'을 공식적으로 추가하여 TypeScript의 타입 추론 에러를 완벽하게 방지합니다.

import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

// 함수(모듈) 기능: NextAuth 모듈의 기존 Session 및 User 인터페이스를 확장(재정의)합니다.
declare module "next-auth" {
  interface Session {
    user: {
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

// 함수(모듈) 기능: next-auth/jwt 모듈의 기존 JWT 인터페이스를 확장(재정의)합니다.
declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}