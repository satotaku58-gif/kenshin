import { NextResponse } from "next/server";
import { fetchPatientBasic } from "@/app/api/fetchDataBaseApi";

export const runtime = "edge";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: "患者IDが指定されていません" },
        { status: 400 }
      );
    }

    const data = await fetchPatientBasic(id);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "内部サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
