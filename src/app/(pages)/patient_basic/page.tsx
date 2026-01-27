import BasicInfoForm from "../../component/BasicInfoForm";
import AppHeader from "../../component/AppHeader";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <AppHeader />
      <main className="flex-1 w-full py-12">
        <BasicInfoForm />
      </main>
    </div>
  );
}
