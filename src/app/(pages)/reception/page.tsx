"use client";
import AppHeader from "../../component/AppHeader";
import PatientSearchDialog from "../../component/PatientSearchDialog";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../supabaseClient";

export default function ReceptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 性別コードを日本語に変換
  function getGenderLabel(gender: string | number | undefined): string {
    if (gender === '1' || gender === 1) return '男性';
    if (gender === '2' || gender === 2) return '女性';
    if (gender === '9' || gender === 9) return 'その他';
    return '-';
  }
    // 年齢計算関数
    function calcAge(birthdate: string): number | null {
      if (!birthdate) return null;
      const today = new Date();
      const birth = new Date(birthdate);
      if (isNaN(birth.getTime())) return null;
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    }
  const [patientId, setPatientId] = useState("");
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [searchError, setSearchError] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [courseList, setCourseList] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [receptDate, setReceptDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const pId = searchParams.get("patientId");
    if (pId) {
      setPatientId(pId);
      // 自動的に患者情報を取得する処理を呼び出す
      fetchPatientInfo(pId);
    }
  }, [searchParams]);

  const fetchPatientInfo = async (id: string) => {
    if (!id) return;
    const { data, error } = await supabase
      .from("patient_basic")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) {
      setSearchError("該当する患者が見つかりません");
      setPatientInfo(null);
    } else {
      setPatientInfo(data);
    }
  };

  useEffect(() => {
    // 検査コース一覧をSupabaseから取得
    const fetchCourses = async () => {
      const { data, error } = await supabase.from("kensa_course").select("id, name");
      if (error) {
        console.error("kensa_course取得エラー:", error.message, error.details);
        setCourseList([]);
      } else if (data) {
        setCourseList(data);
      } else {
        setCourseList([]);
      }
    };
    fetchCourses();
  }, []);

  const handleBlur = async () => {
    setPatientInfo(null);
    setSearchError("");
    if (!patientId) return;
    const { data, error } = await supabase
      .from("patient_basic")
      .select("*")
      .eq("id", patientId)
      .single();
    if (error || !data) {
      setSearchError("該当する患者が見つかりません");
      setPatientInfo(null);
    } else {
      setPatientInfo(data);
    }
  };

  const handleReception = async () => {
    setErrors({});
    const newErrors: { [key: string]: string } = {};
    if (!patientId) newErrors.patientId = "IDを入力してください";
    if (!receptDate) newErrors.receptDate = "受診日を選択してください";
    if (!selectedCourse) newErrors.selectedCourse = "コースを選択してください";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }


    // 受診日が一致するreceptのrecept_id最大値を取得
    const { data: maxIdData, error: maxIdError } = await supabase
      .from("recept")
      .select("recept_id")
      .eq("recept_date", receptDate)
      .order("recept_id", { ascending: false })
      .limit(1);

    if (maxIdError) {
      alert("受付IDの取得に失敗しました: " + maxIdError.message);
      return;
    }

    let newReceptId = 1;
    if (maxIdData && maxIdData.length > 0 && maxIdData[0].recept_id != null) {
      newReceptId = Number(maxIdData[0].recept_id) + 1;
    }

    const { data, error } = await supabase.from("recept").insert([
      {
        recept_id: newReceptId,
        patient_id: patientId,
        recept_date: receptDate,
        course: selectedCourse
      }
    ]).select();

    if (error) {
      console.error("受付登録エラー:", error);
      alert("受付登録に失敗しました: " + error.message);
    } else {
      alert("受付を完了しました。問診入力画面へ遷移します。");
      const receptId = newReceptId;
      // 登録後に状態をリセット
      setPatientId("");
      setPatientInfo(null);
      setSelectedCourse("");
      // 問診入力画面へ遷移
      router.push(`/questionnaire?patientId=${patientId}&receptId=${receptId}&receptDate=${receptDate}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <AppHeader />
      <main className="flex-1 w-full py-8 px-4">
        <div className="max-w-4xl w-full mx-auto">
          <PatientSearchDialog
            isOpen={showDialog}
            onClose={() => setShowDialog(false)}
            onSelect={(p) => {
              setPatientInfo(p);
              setPatientId(p.id.toString());
              setShowDialog(false);
            }}
            themeColor="blue"
          />

          {showDialog ? null : (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">検査受付入力</h2>
                    <p className="text-sm text-slate-500">受診される方のIDを入力または検索して、コースを選択してください。</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex-1 w-full relative">
                    <label className="block text-sm font-bold text-slate-600 mb-2">患者ID検索</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="IDを入力"
                        className={`w-full pl-10 pr-4 py-3 bg-white border ${errors.patientId ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-slate-700`}
                        value={patientId}
                        onChange={e => {
                          setPatientId(e.target.value.replace(/[^0-9]/g, ""));
                          if (errors.patientId) setErrors(prev => ({ ...prev, patientId: "" }));
                        }}
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                    </div>
                    {errors.patientId && (
                      <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.patientId}
                        <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                      onClick={handleBlur}
                    >
                      IDで確定
                    </button>
                    <button
                      type="button"
                      className="flex-1 sm:flex-none border border-slate-200 bg-white text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95"
                      onClick={() => setShowDialog(true)}
                    >
                      一覧から検索
                    </button>
                  </div>
                </div>

                {searchError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
                    <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {searchError}
                  </div>
                )}
              </div>

              {patientInfo && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom duration-500">
                  <div className="p-6 border-b border-slate-100 bg-blue-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                      受診者詳細・コース選択
                    </h3>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <span className="text-sm font-bold text-slate-500">お名前</span>
                          <span className="text-lg font-bold text-slate-800">{patientInfo.name} 様</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <span className="text-sm font-bold text-slate-500">生年月日 / 年齢</span>
                          <span className="font-bold text-slate-800">
                            {patientInfo.birthdate} ({calcAge(patientInfo.birthdate)}歳)
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <span className="text-sm font-bold text-slate-500">性別</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            patientInfo.sex === 1 ? "bg-blue-100 text-blue-700" : patientInfo.sex === 2 ? "bg-pink-100 text-pink-700" : "bg-slate-100 text-slate-700"
                          }`}>
                            {getGenderLabel(patientInfo.sex)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="relative">
                          <label className="block text-sm font-bold text-slate-700 mb-2">受診日</label>
                          <input 
                            type="date" 
                            value={receptDate}
                            onChange={e => {
                              setReceptDate(e.target.value);
                              if (errors.receptDate) setErrors(prev => ({ ...prev, receptDate: "" }));
                            }}
                            className={`w-full border ${errors.receptDate ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 font-bold`} 
                          />
                          {errors.receptDate && (
                            <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {errors.receptDate}
                              <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-bold text-slate-700 mb-2">検査コース</label>
                          <select
                            className={`w-full border ${errors.selectedCourse ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 font-bold`}
                            value={selectedCourse}
                            onChange={e => {
                              setSelectedCourse(e.target.value);
                              if (errors.selectedCourse) setErrors(prev => ({ ...prev, selectedCourse: "" }));
                            }}
                          >
                            <option value="">コースを選択してください</option>
                            {courseList.map((course: any) => (
                              <option key={course.id} value={course.id}>
                                {course.name}
                              </option>
                            ))}
                          </select>
                          {errors.selectedCourse && (
                            <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {errors.selectedCourse}
                              <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleReception}
                        className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:bg-blue-600 hover:shadow-blue-100 transition-all active:scale-95 flex items-center gap-2 group"
                      >
                        <svg className="w-5 h-5 text-blue-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>この内容で受付を行う</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
