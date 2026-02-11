import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constant";

export default function HomePage() {
  // Redirect to login page - actual routing will be handled by middleware
  redirect(ROUTES.AUTH.LOGIN);
}
