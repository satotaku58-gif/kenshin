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
export const validateReception = async (patientId: string, receptionDate: string, receptionId: string) => {
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
