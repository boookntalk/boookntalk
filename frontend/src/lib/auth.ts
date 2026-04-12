// 경로: frontend/src/lib/auth.ts (또는 authOptions가 정의된 파일)

import { NextAuthOptions } from "next-auth"; // 👈 1. 반드시 최상단에서 타입을 불러와야 합니다.
import GoogleProvider from "next-auth/providers/google"; // (사용 중이신 프로바이더)

// ▼▼▼ 2. [핵심] 변수명 뒤에 ': NextAuthOptions'를 반드시 붙여주세요! ▼▼▼
export const authOptions: NextAuthOptions = { 
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    // 기타 사용 중인 프로바이더...
  ],
  session: {
    // 💡 3. 위에서 타입을 지정했기 때문에, 이제 "jwt"라고만 적어도 TypeScript가 정확히 인식합니다.
    strategy: "jwt", 
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    }
  }
};