// frontend/src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth"; // 👈 방금 작성한 파일에서 옵션 가져오기

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };