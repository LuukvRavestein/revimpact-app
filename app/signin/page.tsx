"use client";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function SignInPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const sendLink = async () => {
    setErr(null);
    const base =
      typeof window !== "undefined" ? window.location.origin : "https://app.revimpact.nl";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${base}/auth/callback` }
    });
    if (error) setErr(error.message);
    else setSent(true);
  };

  return (
    <main className="max-w-md mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Sign in to RevImpact</h1>
      <p className="text-gray-600">Ontvang een magic link per e-mail.</p>
      <input
        className="border rounded w-full p-2"
        placeholder="jij@bedrijf.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        autoComplete="email"
      />
      <button
        onClick={sendLink}
        className="rounded px-4 py-2 bg-[#3A6FF8] text-white"
        disabled={!email}
      >
        Send magic link
      </button>
      {sent && <p className="text-green-700">Check je mail voor de magic link ✉️</p>}
      {err && <p className="text-red-600">{err}</p>}
    </main>
  );
}
