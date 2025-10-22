"use client";
import { useState, useEffect, Suspense } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useSearchParams, useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

function SignInForm() {
  const supabase = createSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setErr(`${t.signInPage.errorMessage}: ${error}`);
    }
  }, [searchParams, t.signInPage.errorMessage]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErr(t.signInPage.errorMessage);
      } else {
        // Redirect to dashboard on successful login
        router.push('/dashboard');
      }
    } catch {
      setErr(t.signInPage.errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-8 space-y-4">
      {/* Language switcher in top right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <h1 className="text-2xl font-semibold">{t.signInPage.title}</h1>
      <p className="text-gray-600">{t.signInPage.subtitle}</p>
      
      <form onSubmit={handleSignIn} className="space-y-4">
        <input
          className="border rounded w-full p-2"
          placeholder={t.signInPage.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          required
        />
        <input
          className="border rounded w-full p-2"
          placeholder={t.signInPage.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          required
        />
        <button
          type="submit"
          className="rounded px-4 py-2 bg-[#3A6FF8] text-white w-full"
          disabled={isLoading || !email || !password}
        >
          {isLoading ? t.loading : t.signInPage.signInButton}
        </button>
      </form>
      
      <div className="text-center">
        <p className="text-gray-600">
          {t.signInPage.signUpLink}{' '}
          <Link href="/signup" className="text-[#3A6FF8] hover:underline">
            {t.signInPage.signUpButton}
          </Link>
        </p>
      </div>
      
      {err && <p className="text-red-600 text-center">{err}</p>}
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
