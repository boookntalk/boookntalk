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
    // [수정] 배경색(bg-[#f5f5f7])과 마진(-mt, pt)을 모두 제거합니다.
    // 레이아웃이 다 알아서 해주니까요!
    <div>
      <LibraryClient initialBooks={initialBooks} />
    </div>
  );
}