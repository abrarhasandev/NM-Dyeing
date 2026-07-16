// @ts-nocheck
import { redirect } from "next/navigation";

/**
 * /dashboard has no content of its own — send users to the main order list.
 * Avoids RSC 404s when the UI navigates to bare /dashboard.
 */
export default function DashboardIndexPage() {
  redirect("/dashboard/order");
}
