// @ts-nocheck
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Server-side gate for every /dashboard/* route.
 * Proxy should already redirect; this prevents any flash or proxy miss.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user as
    | { email?: string | null; role?: string }
    | undefined;

  if (!user?.email) {
    redirect("/login?callbackUrl=/dashboard/order");
  }

  // Operators must be admins. Stay on a non-login path to avoid redirect loops
  // when a session exists without the admin role.
  if (user.role !== "admin") {
    redirect("/?error=forbidden");
  }

  return <>{children}</>;
}
