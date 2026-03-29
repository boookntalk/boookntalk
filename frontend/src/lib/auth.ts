// 파일 경로: src/auth.ts (또는 lib/auth.ts)
// 역할 및 기능: Google 로그인이 성공하면 백엔드 API를 호출하여 DB 유저 정보를 동기화(조회 또는 회원가입)하고, DB에서 부여된 실제 role 값을 JWT 토큰에 영구적으로 새겨 넣습니다.

import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
    ],
    callbacks: {
        // 함수 기능: 로그인 성공 직후 JWT 토큰을 생성할 때, 백엔드와 통신하여 실제 DB의 role을 가져옵니다.
        async jwt({ token, user, account }) {
            // user와 account는 사용자가 최초로 로그인하는 그 순간에만 존재합니다!
            if (account && user) {
                try {
                    // 💡 [핵심 브릿지] 우리 백엔드 서버의 '로그인/가입 동기화 API'를 호출!
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                    const res = await fetch(`${apiUrl}/api/auth/sync`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: user.email,
                            nickname: user.name,
                            profile_image: user.image
                        })
                    });

                    if (res.ok) {
                        const dbUser = await res.json();
                        // 백엔드 DB에서 응답받은 진짜 권한(role)을 토큰에 저장!
                        token.role = dbUser.role; 
                    } else {
                        // 통신 실패 시 방어 코드
                        token.role = 'USER';
                    }
                } catch (error) {
                    console.error("백엔드 유저 동기화 실패:", error);
                    token.role = 'USER';
                }
            }
            return token;
        },

        // 함수 기능: 토큰에 담긴 진짜 role을 프론트엔드 브라우저(세션)로 전달합니다.
        async session({ session, token }) {
            if (session.user) {
                // 토큰의 role을 세션 객체에 주입! (이후 프론트엔드에서 session.user.role로 확인 가능)
                session.user.role = token.role as string;
            }
            return session;
        }
    },
    session: {
        strategy: "jwt",
    },
};