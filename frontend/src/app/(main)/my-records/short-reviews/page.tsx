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
    const res = await fetch(`http://localhost:8000/api/users/${session.user.email}/short-reviews`, {
      cache: "no-store",
    });
    if (res.ok) {
      initialReviews = await res.json();
    }
  } catch (error) {
    console.error("백엔드 연결 오류:", error);
  }

  return <ShortReviewsClient initialReviews={initialReviews} user={session.user} />;
}