import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: NextRequest) {
  try {
    console.log("Sign out route called (POST)");
    
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
    
    return NextResponse.redirect(new URL("/signin", request.url));
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.redirect(new URL("/signin", request.url));
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("Sign out route called (GET)");
    
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
    
    return NextResponse.redirect(new URL("/signin", request.url));
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.redirect(new URL("/signin", request.url));
  }
}
