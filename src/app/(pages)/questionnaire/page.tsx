"use client";

import AppHeader from "../../component/AppHeader";
import PatientSearchDialog from "../../component/PatientSearchDialog";
import ReceptSearchDialog from "../../component/ReceptSearchDialog";
import { useState } from "react";
import { supabase } from "../../supabaseClient";

export default function QuestionnairePage() {
  // 問診項目データ
  const questions = [
    { label: "a: 血圧を下げる薬の使用の有無", options: ["", "はい", "いいえ"] },
    { label: "b: インスリン注射又は血糖を下げる薬の使用の有無", options: ["", "はい", "いいえ"] },
    { label: "c: コレステロールを下げる薬の使用の有無", options: ["", "はい", "いいえ"] },
    { label: "医師から、脳卒中(脳出血、脳梗塞等)にかかっているといわれたり、治療を受けたことがありますか。", options: ["", "はい", "いいえ"] },
    { label: "医師から、心臓病(狭心症、心筋梗塞等)にかかっているといわれたり、治療を受けたことがありますか。", options: ["", "はい", "いいえ"] },
    { label: "医師から、慢性の腎不全にかかっているといわれたり、治療(人口透析)を受けたことがありますか。", options: ["", "はい", "いいえ"] },
    { label: "医師から、貧血といわれたことがある。", options: ["", "はい", "いいえ"] },
    { label: "現在、たばこ習慣的に吸っている。", options: ["", "はい", "いいえ"] },
    { label: "20歳の時から体重が10kg以上増加している。", options: ["", "はい", "いいえ"] },
    { label: "1回30分以上の軽い汗をかく運動を週2回以上かつ1年以上実施。", options: ["", "はい", "いいえ"] },
    { label: "日常生活において歩行又は同等の身体活動を1日1時間以上実施。", options: ["", "はい", "いいえ"] },
    { label: "ほぼ同年齢の同性と比較して歩く速度が速い。", options: ["", "はい", "いいえ"] },
    { label: "この1年間で体重が3kg以上あった。", options: ["", "はい", "いいえ"] },
    { label: "人と比較して歩く速度が速い。", options: ["", "速い", "ふつう", "遅い"] },
    { label: "就寝前の2時間以内に夕食をとることが週に3回以上ある。", options: ["", "はい", "いいえ"] },
    { label: "夕食後に間食(3食以外の夜食)をとることが週に3回以上ある。", options: ["", "はい", "いいえ"] },
    { label: "朝食を抜くことが週に3回以上ある。", options: ["", "はい", "いいえ"] },
    { label: "お酒(焼酎・清酒・ビール・洋酒など)を飲む頻度。", options: ["", "毎日", "時々", "ほとんど飲まない(飲めない)"] },
    { label: "飲酒日の1日当たりの飲酒量\n清酒1合(180ml)の目安:ビール中瓶1本(約500ml)、焼酎35度(80ml)、ウイスキーダブル1杯(60ml)、ワイン2杯(240ml)", options: ["", "1合未満", "1～2合未満", "2～3合未満", "3合以上"] },
    { label: "睡眠で休養が十分とれている。", options: ["", "はい", "いいえ"] },
    { label: "運動や食生活等の生活習慣を改善してみようとおもいますか", options: ["", "1:改善するつもりはない", "2:改善するつもりである(概ね6か月以内)", "3:近いうち(概ね1か月以内)改善するつもりであり、少しずつ始めている。", "4:既に改善に取り組んでいる(概ね6か月未満)", "5:既に改善に取り組んでいる(6か月以上)"] },
    { label: "生活習慣の改善について保健指導を受ける機会があれば、利用しますか。", options: ["", "はい", "いいえ"] },
  ];

  const [answers, setAnswers] = useState(Array(questions.length).fill(""));
  const [patientId, setPatientId] = useState("");
  const [receptionId, setReceptionId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDialog, setShowDialog] = useState(false);
  const [showReceptDialog, setShowReceptDialog] = useState(false);

  const handleReceptSearch = async () => {
    if (!patientId) {
      setErrors((prev) => ({ ...prev, patientId: "先に患者IDを入力してください" }));
      return;
    }

    const { data, error } = await supabase
      .from("recept")
      .select("id")
      .eq("patient_id", patientId)
      .limit(1);

    if (error || !data || data.length === 0) {
      setErrors((prev) => ({ ...prev, receptionId: "受付データがありません" }));
      return;
    }

    setShowReceptDialog(true);
  };

  const handleStart = () => {
    const newErrors: { [key: string]: string } = {};
    if (!patientId) newErrors.patientId = "患者IDを入力してください";
    if (!receptionId) newErrors.receptionId = "受付IDを入力してください";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShowForm(false);
    } else {
      setErrors({});
      setShowForm(true);
    }
  };

  const handleChange = (idx: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[idx] = value;
    setAnswers(newAnswers);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <AppHeader />
      <main className="flex-1 w-full py-8 px-4">
        <div className="max-w-4xl w-full mx-auto space-y-6">
          <PatientSearchDialog
            isOpen={showDialog}
            onClose={() => setShowDialog(false)}
            onSelect={(p) => {
              setPatientId(p.id.toString());
              if (errors.patientId) setErrors((prev) => ({ ...prev, patientId: "" }));
              setShowDialog(false);
            }}
            themeColor="emerald"
          />

          <ReceptSearchDialog
            isOpen={showReceptDialog}
            onClose={() => setShowReceptDialog(false)}
            onSelect={(r) => {
              setReceptionId(r.id.toString());
              if (errors.receptionId) setErrors((prev) => ({ ...prev, receptionId: "" }));
              setShowReceptDialog(false);
            }}
            patientId={patientId}
          />

          {/* 検索・開始セクション */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">問診開始</h2>
                <p className="text-sm text-slate-500">患者IDと受付IDを入力して、問診を開始してください。</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="relative">
                  <label className="block text-sm font-bold text-slate-600 mb-2">患者ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="例: 1001"
                      className={`flex-1 px-4 py-3 bg-slate-50/50 border ${errors.patientId ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-bold text-slate-700`}
                      value={patientId}
                      onChange={e => {
                        setPatientId(e.target.value);
                        if (errors.patientId) setErrors(prev => ({ ...prev, patientId: "" }));
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDialog(true)}
                      className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center shrink-0 group"
                      title="患者IDを検索"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
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
                <div className="relative">
                  <label className="block text-sm font-bold text-slate-600 mb-2">受付ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="例: 5001"
                      className={`flex-1 px-4 py-3 bg-slate-50/50 border ${errors.receptionId ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-bold text-slate-700`}
                      value={receptionId}
                      onChange={e => {
                        setReceptionId(e.target.value);
                        if (errors.receptionId) setErrors(prev => ({ ...prev, receptionId: "" }));
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleReceptSearch}
                      className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center shrink-0 group"
                      title="受付IDを検索"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                  {errors.receptionId && (
                    <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.receptionId}
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-center border-t border-slate-100 pt-8 mt-2">
                <button
                  onClick={handleStart}
                  className="w-full sm:w-auto px-12 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-3 group"
                >
                  <span className="text-lg">問診入力を開始する</span>
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {showForm && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 border-b border-slate-100 bg-emerald-50/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">問診入力</h2>
                    <p className="text-sm text-slate-500 font-medium">現在の健康状態や生活習慣について回答してください。</p>
                  </div>
                </div>
              </div>

              <div className="p-0">
                <form className="divide-y divide-slate-100">
                  {questions.map((q, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors shrink-0">
                          {idx + 1}
                        </div>
                        <div className="text-[15px] font-bold text-slate-700 leading-relaxed">
                          {q.label.split('\n').map((line, i) => (
                            <div key={i}>{line}</div>
                          ))}
                        </div>
                      </div>
                      <div className="w-full sm:w-64 shrink-0">
                        <select
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-bold text-slate-700 appearance-none"
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                          value={answers[idx]}
                          onChange={e => handleChange(idx, e.target.value)}
                        >
                          <option value="">選択してください</option>
                          {q.options.filter(opt => opt !== "").map((opt, oidx) => (
                            <option key={oidx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </form>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:bg-emerald-600 hover:shadow-emerald-100 transition-all active:scale-95 flex items-center gap-2 group"
                >
                  <span>回答を一時保存する</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
