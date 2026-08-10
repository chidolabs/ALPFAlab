"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_AUTH_COOKIE, hashPasscode } from "@/lib/auth";

export async function submitAdminPasscode(formData: FormData) {
  const value = String(formData.get("passcode") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const expected = process.env.ADMIN_PASSCODE ?? "";

  if (!expected || value !== expected) {
    redirect(`/admin/login?next=${encodeURIComponent(next)}&error=1`);
  }

  const hash = await hashPasscode(value);
  const store = await cookies();
  store.set(ADMIN_AUTH_COOKIE, hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  redirect(next);
}
