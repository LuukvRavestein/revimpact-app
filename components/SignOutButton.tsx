"use client";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }
    
    setIsSigningOut(true);
    
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out error:", error);
      }
      
      // Clear any local storage or session data
      localStorage.clear();
      sessionStorage.clear();
      
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      // Force redirect to signin page
      window.location.href = "/signin";
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSigningOut ? "Uitloggen..." : "Sign out"}
    </button>
  );
}
