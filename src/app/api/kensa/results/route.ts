import { NextResponse } from "next/server";
import { fetchKensaResultsByReceptIds, saveKensaResults } from "@/lib/dbActions";

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

export async function POST(request: Request) {
  try {
    const results = await request.json();
    
    if (!Array.isArray(results)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    await saveKensaResults(results);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Kensa Results POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
