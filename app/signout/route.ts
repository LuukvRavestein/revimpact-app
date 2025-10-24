import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("Sign out route called");
    
    // Simple redirect - let the client handle the actual sign out
    return NextResponse.redirect(new URL("/signin", request.url));
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.redirect(new URL("/signin", request.url));
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("Sign out route called (GET)");
    
    // Simple redirect - let the client handle the actual sign out
    return NextResponse.redirect(new URL("/signin", request.url));
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.redirect(new URL("/signin", request.url));
  }
}
