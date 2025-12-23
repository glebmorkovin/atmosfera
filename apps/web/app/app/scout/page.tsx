import { redirect } from "next/navigation";

export default function ScoutIndexRedirect() {
  redirect("/app/scout/dashboard");
}
