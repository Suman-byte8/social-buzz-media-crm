"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/login/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const success = await login(formData.email, formData.password);
    
    if (success) {
      router.replace("/dashboard");
    } else {
      setError("Invalid email or password");
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-surface-container-highest px-gutter py-stack-lg">
      <div className="w-full max-w-[420px] flex flex-col gap-stack-lg">
        <div className="text-center flex flex-col items-center gap-stack-sm mb-stack-sm">
          <div className="w-32 h-auto rounded-xl flex items-center justify-center mb-stack-sm">
            <img
              src="/images/sbm_logo.png"
              alt="SBM Logo"
              width={128}
              height={128}
            />
          </div>
          <h1 className="font-headline-md text-headline-md text-on-background">
            Agency OS
          </h1>
          <p className="font-body-md text-body-md text-secondary">
            Social Buzz Media
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg border border-secondary-container shadow-[0px_2px_4px_rgba(0,0,0,0.05)] p-stack-lg flex flex-col gap-stack-lg">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-stack-sm">
              <p className="font-body-sm text-body-sm text-red-600 text-center">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-stack-lg">
            <div className="flex flex-col gap-stack-sm">
              <label
                className="font-label-md text-label-md text-on-background"
                htmlFor="email"
              >
                Email/ID
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">
                  person
                </span>
                <input
                  className="w-full h-11 pl-10 pr-3 rounded bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-background focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors"
                  id="email"
                  placeholder="Enter your email or ID"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex flex-col gap-stack-sm">
              <label
                className="font-label-md text-label-md text-on-background"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">
                  lock
                </span>
                <input
                  className="w-full h-11 pl-10 pr-10 rounded bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-background focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-background transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>
            <button
              className="w-full h-11 mt-unit bg-primary-container text-white rounded font-label-md text-label-md hover:bg-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && (
                <span className="material-symbols-outlined text-sm font-bold">
                  arrow_forward
                </span>
              )}
            </button>
          </form>
        </div>
        <div className="text-center font-label-sm text-label-sm text-secondary">
          <p>Internal use only. Social Buzz Media © 2024.</p>
        </div>
      </div>
    </main>
  );
}