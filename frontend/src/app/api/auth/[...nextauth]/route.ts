import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // 1. 로그인 성공 시 백엔드 API 호출 (데이터 동기화)
      try {
        const response = await fetch("http://localhost:8000/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            nickname: user.name,
            profile_image: user.image,
          }),
        });

        if (response.ok) {
          return true; // 로그인 허용
        } else {
          console.error("Backend sync failed");
          return true; // 동기화 실패해도 일단 로그인은 허용 (선택 사항)
        }
      } catch (error) {
        console.error("Error during sync:", error);
        return true;
      }
    },
    async session({ session, token }) {
      // 세션에 추가 정보 저장
      if (session.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
});

// App Router 환경에서는 반드시 GET과 POST를 export 해야 합니다.
export { handler as GET, handler as POST };