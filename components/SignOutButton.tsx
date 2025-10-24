"use client";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function SignOutButton() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out error:", error);
        // Even if there's an error, redirect to signin
      }
      
      // Clear any local storage or session data
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to signin page
      router.push("/signin");
      router.refresh(); // Force a refresh to clear any cached data
    } catch (error) {
      console.error("Sign out error:", error);
      // Even if there's an error, redirect to signin
      router.push("/signin");
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      Sign out
    </button>
  );
}
