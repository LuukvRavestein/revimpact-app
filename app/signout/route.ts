import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Sign out the user
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Sign out error:", error);
      return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
    }

    // Redirect to signin page
    return NextResponse.redirect(new URL("/signin", request.url));
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Sign out the user
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Sign out error:", error);
      return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
    }

    // Redirect to signin page
    return NextResponse.redirect(new URL("/signin", request.url));
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}
