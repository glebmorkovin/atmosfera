import { redirect } from "next/navigation";

export default function ClubIndexRedirect() {
  redirect("/app/club/dashboard");
}
