import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ShortReviewsClient from "./ShortReviewsClient";

export const dynamic = 'force-dynamic';

export default async function ShortReviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/"); 
  }

  let initialReviews = [];
  try {
    // 한줄평 API 호출 (127.0.0.1 사용)
    const res = await fetch(`http://127.0.0.1:8000/api/users/${session.user.email}/short-reviews`, {
      cache: "no-store",
    });
    
    if (res.ok) {
      initialReviews = await res.json();
    }
  } catch (error) {
    console.error("백엔드 연결 오류:", error);
  }

  // 자식 컴포넌트(ShortReviewsClient)가 기대하는 'initialReviews' 이름으로 전달
  return <ShortReviewsClient initialReviews={initialReviews} user={session.user} />;
}