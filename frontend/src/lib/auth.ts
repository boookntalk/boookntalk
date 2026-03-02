// auth.ts
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user }: any) {
      try {
        // [수정] 필드명을 nickname -> google_name으로 변경하여 '원본 데이터'임을 명시
        await fetch("http://localhost:8000/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            google_name: user.name, // 닉네임이 아닌 구글 프로필 이름임
            profile_image: user.image,
          }),
        });
        return true; 
      } catch (error) {
        console.error("Error during sync:", error);
        return true;
      }
    },
    async session({ session, token }: any) {
      // 세션 유지 시 DB의 최신 정보를 반영하고 싶다면 여기서 추가 API 호출이 필요할 수 있습니다.
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};