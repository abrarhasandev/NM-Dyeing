// @ts-nocheck
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";

export default async function Home({ searchParams }) {
  const session = await auth();
  const user = session?.user;
  const params = await searchParams;
  const forbidden = params?.error === "forbidden";

  if (!user?.email) {
    redirect("/login");
  }

  if (user.role === "admin") {
    redirect("/dashboard/order");
  }

  // Authenticated but not admin
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">
          {forbidden ? "Access denied" : "No access"}
        </h1>
        <p className="text-sm text-muted-foreground">
          This application is limited to administrator accounts. Contact your
          system owner if you need access.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-[#f54e00] hover:underline"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
