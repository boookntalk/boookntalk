import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// [수정] 설정 옵션을 변수로 분리하고 export 합니다.
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
        const response = await fetch("http://localhost:8000/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            nickname: user.name,
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
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

// 위에서 만든 옵션을 넣어줍니다.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };