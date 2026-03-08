import { NextResponse } from "next/server";
import { fetchCourseItemIds } from "@/lib/dbActions";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const data = await fetchCourseItemIds(Number(courseId));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "内部サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
