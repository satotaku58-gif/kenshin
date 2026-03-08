import { NextResponse } from "next/server";
import { fetchKensaItemData } from "@/lib/dbActions";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemIdsStr = searchParams.get("itemIds");
    const itemIds = itemIdsStr ? itemIdsStr.split(",").map(Number) : undefined;

    const data = await fetchKensaItemData(itemIds);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "内部サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
