// 경로: frontend/src/app/(main)/square/page.tsx
// 역할 및 기능: 광장 메뉴의 도서 데이터를 백엔드 API로부터 서버 측에서 직접 조회하여 클라이언트 컴포넌트로 주입하는 실 데이터 연동 진입점입니다.

import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import SquareClient from "./SquareClient";

export const dynamic = 'force-dynamic';

export default async function SquarePage() {
  const session = await getServerSession(authOptions);
  let initialWorks = [];
  
  try {
    // 💡 [실 데이터 연동] 백엔드 API로부터 광장 전체 공유 도서 DB 및 인기 작품 목록 실시간 조회
    const res = await fetch(`http://localhost:8000/api/square/works`, {
      cache: "no-store",
    });
    if (res.ok) {
      initialWorks = await res.json();
    }
  } catch (error) {
    console.error("BoooknTalk 백엔드 데이터 페칭 오류:", error);
  }

  return (
    <SquareClient initialWorks={initialWorks} user={session?.user || null} />
  );
}