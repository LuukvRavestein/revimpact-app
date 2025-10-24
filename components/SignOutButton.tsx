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
        onMouseDown={(e) => {
          console.log("Mouse down on sign out button");
        }}
        onMouseUp={(e) => {
          console.log("Mouse up on sign out button");
        }}
      >
        {isSigningOut ? "Uitloggen..." : "Sign out"}
      </button>
      
      {/* Alternative: Form-based approach */}
      <form action="/signout" method="post" style={{ display: 'inline', marginLeft: '10px' }}>
        <button
          type="submit"
          style={{ 
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#059669',
            color: 'white',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Sign out (Form)
        </button>
      </form>
    </div>
  );
}
