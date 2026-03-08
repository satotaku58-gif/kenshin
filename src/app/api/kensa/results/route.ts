import { NextResponse } from "next/server";
import { fetchKensaResultsByReceptIds } from "@/lib/dbActions";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("receptIds");
    if (!ids) {
      return NextResponse.json({ error: "receptIds are required" }, { status: 400 });
    }
    const receptIds = ids.split(",").map(id => isNaN(Number(id)) ? id : Number(id));

    const data = await fetchKensaResultsByReceptIds(receptIds);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "内部サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
