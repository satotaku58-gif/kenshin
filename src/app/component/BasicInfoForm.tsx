"use client";
import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function BasicInfoForm() {
  const [form, setForm] = useState({
    name: "",
    nameKana: "",
    birth: "",
    gender: "",
    zip: "",
    address: "",
    tel: "",
    email: "",
    insurerNumber: "",
    insuredSymbol: "",
    insuredNumber: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // patient_basicテーブルのカラム名に合わせてデータをマッピング
    // 性別をsmallint型に変換（male:1, female:2, other:9）
    let sexValue = null;
    if (form.gender === "male") sexValue = 1;
    else if (form.gender === "female") sexValue = 2;
    else if (form.gender === "other") sexValue = 9;

    const insertData = {
      name: form.name,
      name_kana: form.nameKana,
      birthdate: form.birth,
      sex: sexValue,
      postcode: form.zip,
      address: form.address,
      Insurer_number: form.insurerNumber,
      Insurance_cardcode: form.insuredSymbol,
      Insurance_card_number: form.insuredNumber,
      phone: form.tel,
      mailaddress: form.email,
    };
    const { error } = await supabase.from("patient_basic").insert([insertData]);
    if (error) {
      alert("登録に失敗しました: " + error.message);
    } else {
      alert("送信しました");
      setForm({
        name: "",
        nameKana: "",
        birth: "",
        gender: "",
        zip: "",
        address: "",
        tel: "",
        email: "",
        insurerNumber: "",
        insuredSymbol: "",
        insuredNumber: "",
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">患者情報入力</h2>
              <p className="text-sm text-slate-500 font-medium">新規患者の基本情報と保険情報を登録します。</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-cyan-600 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full"></span>
                本人確認情報
              </h3>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">氏名</label>
                <input name="name" value={form.name} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium" required placeholder="山田 太郎" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">氏名（カナ）</label>
                <input name="nameKana" value={form.nameKana} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium" required placeholder="ヤマダ タロウ" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">生年月日</label>
                  <input name="birth" type="date" value={form.birth} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">性別</label>
                  <select name="gender" value={form.gender} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium" required>
                    <option value="">選択してください</option>
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="other">その他</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-bold text-cyan-600 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full"></span>
                連絡先・保険情報
              </h3>

              <div className="flex gap-4">
                <div className="w-32">
                  <label className="block text-sm font-bold text-slate-700 mb-2">郵便番号</label>
                  <input name="zip" value={form.zip} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium" required placeholder="123-4567" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">住所</label>
                  <input name="address" value={form.address} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium" required placeholder="東京都..." />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">電話番号</label>
                <input name="tel" value={form.tel} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium" required placeholder="090-0000-0000" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">保険者番号</label>
                  <input name="insurerNumber" value={form.insurerNumber} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium" required placeholder="123456" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">記号</label>
                    <input name="insuredSymbol" value={form.insuredSymbol} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium" required placeholder="記号" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">番号</label>
                    <input name="insuredNumber" value={form.insuredNumber} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium" required placeholder="12345" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:bg-cyan-600 hover:shadow-cyan-100 transition-all active:scale-95 flex items-center gap-2 group"
            >
              <span>データを登録する</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
