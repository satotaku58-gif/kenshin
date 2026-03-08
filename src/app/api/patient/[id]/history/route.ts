import { NextResponse } from "next/server";
import { fetchPatientReceptionHistory } from "@/lib/dbActions";

export const runtime = "edge";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id: patientId } = params;
    const { searchParams } = new URL(request.url);
    const baseDate = searchParams.get("baseDate") || new Date().toISOString().split("T")[0];
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 4;

    if (!patientId) {
      return NextResponse.json({ error: "patientId is required" }, { status: 400 });
    }

    const data = await fetchPatientReceptionHistory(patientId, baseDate, limit);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "内部サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
