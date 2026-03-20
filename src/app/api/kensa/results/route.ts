import { NextResponse } from "next/server";
import { fetchKensaResultsByReceptIds, saveKensaResults } from "@/lib/dbActions";

export const runtime = "edge";

export async function GET(request: Request) {
/* ... existing code ... */
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
