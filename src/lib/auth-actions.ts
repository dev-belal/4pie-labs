"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address").max(200),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
});

export type SignInState = {
  status: "idle" | "error";
  message?: string;
};

export const signInInitial: SignInState = { status: "idle" };

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid credentials.";
    return { status: "error", message: first };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      status: "error",
      message: error.message ?? "Invalid credentials. Please try again.",
    };
  }

  const next = (formData.get("next") as string | null) ?? "/admin";
  revalidatePath("/admin", "layout");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}
