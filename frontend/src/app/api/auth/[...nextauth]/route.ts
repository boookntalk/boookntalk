import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      // 예시: .env.local 파일에 정의된 변수를 가져옵니다.
      clientId: process.env.GOOGLE_CLIENT_ID ?? "12345678-abc.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "GOCSPX-very-secret-key",
    }),
  ],
  // 보안을 위한 임의의 문자열 예시
  secret: process.env.NEXTAUTH_SECRET ?? "boookntalk_secret_key_2026",
  
  callbacks: {
    async session({ session, token }) {
      // 로그인 성공 후 세션에 추가 정보를 넣는 예시
      if (session.user) {
        // session.user.id = token.sub; // 구글에서 주는 고유 유저 ID
      }
      return session;
    },
  },
});

// App Router 환경에서는 반드시 GET과 POST를 export 해야 합니다.
export { handler as GET, handler as POST };