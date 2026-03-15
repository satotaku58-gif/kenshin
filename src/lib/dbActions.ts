"use server";

import { supabase } from "../app/supabaseClient";

/**
 * 患者IDから患者基本情報を取得する
 */
export const fetchPatientBasic = async (patientId: string) => {
  const { data, error } = await supabase
    .from("patient_basic")
    .select("*")
    .eq("id", patientId)
    .single();

  if (error || !data) {
    throw new Error("登録されていない患者IDです");
  }

  return data;
};

/**
 * 受付情報を検証し、内部ID（pk）とコース等を取得する
 */
export const fetchReception = async (patientId: string, receptionDate: string, receptionId: string) => {
  const { data, error } = await supabase
    .from("recept")
    .select("id, recept_id, course")
    .eq("recept_id", receptionId)
    .eq("patient_id", patientId)
    .eq("recept_date", receptionDate)
    .single();

  if (error || !data) {
    throw new Error("該当する受付データが見つかりません");
  }

  return data;
};

/**
 * 問診の設問と選択肢を取得する
 */
export const fetchMonsinMaster = async () => {
  const [qResult, aResult] = await Promise.all([
    supabase
      .from("monsin_question_content")
      .select("id, content, answer_type")
      .order("id", { ascending: true }),
    supabase
      .from("monsin_answer_content")
      .select("type, content, answer_id")
      .order("answer_id", { ascending: true })
  ]);

  if (qResult.error || aResult.error) {
    throw new Error("問診マスターの取得に失敗しました");
  }

  return {
    questions: qResult.data,
    answers: aResult.data
  };
};

/**
 * コースIDに紐づく検査項目IDの一覧を取得する
 */
export const fetchCourseItemIds = async (courseId: number) => {
  const { data, error } = await supabase
    .from("kensa_course_items")
    .select("item_id")
    .eq("course_id", courseId);

  if (error || !data) {
    throw new Error("コース項目の取得に失敗しました");
  }

  return data.map(ci => ci.item_id);
};

/**
 * 患者の受診履歴を上限件数分取得する
 */
export const fetchPatientReceptionHistory = async (patientId: string, baseDate: string, limit: number = 4) => {
  const { data, error } = await supabase
    .from("recept")
    .select("id, recept_id, recept_date")
    .eq("patient_id", patientId)
    .lte("recept_date", baseDate)
    .order("recept_date", { ascending: false })
    .limit(limit);

  if (error || !data) {
    throw new Error("受診履歴の取得に失敗しました");
  }

  return data;
};

/**
 * 検査項目マスターと関連情報を取得する
 * itemIds が指定されない場合は全項目を取得する
 */
export const fetchKensaItemData = async (itemIds?: number[]) => {
  let query = supabase
    .from("kensa_item_master")
    .select(`
      *,
      category_info:kensa_category_master (
        id,
        name
      ),
      valuetype_info:kensa_valuetype_master (
        id,
        name,
        selectable,
        kensa_select_item_master (
          id,
          text
        )
      )
    `);

  if (itemIds && itemIds.length > 0) {
    query = query.in("id", itemIds);
  }

  const { data, error } = await query
    .order("category_id", { ascending: true })
    .order("id", { ascending: true });

  if (error || !data) {
    throw new Error("マスター情報を読み取れませんでした");
  }

  return data;
};

/**
 * 検査基準値セットマスターを取得する
 */
export const fetchKensaReferenceSetMaster = async () => {
  const { data, error } = await supabase
    .from("kensa_reference_set_master")
    .select("id, name")
    .order("id", { ascending: true });

  if (error || !data) {
    throw new Error("基準値セットマスターを読み取れませんでした");
  }

  return data;
};

/**
 * 指定された受付IDリストの検査結果を取得する
 */
export const fetchKensaResultsByReceptIds = async (receptIds: (number | string)[]) => {
  const { data, error } = await supabase
    .from("kensa_result")
    .select("recept_id, kensa_item, answer")
    .in("recept_id", receptIds);

  if (error) {
    console.error("Results fetch error:", error);
    throw new Error("検査結果の取得に失敗しました");
  }

  return data;
};

/**
 * 基準値セットIDに関連する全項目ごとの基準値範囲を取得する
 */
export const fetchKensaReferenceRanges = async (setId: number) => {
  const { data, error } = await supabase
    .from("kensa_reference_range_master")
    .select("item_id, low_value, high_value")
    .eq("set_id", setId);

  if (error || !data) {
    throw new Error("基準値範囲マスターを読み取れませんでした");
  }

  return data;
};

/**
 * 検査結果を保存（upsert）する
 */
export const saveKensaResults = async (results: { recept_id: number; kensa_item: number; answer: number }[]) => {
  const { error } = await supabase
    .from("kensa_result")
    .upsert(results, { onConflict: "recept_id,kensa_item" });

  if (error) {
    console.error("Save error:", error);
    throw new Error("検査結果の保存に失敗しました");
  }

  return { success: true };
};

/**
 * 問診回答を保存する
 */
export const saveMonsinResults = async (results: { recept_id: number; question: number; answer: number }[]) => {
  const { error } = await supabase
    .from("monsin_answer_result")
    .insert(results);

  if (error) {
    console.error("Monsin save error:", error);
    throw new Error("問診回答の保存に失敗しました");
  }

  return { success: true };
};

/**
 * 検査コース一覧を取得する
 */
export const fetchKensaCourses = async () => {
  const { data, error } = await supabase
    .from("kensa_course")
    .select("id, name")
    .order("id", { ascending: true });

  if (error) {
    console.error("kensa_course fetch error:", error);
    throw new Error("検査コース一覧の取得に失敗しました");
  }

  return data;
};

/**
 * 新規受付を登録する
 * 受付日の最大IDを取得してインクリメントした新IDを割り当てる
 */
export const createReception = async (patientId: string, receptDate: string, courseId: string) => {
  // 受付日が一致するreceptのrecept_id最大値を取得
  const { data: maxIdData, error: maxIdError } = await supabase
    .from("recept")
    .select("recept_id")
    .eq("recept_date", receptDate)
    .order("recept_id", { ascending: false })
    .limit(1);

  if (maxIdError) {
    throw new Error("受付IDの取得に失敗しました: " + maxIdError.message);
  }

  let newReceptId = 1;
  if (maxIdData && maxIdData.length > 0 && maxIdData[0].recept_id != null) {
    newReceptId = Number(maxIdData[0].recept_id) + 1;
  }

  const { data, error } = await supabase
    .from("recept")
    .insert([
      {
        recept_id: newReceptId,
        patient_id: patientId,
        recept_date: receptDate,
        course: courseId
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("受付登録エラー:", error);
    throw new Error("受付登録に失敗しました: " + error.message);
  }

  return { ...data, recept_id: newReceptId };
};
