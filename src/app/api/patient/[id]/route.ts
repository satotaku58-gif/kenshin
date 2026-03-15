import { NextResponse } from "next/server";
import { fetchPatientBasic } from "@/lib/dbActions";

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

// 既存の取得（GET）の後に以下を追加
import { supabase } from "@/app/supabaseClient";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    const patientData = await request.json();

    const { data, error } = await supabase
      .from("patient_basic")
      .update(patientData)
      .eq("id", id)
      .select();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Patient Update Error:", error);
    return NextResponse.json(
      { error: error.message || "更新に失敗しました" },
      { status: 500 }
    );
  }
}

