"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TimewaxLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Simple authentication check for Timewax employees
      // In production, this would connect to your authentication system
      const isTimewaxEmployee = email.toLowerCase().includes('@timewax.com') || 
                               email.toLowerCase().includes('@timewax.nl') ||
                               email.toLowerCase().includes('@timewax.de') ||
                               email.toLowerCase().includes('@timewax.fr');

      if (!isTimewaxEmployee) {
        setError("Alleen Timewax medewerkers hebben toegang tot deze functie.");
        setIsLoading(false);
        return;
      }

      // For demo purposes, accept any password for Timewax emails
      // In production, implement proper authentication
      if (password.length < 6) {
        setError("Wachtwoord moet minimaal 6 karakters bevatten.");
        setIsLoading(false);
        return;
      }

      // Store authentication in sessionStorage
      sessionStorage.setItem('timewax_authenticated', 'true');
      sessionStorage.setItem('timewax_user', email);
      sessionStorage.setItem('timewax_login_time', new Date().toISOString());

      // Redirect to chatbot page
      router.push('/chatbot');
    } catch (err) {
      setError("Er is een fout opgetreden bij het inloggen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Timewax Chatbot Analytics
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Alleen voor Timewax medewerkers
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mailadres
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="naam@timewax.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Wachtwoord
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Inloggen..." : "Inloggen"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Informatie</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Deze functie is alleen beschikbaar voor Timewax medewerkers.<br />
                Gebruik je Timewax e-mailadres om in te loggen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
