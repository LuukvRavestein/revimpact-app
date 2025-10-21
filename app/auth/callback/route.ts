import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  
  console.log("Auth callback - Code:", code);
  console.log("Auth callback - Next:", next);
  console.log("Auth callback - Full URL:", url.toString());
  
  if (!code) {
    console.log("No code provided, redirecting to signin");
    return NextResponse.redirect(new URL("/signin?error=no_code", request.url));
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    console.log("Auth exchange result:", { data, error });
    
    if (error) {
      console.log("Auth exchange error:", error.message);
      return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(error.message)}`, request.url));
    }

    console.log("Auth successful, redirecting to:", next);
    return NextResponse.redirect(new URL(next, request.url));
  } catch (err) {
    console.log("Unexpected error in auth callback:", err);
    return NextResponse.redirect(new URL("/signin?error=unexpected", request.url));
  }
}
