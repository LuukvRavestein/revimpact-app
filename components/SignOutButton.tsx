"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks
    
    setIsSigningOut(true);
    
    try {
      console.log("Starting sign out process...");
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Supabase sign out error:", error);
      } else {
        console.log("Successfully signed out from Supabase");
      }
      
      // Clear any local storage or session data
      localStorage.clear();
      sessionStorage.clear();
      console.log("Cleared local storage and session storage");
      
      // Force redirect to signin page
      console.log("Redirecting to signin page...");
      window.location.href = "/signin";
      
    } catch (error) {
      console.error("Sign out error:", error);
      // Force redirect even if there's an error
      window.location.href = "/signin";
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isSigningOut ? "Uitloggen..." : "Sign out"}
    </button>
  );
}
