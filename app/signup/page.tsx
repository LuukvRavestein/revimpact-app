"use client";
import { useState, useEffect, Suspense } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useSearchParams, useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

function SignUpForm() {
  const supabase = createSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setErr(`${t.signInPage.errorMessage}: ${error}`);
    }
  }, [searchParams, t.signInPage.errorMessage]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setIsLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setErr(t.signUpPage.passwordMismatch);
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setErr(t.signUpPage.passwordTooShort);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        setErr(error.message);
      } else {
        setSuccess(true);
      }
    } catch (error) {
      setErr(t.signUpPage.signUpError);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <main className="max-w-md mx-auto p-8 space-y-4">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        
        <div className="text-center space-y-4">
          <div className="text-6xl">📧</div>
          <h1 className="text-2xl font-semibold">{t.signUpPage.checkEmail}</h1>
          <p className="text-gray-600">
            {t.signUpPage.emailSent} <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500">
            {t.signUpPage.clickLink}
          </p>
          <Link href="/signin" className="text-[#3A6FF8] hover:underline">
            {t.signUpPage.backToSignIn}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-8 space-y-4">
      {/* Language switcher in top right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <h1 className="text-2xl font-semibold">{t.signUpPage.title}</h1>
      <p className="text-gray-600">{t.signUpPage.subtitle}</p>
      
      <form onSubmit={handleSignUp} className="space-y-4">
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
          autoComplete="new-password"
          required
        />
        <input
          className="border rounded w-full p-2"
          placeholder={t.signUpPage.confirmPasswordPlaceholder}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          type="password"
          autoComplete="new-password"
          required
        />
        <button
          type="submit"
          className="rounded px-4 py-2 bg-[#3A6FF8] text-white w-full"
          disabled={isLoading || !email || !password || !confirmPassword}
        >
          {isLoading ? t.loading : t.signUpPage.createButton}
        </button>
      </form>
      
      <div className="text-center">
        <p className="text-gray-600">
          {t.signUpPage.signInLink}{' '}
          <Link href="/signin" className="text-[#3A6FF8] hover:underline">
            {t.signUpPage.signInButton}
          </Link>
        </p>
      </div>
      
      {err && <p className="text-red-600 text-center">{err}</p>}
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <main className="max-w-md mx-auto p-8 space-y-4">
        <h1 className="text-2xl font-semibold">Create Account</h1>
        <p className="text-gray-600">Loading...</p>
      </main>
    }>
      <SignUpForm />
    </Suspense>
  );
}
