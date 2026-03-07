"use client"

import { signIn } from "next-auth/react"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6">
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Background blobs */}
      <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] rounded-full bg-white/[0.02] blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] rounded-full bg-white/[0.02] blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.01] blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="relative bg-night/80 backdrop-blur-xl border border-steel/50 rounded-3xl p-10 sm:p-12 w-full max-w-md text-center animate-scale-in">
        {/* Logo */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-white flex items-center justify-center shadow-2xl shadow-white/10">
          <span className="text-black font-heading font-extrabold text-3xl">
            Q
          </span>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-snow mb-3 tracking-tight">
          Welcome to Quiz<span className="text-white">Me</span>
        </h1>
        <p className="text-fog text-lg mb-10 max-w-xs mx-auto leading-relaxed">
          Create custom quizzes and track your learning progress.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-4 px-6 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-smoke text-xs mt-8">
          By signing in, you agree to use this app responsibly.
        </p>
      </div>
    </div>
  )
}
