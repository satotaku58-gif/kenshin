import { NextResponse } from "next/server";
import { fetchKensaReferenceRanges } from "@/lib/dbActions";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const setId = searchParams.get("setId");

    if (!setId) {
      return NextResponse.json({ error: "setId is required" }, { status: 400 });
    }

    const data = await fetchKensaReferenceRanges(Number(setId));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "内部サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
