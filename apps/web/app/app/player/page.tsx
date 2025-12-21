import { redirect } from "next/navigation";

export default function PlayerIndexRedirect() {
  redirect("/app/player/dashboard");
}
