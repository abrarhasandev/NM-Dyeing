import { NextResponse } from "next/server";
import { auth } from "@/auth";

export type SessionUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  role?: string;
};

/**
 * Server-side session gate for Route Handlers.
 * Defense-in-depth alongside proxy.js — never rely on proxy alone for APIs.
 */
export async function requireAuth(options?: {
  roles?: string[];
}): Promise<
  | { session: { user: SessionUser }; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.email) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (options?.roles?.length) {
    const role = user.role || "user";
    if (!options.roles.includes(role)) {
      return {
        session: null,
        error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }
  }

  return {
    session: { user },
    error: null,
  };
}

/**
 * Require admin role — use for all destructive operations (DELETE, permanent edits).
 */
export async function requireAdmin() {
  return requireAuth({ roles: ["admin"] });
}

/**
 * Require admin role for write/destructive operations.
 * Includes an audit log entry for traceability.
 *
 * @param operation  A short label like "DELETE order" for the audit log.
 */
export async function requireAdminForWrite(operation: string) {
  const result = await requireAuth({ roles: ["admin"] });

  if (!result.error && result.session?.user) {
    console.info(
      `[AUDIT] ${operation} by ${result.session.user.email} (role=${result.session.user.role}) at ${new Date().toISOString()}`
    );
  }

  return result;
}
