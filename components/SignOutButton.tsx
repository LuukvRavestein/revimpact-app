"use client";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function SignOutButton() {
  const supabase = createSupabaseBrowserClient();
  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        window.location.href = "/signin";
      }}
      className="rounded px-4 py-2 border"
    >
      Sign out
    </button>
  );
}
