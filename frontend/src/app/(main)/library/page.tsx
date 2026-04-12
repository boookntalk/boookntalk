// 경로: frontend/src/app/(main)/library/page.tsx
// 역할 및 기능: 내 서재의 데이터를 서버에서 가져와 클라이언트 컴포넌트로 전달하는 진입점입니다.

import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import LibraryClient from "./LibraryClient";
import { redirect } from "next/navigation";
import StandardContainer from '@/components/layout/StandardContainer';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);

  // 세션이 없거나 이메일 정보가 없으면 홈으로 리다이렉트
  if (!session?.user?.email) {
    redirect("/"); 
  }

  let initialBooks = [];
  
  try {
    // 백엔드 API로부터 해당 유저의 서재 도서 목록 조회
    const res = await fetch(`http://localhost:8000/api/my-library/${session.user.email}`, {
      cache: "no-store",
    });
    if (res.ok) {
      initialBooks = await res.json();
    }
  } catch (error) {
    console.error("백엔드 연결 오류:", error);
  }

  return (
    // 💡 [핵심] LibraryClient 내부에서 StandardContainer를 사용하여 레이아웃을 잡습니다.
    <LibraryClient initialBooks={initialBooks} user={session.user} />
  );
}