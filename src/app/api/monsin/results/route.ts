import { NextResponse } from "next/server";
import { saveMonsinResults, fetchMonsinResultsByReceptId } from "@/lib/dbActions";
import { supabase } from "@/app/supabaseClient";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const receptId = searchParams.get("receptId");

    if (!receptId) {
      return NextResponse.json({ error: "receptId is required" }, { status: 400 });
    }

    const results = await fetchMonsinResultsByReceptId(parseInt(receptId));
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("API Monsin Results GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const results = await request.json();
    
    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const { recept_id } = results[0];

    // 既存のデータを削除 (更新に対応するため)
    const { error: deleteError } = await supabase
      .from("monsin_answer_result")
      .delete()
      .eq("recept_id", recept_id);

    if (deleteError) {
      throw new Error("既存データの削除に失敗しました");
    }

    await saveMonsinResults(results);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Monsin Results Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
