import { NextResponse } from "next/server";
import { supabase } from "@/app/supabaseClient";

export const runtime = "edge";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("patient_basic")
      .select("id, name, birthdate, sex")
      .order("id", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Patients Fetch Error:", error);
    return NextResponse.json(
      { error: error.message || "取得に失敗しました" },
      { status: 500 }
    );
  }
}
