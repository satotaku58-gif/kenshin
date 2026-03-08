import { NextResponse } from "next/server";
import { fetchReception } from "@/app/api/fetchDataBaseApi";

export const runtime = "edge";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string; date: string; reception_id: string }> }
) {
  try {
    const params = await props.params;
    const { id, date, reception_id } = params;

    if (!id || !date || !reception_id) {
      return NextResponse.json(
        { error: "必要なパラメータが不足しています" },
        { status: 400 }
      );
    }

    const data = await fetchReception(id, date, reception_id);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "内部サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
