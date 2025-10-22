"use client";
import { useState, useEffect, Suspense } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

function SignInForm() {
  const supabase = createSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setErr(`${t.signInPage.errorMessage}: ${error}`);
    }
  }, [searchParams]);

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
      {/* Language switcher in top right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <h1 className="text-2xl font-semibold">{t.signInPage.title}</h1>
      <p className="text-gray-600">{t.signInPage.subtitle}</p>
      <input
        className="border rounded w-full p-2"
        placeholder={t.signInPage.emailPlaceholder}
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
        {t.signInPage.sendButton}
      </button>
      {sent && <p className="text-green-700">{t.signInPage.successMessage}</p>}
      {err && <p className="text-red-600">{err}</p>}
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <main className="max-w-md mx-auto p-8 space-y-4">
        <h1 className="text-2xl font-semibold">Sign in to RevImpact</h1>
        <p className="text-gray-600">Loading...</p>
      </main>
    }>
      <SignInForm />
    </Suspense>
  );
}
