import { redirect } from "next/navigation";

export default function ReceiveInkPage() {
  redirect("/inventory/received/new");
}
