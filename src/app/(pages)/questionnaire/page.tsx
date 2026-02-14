"use client";

import AppHeader from "../../component/AppHeader";
import PatientSearchDialog from "../../component/PatientSearchDialog";
import ReceptSearchDialog from "../../component/ReceptSearchDialog";
import ReceptStartForm from "../../component/ReceptStartForm";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../supabaseClient";
import { useQuestionnaire } from "../../context/QuestionnaireContext";

function QuestionnaireContent() {
  const searchParams = useSearchParams();
  const {
    patientId, setPatientId,
    patientName, setPatientName,
    receptionDate, setReceptionDate,
    receptionId, setReceptionId,
    receptInternalId, setReceptInternalId,
    answers, setAnswers,
    showForm, setShowForm,
    resetState, isLoaded
  } = useQuestionnaire();
  
  const [questions, setQuestions] = useState<{ id: number; label: string; options: { id: number; content: string }[] }[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formErrors, setFormErrors] = useState<{ [key: number]: boolean }>({});
  const [showDialog, setShowDialog] = useState(false);
  const [showReceptDialog, setShowReceptDialog] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    const pId = searchParams.get("patientId");
    const rId = searchParams.get("receptId");
    const rDate = searchParams.get("receptDate");
    if (pId) setPatientId(pId);
    if (rId) setReceptionId(rId);
    if (rDate) setReceptionDate(rDate);
  }, [searchParams, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    const fetchQuestionsAndAnswers = async () => {
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

      if (!qResult.error && qResult.data && !aResult.error && aResult.data) {
        // 回答タイプごとに選択肢をグループ化
        const optionsMap: { [key: number]: { id: number; content: string }[] } = {};
        aResult.data.forEach((a) => {
          if (!optionsMap[a.type]) {
            optionsMap[a.type] = [];
          }
          optionsMap[a.type].push({ id: a.answer_id, content: a.content });
        });

        const mappedQuestions = qResult.data.map((q) => ({
          id: q.id,
          label: q.content,
          options: optionsMap[q.answer_type] || [],
        }));

        setQuestions(mappedQuestions);
        // 既存の回答がない場合、または設問数に変更があった場合のみ初期化
        setAnswers(prev => {
          if (prev.length !== mappedQuestions.length) {
            return new Array(mappedQuestions.length).fill("");
          }
          return prev;
        });
      }
    };
    fetchQuestionsAndAnswers();
  }, [isLoaded]);

  const handleReceptSearch = async () => {
    if (!patientId) {
      setErrors((prev) => ({ ...prev, patientId: "先に患者IDを入力してください" }));
      return;
    }

    setShowReceptDialog(true);
  };

  const handleStart = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!patientId) newErrors.patientId = "患者IDを入力してください";
    if (!receptionDate) newErrors.receptionDate = "受診日を選択してください";
    if (!receptionId) newErrors.receptionId = "受付IDを入力してください";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShowForm(false);
      return;
    }

    // 問診開始時に回答内容と内部IDをリセット
    setAnswers(new Array(questions.length).fill(""));
    setReceptInternalId(null);
    setFormErrors({});
    setSubmitError("");

    // 患者存在チェック
    const { data: patientData, error: patientError } = await supabase
      .from("patient_basic")
      .select("id, name")
      .eq("id", patientId)
      .single();

    if (patientError || !patientData) {
      setErrors({ patientId: "登録されていない患者IDです" });
      setShowForm(false);
      return;
    }

    setPatientName(patientData.name);

    // 受付存在チェック (患者ID、受診日、受付IDの整合性)
    const { data: receptData, error: receptError } = await supabase
      .from("recept")
      .select("id, recept_id")
      .eq("recept_id", receptionId)
      .eq("patient_id", patientId)
      .eq("recept_date", receptionDate)
      .single();

    if (receptError || !receptData) {
      setErrors({ receptionId: "指定の患者IDに対する受付データが見つかりません" });
      setShowForm(false);
      return;
    }

    setReceptInternalId(receptData.id);
    setErrors({});
    setShowForm(true);
  };

  const handleChange = (idx: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[idx] = value;
    setAnswers(newAnswers);
    if (value !== "") {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    // 全体のエラーリセット
    setSubmitError("");
    
    // 未回答チェック
    const newFormErrors: { [key: number]: boolean } = {};
    answers.forEach((a, idx) => {
      if (a === "") {
        newFormErrors[idx] = true;
      }
    });

    if (Object.keys(newFormErrors).length > 0) {
      setFormErrors(newFormErrors);
      setSubmitError("未回答の項目があります。すべての質問に回答してから完了してください。");
      return;
    }

    if (!receptInternalId) {
      setSubmitError("受付データが正しく読み込まれていません。問診を最初からやり直してください。");
      return;
    }

    // データの整形
    const results = questions.map((q, idx) => ({
      recept_id: receptInternalId,
      question: q.id,
      answer: parseInt(answers[idx])
    }));

    const { error } = await supabase
      .from("monsin_answer_result")
      .insert(results);

    if (error) {
      console.error("Error saving answers:", error);
      setSubmitError("回答の保存中にエラーが発生しました。");
    } else {
      alert("回答を保存しました。");
      // 入力フォームを閉じる、またはリセット
      setShowForm(false);
      setAnswers(new Array(questions.length).fill(""));
      setFormErrors({});
      setSubmitError("");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <div className="print:hidden">
        <AppHeader />
        <main className="flex-1 w-full py-8 px-4">
          <div className="max-w-4xl w-full mx-auto space-y-6">
          <PatientSearchDialog
            isOpen={showDialog}
            onClose={() => setShowDialog(false)}
            onSelect={(p) => {
              setPatientId(p.id.toString());
              setPatientName(p.name);
              if (errors.patientId) setErrors((prev) => ({ ...prev, patientId: "" }));
              setShowDialog(false);
            }}
            themeColor="emerald"
          />

          <ReceptSearchDialog
            isOpen={showReceptDialog}
            onClose={() => setShowReceptDialog(false)}
            onSelect={(r) => {
              setReceptionId(r.recept_id.toString());
              setReceptionDate(r.recept_date);
              if (errors.receptionId) setErrors((prev) => ({ ...prev, receptionId: "" }));
              if (errors.receptionDate) setErrors((prev) => ({ ...prev, receptionDate: "" }));
              setShowReceptDialog(false);
            }}
            patientId={patientId}
          />

          {/* 検索・開始セクション */}
          <ReceptStartForm
            title="問診開始"
            description="患者IDと受付IDを入力して、問診を開始してください。"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            onSubmit={handleStart}
            submitLabel="問診入力を開始する"
            themeColor="emerald"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
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
                <label className="block text-sm font-bold text-slate-600 mb-2">受診日</label>
                <input
                  type="date"
                  className={`w-full px-4 py-3 bg-slate-50/50 border ${errors.receptionDate ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-bold text-slate-700`}
                  value={receptionDate}
                  onChange={e => {
                    setReceptionDate(e.target.value);
                    if (errors.receptionDate) setErrors(prev => ({ ...prev, receptionDate: "" }));
                  }}
                />
                {errors.receptionDate && (
                  <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.receptionDate}
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
          </ReceptStartForm>

          {showForm ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 border-b border-slate-100 bg-emerald-50/30">
                <div className="flex items-center justify-between gap-4">
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
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm font-bold group"
                  >
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>問診票を印刷する</span>
                  </button>
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
                      <div className="w-full sm:w-64 shrink-0 relative">
                        <select
                          className={`w-full border ${formErrors[idx] ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-bold text-slate-700 appearance-none`}
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                          value={answers[idx]}
                          onChange={e => handleChange(idx, e.target.value)}
                        >
                          <option value="">選択してください</option>
                          {q.options.map((opt, oidx) => (
                            <option key={oidx} value={opt.id.toString()}>{opt.content}</option>
                          ))}
                        </select>
                        {formErrors[idx] && (
                          <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            回答を選択してください
                            <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </form>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col items-end gap-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:bg-emerald-600 hover:shadow-emerald-100 transition-all active:scale-95 flex items-center gap-2 group"
                >
                  <span>回答を完了する</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </button>
                {submitError && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold text-sm">{submitError}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">患者IDと受付IDを入力して「問診入力を開始する」をクリックしてください。</p>
            </div>
          )}
        </div>
      </main>
    </div>

    {/* 印刷用レイアウト (A4) */}
      <div className="hidden print:block p-8 bg-white text-slate-900 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold border-b-2 border-slate-900 pb-1 inline-block px-8">問診票</h1>
          </div>
          
          <div className="flex justify-between items-center mb-6 p-4 border border-slate-300 rounded-xl bg-slate-50/30 text-sm">
            <div className="flex gap-8">
              <div className="flex items-baseline gap-2">
                <span className="text-slate-500 font-bold tracking-tighter">患者ID:</span>
                <span className="font-mono font-bold text-lg">{patientId}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-slate-500 font-bold tracking-tighter">氏名:</span>
                <span className="font-bold text-lg">{patientName} <small className="text-slate-400 font-normal ml-1">様</small></span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-slate-500 font-bold tracking-tighter">受診日:</span>
              <span className="font-bold text-lg">{receptionDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-y-1">
            {questions.map((q, idx) => (
              <div key={idx} className="py-2 border-b border-slate-100 flex gap-3 break-inside-avoid">
                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-bold text-slate-800 mb-1 leading-snug">
                    {q.label.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    {q.options.map((opt, oidx) => (
                      <div key={oidx} className="flex items-center gap-1.5">
                        <div className={`w-4 h-4 border rounded flex items-center justify-center  'border-slate-300'}`}>
                          {answers[idx] === opt.id.toString() && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-[13px] 'text-slate-600'}`}>{opt.content}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-right text-slate-400 text-[10px]">
            印刷日時: {new Date().toLocaleString('ja-JP')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuestionnairePage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <QuestionnaireContent />
    </Suspense>
  );
}
