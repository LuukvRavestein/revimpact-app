"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const handleSignOut = async () => {
    console.log("Sign out button clicked!");
    
    if (isSigningOut) {
      console.log("Already signing out, ignoring click");
      return;
    }
    
    setIsSigningOut(true);
    console.log("Starting sign out process...");
    
    try {
      // Sign out from Supabase
      console.log("Signing out from Supabase...");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Supabase sign out error:", error);
      } else {
        console.log("Successfully signed out from Supabase");
      }
      
      // Clear any local storage or session data
      console.log("Clearing storage...");
      localStorage.clear();
      sessionStorage.clear();
      console.log("Cleared local storage and session storage");
      
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      // Force redirect to signin page
      console.log("Redirecting to signin page...");
      window.location.href = "/signin";
    }
  };

  return (
    <div>
      {/* Main sign out button */}
      <button
        onClick={handleSignOut}
        disabled={isSigningOut}
        style={{ 
          padding: '8px 16px',
          fontSize: '14px',
          backgroundColor: '#dc2626',
          color: 'white',
          borderRadius: '4px',
          border: 'none',
          cursor: isSigningOut ? 'not-allowed' : 'pointer',
          position: 'relative',
          zIndex: 9999,
          pointerEvents: 'auto'
        }}
      >
        {isSigningOut ? "Uitloggen..." : "Sign out"}
      </button>
      
      {/* Alternative: Direct link approach */}
      <a
        href="/signout"
        style={{ 
          display: 'inline-block',
          padding: '8px 16px',
          fontSize: '14px',
          backgroundColor: '#059669',
          color: 'white',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'none',
          marginLeft: '10px'
        }}
      >
        Sign out (Link)
      </a>
    </div>
  );
}
