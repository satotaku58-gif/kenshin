"use client";

import AppHeader from "../../component/AppHeader";
import { useState } from "react";

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

  const handleChange = (idx: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[idx] = value;
    setAnswers(newAnswers);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <AppHeader />
      <main className="flex-1 w-full py-8 px-4">
        <div className="max-w-4xl w-full mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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
        </div>
      </main>
    </div>
  );
}
