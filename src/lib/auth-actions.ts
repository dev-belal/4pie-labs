"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import {
  endAdminSession,
  startAdminSession,
} from "@/lib/admin-session";

import type { SignInState } from "@/lib/form-types";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const rawEmail = (formData.get("email") as string | null)?.trim() ?? "";
  const rawPassword = (formData.get("password") as string | null) ?? "";
  // Password managers often append a trailing NBSP / newline on autofill.
  const password = rawPassword.replace(/^\s+|\s+$/g, "");

  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedEmail || !expectedPassword) {
    return {
      status: "error",
      message:
        "Admin credentials are not configured on the server. Contact the operator.",
    };
  }

  const emailOk = safeEqual(rawEmail.toLowerCase(), expectedEmail.toLowerCase());
  const passwordOk = safeEqual(password, expectedPassword);

  if (!emailOk || !passwordOk) {
    return { status: "error", message: "Invalid credentials. Please try again." };
  }

  await startAdminSession(expectedEmail);

  const next = (formData.get("next") as string | null) ?? "/admin";
  revalidatePath("/admin", "layout");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function signOut() {
  await endAdminSession();
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}
