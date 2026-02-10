// src/app/(main)/library/page.tsx
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import LibraryClient from "./LibraryClient";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/"); 
  }

  let initialBooks = [];
  // 초기 데이터 로딩 부분 (이 부분은 유지)
  try {
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
    <div>
      {/* ▼▼▼ [수정] user={session.user}를 반드시 추가해야 합니다! ▼▼▼ */}
      <LibraryClient initialBooks={initialBooks} user={session.user} />
    </div>
  );
}