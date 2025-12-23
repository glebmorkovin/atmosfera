import { redirect } from "next/navigation";

export default function ParentIndexRedirect() {
  redirect("/app/parent/dashboard");
}
