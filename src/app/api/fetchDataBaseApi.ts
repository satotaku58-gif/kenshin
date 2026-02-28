import { supabase } from "../supabaseClient";

/**
 * 患者IDから患者基本情報を取得する
 */
export const fetchPatientBasic = async (patientId: string) => {
  const { data, error } = await supabase
    .from("patient_basic")
    .select("id, name, birthdate, sex")
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
