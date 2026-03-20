import { NextResponse } from "next/server";
import { saveMonsinResults } from "@/lib/dbActions";

export async function POST(request: Request) {
  try {
    const results = await request.json();
    
    if (!Array.isArray(results)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    await saveMonsinResults(results);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Monsin Results Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
