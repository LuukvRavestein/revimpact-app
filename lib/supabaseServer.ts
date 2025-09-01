import { cookies } from "next/headers";
import { createPagesServerComponentClient } from "@supabase/auth-helpers-nextjs";
// Optional: voeg je Database type toe als je die hebt gegenereerd in /lib/types
// import type { Database } from "./types";

export const createSupabaseServerClient = () =>
  createPagesServerComponentClient<Record<string, never>>({ cookies });
