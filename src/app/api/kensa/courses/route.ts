import { NextResponse } from "next/server";
import { fetchKensaCourses } from "@/lib/dbActions";

export const runtime = "edge";

export async function GET() {
  try {
    const data = await fetchKensaCourses();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "内部サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
