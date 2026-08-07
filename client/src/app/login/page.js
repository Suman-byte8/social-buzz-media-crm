import React from "react";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-surface-container-highest px-gutter py-stack-lg">
      <div className="w-full max-w-[420px] flex flex-col gap-stack-lg">
        <div className="text-center flex flex-col items-center gap-stack-sm mb-stack-sm">
          <div className="w-32 h-auto rounded-xl flex items-center justify-center mb-stack-sm">
            <img
              src="/images/sbm_logo.png"
              alt="SBM Logo"
              
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
                type="password"
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-background transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">
                  visibility_off
                </span>
              </button>
            </div>
          </div>
          <button
            className="w-full h-11 mt-unit bg-primary-container text-white rounded font-label-md text-label-md hover:bg-primary transition-colors flex items-center justify-center gap-2"
            type="button"
          >
            Sign In
            <span className="material-symbols-outlined text-sm font-bold">
              arrow_forward
            </span>
          </button>
        </div>
        <div className="text-center font-label-sm text-label-sm text-secondary">
          <p>Internal use only. Social Buzz Media © 2024.</p>
        </div>
      </div>
    </main>
  );
}
