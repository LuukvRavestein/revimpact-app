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
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-impact-light via-white to-impact-light flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-impact-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-impact-lime/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-impact-blue/3 rounded-full blur-3xl"></div>
        
        {/* Revenue growth illustration */}
        <div className="absolute top-20 left-20 opacity-10">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 100 L40 80 L60 60 L80 40 L100 20" stroke="#3A6FF8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="20" cy="100" r="4" fill="#3A6FF8"/>
            <circle cx="40" cy="80" r="4" fill="#3A6FF8"/>
            <circle cx="60" cy="60" r="4" fill="#3A6FF8"/>
            <circle cx="80" cy="40" r="4" fill="#3A6FF8"/>
            <circle cx="100" cy="20" r="4" fill="#8AE34C"/>
            <text x="10" y="115" fontSize="12" fill="#3A6FF8" opacity="0.7">Revenue</text>
          </svg>
        </div>
        
        {/* Impact target illustration */}
        <div className="absolute bottom-20 right-20 opacity-10">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="#8AE34C" strokeWidth="2" fill="none"/>
            <circle cx="50" cy="50" r="25" stroke="#8AE34C" strokeWidth="2" fill="none"/>
            <circle cx="50" cy="50" r="10" fill="#8AE34C"/>
            <path d="M30 30 L70 70 M70 30 L30 70" stroke="#3A6FF8" strokeWidth="2" strokeLinecap="round"/>
            <text x="50" y="90" fontSize="10" fill="#8AE34C" opacity="0.7" textAnchor="middle">Impact</text>
          </svg>
        </div>
      </div>

      {/* Language switcher in top right */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Main login card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 space-y-6">
          {/* Logo and branding */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-impact-blue to-impact-lime rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <h1 className="text-2xl font-bold text-impact-dark">RevImpact</h1>
            </div>
            <p className="text-sm text-gray-500 font-medium">Maximize your revenue impact</p>
          </div>

          {/* Welcome text */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold text-impact-dark">{t.signInPage.title}</h2>
            <p className="text-gray-600 text-sm">{t.signInPage.subtitle}</p>
          </div>

          {/* Error message */}
          {err && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm text-center">{err}</p>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Email field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">E-mail address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors bg-white/50"
                  placeholder={t.signInPage.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors bg-white/50"
                  placeholder={t.signInPage.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Remember me and forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-impact-blue border-gray-300 rounded focus:ring-impact-blue/20"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-impact-blue hover:text-impact-blue/80 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Login button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-impact-blue to-impact-blue/90 hover:from-impact-blue/90 hover:to-impact-blue text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-impact-blue/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t.loading}</span>
                </div>
              ) : (
                t.signInPage.signInButton
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Alternative login options */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 font-medium">Sign in with Google</span>
            </button>
            
            <button className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span className="text-gray-700 font-medium">Login with SSO</span>
            </button>
          </div>

          {/* Sign up link */}
          <div className="text-center pt-4">
            <p className="text-gray-600 text-sm">
              {t.signInPage.signUpLink}{' '}
              <Link href="/signup" className="text-impact-blue hover:text-impact-blue/80 font-medium transition-colors">
                {t.signInPage.signUpButton}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-impact-light via-white to-impact-light flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-impact-blue to-impact-lime rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <h1 className="text-2xl font-bold text-impact-dark">RevImpact</h1>
              </div>
              <p className="text-sm text-gray-500 font-medium">Maximize your revenue impact</p>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-impact-dark">Sign in to RevImpact</h2>
              <p className="text-gray-600 text-sm">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
