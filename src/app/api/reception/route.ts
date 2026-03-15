import { NextRequest, NextResponse } from "next/server";
import { createReception } from "@/lib/dbActions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, receptDate, courseId } = body;

    if (!patientId || !receptDate || !courseId) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    const newReception = await createReception(patientId, receptDate, courseId);

    return NextResponse.json(newReception, { status: 201 });
  } catch (error: any) {
    console.error("API Reception Error:", error);
    return NextResponse.json(
      { error: error.message || "受付登録に失敗しました" },
      { status: 500 }
    );
  }
}
