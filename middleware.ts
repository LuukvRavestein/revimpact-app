import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createPagesMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createPagesMiddlewareClient({ req, res });
  await supabase.auth.getSession(); // ververst cookies indien nodig
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
