"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";

export default function BasicInfoForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
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
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    const newErrors: { [key: string]: string } = {};
    if (!form.name) newErrors.name = "氏名を入力してください";
    if (!form.nameKana) newErrors.nameKana = "氏名（カナ）を入力してください";
    if (!form.birth) newErrors.birth = "生年月日を選択してください";
    if (!form.gender) newErrors.gender = "性別を選択してください";
    if (!form.zip) newErrors.zip = "郵便番号を入力してください";
    if (!form.address) newErrors.address = "住所を入力してください";
    if (!form.tel) newErrors.tel = "電話番号を入力してください";
    if (!form.insurerNumber) newErrors.insurerNumber = "保険者番号を入力してください";
    if (!form.insuredSymbol) newErrors.insuredSymbol = "記号を入力してください";
    if (!form.insuredNumber) newErrors.insuredNumber = "番号を入力してください";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
    const { data, error } = await supabase.from("patient_basic").insert([insertData]).select();
    if (error) {
      alert("登録に失敗しました: " + error.message);
    } else {
      alert("送信しました。検査受付画面へ遷移します。");
      const patientId = data[0]?.id;
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
      // 受付画面へ遷移
      router.push(`/reception?patientId=${patientId}`);
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
              
              <div className="relative">
                <label className="block text-sm font-bold text-slate-700 mb-2">氏名</label>
                <input 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  className={`w-full border ${errors.name ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium`} 
                  placeholder="山田 太郎" 
                />
                {errors.name && (
                  <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-bold text-slate-700 mb-2">氏名（カナ）</label>
                <input 
                  name="nameKana" 
                  value={form.nameKana} 
                  onChange={handleChange} 
                  className={`w-full border ${errors.nameKana ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium`} 
                  placeholder="ヤマダ タロウ" 
                />
                {errors.nameKana && (
                  <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.nameKana}
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-bold text-slate-700 mb-2">生年月日</label>
                  <input 
                    name="birth" 
                    type="date" 
                    value={form.birth} 
                    onChange={handleChange} 
                    className={`w-full border ${errors.birth ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl px-4 py-2 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium`} 
                  />
                  {errors.birth && (
                    <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.birth}
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-bold text-slate-700 mb-2">性別</label>
                  <select 
                    name="gender" 
                    value={form.gender} 
                    onChange={handleChange} 
                    className={`w-full border ${errors.gender ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium`} 
                  >
                    <option value="">選択してください</option>
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="other">その他</option>
                  </select>
                  {errors.gender && (
                    <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.gender}
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-bold text-cyan-600 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full"></span>
                連絡先・保険情報
              </h3>

              <div className="flex gap-4">
                <div className="w-32 relative">
                  <label className="block text-sm font-bold text-slate-700 mb-2">郵便番号</label>
                  <input 
                    name="zip" 
                    value={form.zip} 
                    onChange={handleChange} 
                    className={`w-full border ${errors.zip ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium`} 
                    placeholder="123-4567" 
                  />
                  {errors.zip && (
                    <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.zip}
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 relative">
                  <label className="block text-sm font-bold text-slate-700 mb-2">住所</label>
                  <input 
                    name="address" 
                    value={form.address} 
                    onChange={handleChange} 
                    className={`w-full border ${errors.address ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium`} 
                    placeholder="東京都..." 
                  />
                  {errors.address && (
                    <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.address}
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-bold text-slate-700 mb-2">電話番号</label>
                <input 
                  name="tel" 
                  value={form.tel} 
                  onChange={handleChange} 
                  className={`w-full border ${errors.tel ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium`} 
                  placeholder="090-0000-0000" 
                />
                {errors.tel && (
                  <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.tel}
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-bold text-slate-700 mb-2">保険者番号</label>
                  <input 
                    name="insurerNumber" 
                    value={form.insurerNumber} 
                    onChange={handleChange} 
                    className={`w-full border ${errors.insurerNumber ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium`} 
                    placeholder="123456" 
                  />
                  {errors.insurerNumber && (
                    <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.insurerNumber}
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <label className="block text-sm font-bold text-slate-700 mb-2">記号</label>
                    <input 
                      name="insuredSymbol" 
                      value={form.insuredSymbol} 
                      onChange={handleChange} 
                      className={`w-full border ${errors.insuredSymbol ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium`} 
                      placeholder="記号" 
                    />
                    {errors.insuredSymbol && (
                      <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.insuredSymbol}
                        <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-bold text-slate-700 mb-2">番号</label>
                    <input 
                      name="insuredNumber" 
                      value={form.insuredNumber} 
                      onChange={handleChange} 
                      className={`w-full border ${errors.insuredNumber ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none bg-slate-50/30 font-medium`} 
                      placeholder="12345" 
                    />
                    {errors.insuredNumber && (
                      <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.insuredNumber}
                        <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
                      </div>
                    )}
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
