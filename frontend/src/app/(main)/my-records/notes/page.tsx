import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
// ▼ 1. 임포트 대상을 ReadingNotesClient로 변경
import ReadingNotesClient from "./ReadingNotesClient";

export const dynamic = 'force-dynamic';

export default async function ReadingNotesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/"); 
  }

  let initialNotes = [];
  try {
    // 독서노트(메모) 데이터를 가져오는 API 주소 확인
    const res = await fetch(`http://127.0.0.1:8000/api/memos/user/${session.user.email}`, {
      cache: "no-store",
    });
    
    if (res.ok) {
      initialNotes = await res.json();
    }
  } catch (error) {
    console.error("백엔드 연결 오류:", error);
  }

  // ▼ 2. 전달하는 Prop 이름을 initialNotes로 변경 (자식 컴포넌트의 이름과 일치)
  return <ReadingNotesClient initialNotes={initialNotes} />;
}