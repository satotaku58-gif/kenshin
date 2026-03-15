import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/supabaseClient";

export const runtime = "edge";

// 新規登録 (POST /api/patient)
export async function POST(request: NextRequest) {
  try {
    const patientData = await request.json();
    const { data, error } = await supabase
      .from("patient_basic")
      .insert([patientData])
      .select();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("Patient Create Error:", error);
    return NextResponse.json(
      { error: error.message || "登録に失敗しました" },
      { status: 500 }
    );
  }
}
