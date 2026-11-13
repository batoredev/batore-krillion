import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default function NewEndless() {
  redirect(`/play/endless/${Math.floor(Math.random() * 999_999) + 1}`);
}
