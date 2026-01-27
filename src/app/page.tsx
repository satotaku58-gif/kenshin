
import { redirect } from "next/navigation";

export default function RootRedirect() {
	redirect("/patient_basic");
	return null;
}


