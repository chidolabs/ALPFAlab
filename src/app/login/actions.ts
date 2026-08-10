"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, hashPasscode } from "@/lib/auth";

export async function submitPasscode(formData: FormData) {
  const value = String(formData.get("passcode") ?? "");
  const next = String(formData.get("next") ?? "/");
  const expected = process.env.APP_PASSCODE ?? "";

  if (!expected || value !== expected) {
    redirect(`/login?next=${encodeURIComponent(next)}&error=1`);
  }

  const hash = await hashPasscode(value);
  const store = await cookies();
  store.set(AUTH_COOKIE, hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  redirect(next);
}
