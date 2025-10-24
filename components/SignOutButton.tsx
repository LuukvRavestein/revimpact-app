"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const handleSignOut = () => {
    console.log("Sign out button clicked!"); // This should appear in console
    
    if (isSigningOut) {
      console.log("Already signing out, ignoring click");
      return;
    }
    
    setIsSigningOut(true);
    console.log("Starting sign out process...");
    
    // Clear any local storage or session data
    console.log("Clearing storage...");
    localStorage.clear();
    sessionStorage.clear();
    console.log("Cleared local storage and session storage");
    
    // Force redirect to signin page
    console.log("Redirecting to signin page...");
    window.location.href = "/signin";
  };

  return (
    <div>
      {/* Test button with inline styles */}
      <button
        onClick={() => {
          console.log("Button clicked!");
          alert("Button clicked!");
          window.location.href = "/signin";
        }}
        style={{ 
          padding: '8px 16px',
          fontSize: '14px',
          backgroundColor: '#dc2626',
          color: 'white',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 9999,
          pointerEvents: 'auto'
        }}
      >
        Sign out (Test)
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
