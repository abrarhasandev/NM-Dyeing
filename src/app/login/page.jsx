"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const form = e.target;
    const email = String(form.email.value || "")
      .trim()
      .toLowerCase();
    const password = form.password.value;

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      // NextAuth v5: failed credentials → ok:false, error: "CredentialsSignin"
      if (response?.error || !response?.ok) {
        const message =
          response?.error === "CredentialsSignin" ||
          response?.code === "credentials"
            ? "Invalid email or password"
            : response?.error || "Authentication failed";
        toast.error(message);
        return;
      }

      toast.success("Login successful");
      form.reset();

      const callbackUrl = searchParams.get("callbackUrl");
      const safeTarget =
        callbackUrl &&
        callbackUrl.startsWith("/") &&
        !callbackUrl.startsWith("//")
          ? callbackUrl
          : "/dashboard/order";

      router.replace(safeTarget);
      router.refresh();
    } catch {
      toast.error("Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="flex w-full max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <div
          className="hidden bg-cover lg:block lg:w-1/2"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1606660265514-358ebbadc80d?auto=format&fit=crop&w=1575&q=80')",
          }}
        />

        <form
          onSubmit={handleSubmit}
          className="w-full px-6 py-8 md:px-8 lg:w-1/2"
          autoComplete="on"
        >
          <div className="flex justify-center mx-auto">
            <img
              className="w-auto h-7 sm:h-8"
              src="/Image/logo.png"
              alt="NM Logo"
            />
          </div>

          <p className="mt-3 text-xl text-center text-gray-600 dark:text-gray-200">
            Welcome back!
          </p>

          <div className="flex items-center justify-between mt-4">
            <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/4" />
            <span className="text-xs text-center text-gray-500 uppercase">
              login with email
            </span>
            <span className="w-1/5 border-b dark:border-gray-400 lg:w-1/4" />
          </div>

          <div className="mt-4">
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-200"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full px-4 py-2 border rounded-lg focus:border-[#f54e00] focus:ring focus:ring-[#f54e00]/30 bg-background"
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-200"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              className="block w-full px-4 py-2 border rounded-lg focus:border-[#f54e00] focus:ring focus:ring-[#f54e00]/30 bg-background"
            />
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 text-sm font-medium text-white bg-[#f54e00] rounded-lg hover:bg-[#d94400] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
          Loading…
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
