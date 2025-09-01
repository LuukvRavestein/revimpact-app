"use client";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

export const createSupabaseBrowserClient = () =>
  createPagesBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );