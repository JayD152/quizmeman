"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Link2, Upload } from "lucide-react"

function extractShareId(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    const match = url.pathname.match(/^\/share\/([^/]+)$/)
    return match?.[1] ?? null
  } catch {
    const match = trimmed.match(/^\/share\/([^/]+)$/)
    if (match?.[1]) return match[1]
    return /^[A-Za-z0-9]+$/.test(trimmed) ? trimmed : null
  }
}

export default function ShareLookupPage() {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleOpen = () => {
    const id = extractShareId(value)
    if (!id) {
      setError("Paste a QuizMe share link or set ID.")
      return
    }

    router.push(`/share/${id}`)
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] px-6 py-10 sm:py-16 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-night/85 backdrop-blur border border-steel/60 rounded-[2rem] p-8 sm:p-10 shadow-2xl shadow-black/20">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-fog mb-5">
          <Upload className="w-3.5 h-3.5" />
          Import shared set
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-snow max-w-xl">
          Open a shared study set
        </h1>
        <p className="mt-4 text-lg text-fog max-w-xl leading-relaxed">
          Paste a QuizMe share link or set ID to open the public page and import it into your library.
        </p>

        <div className="mt-8 space-y-4">
          <label className="block text-sm uppercase tracking-[0.24em] text-smoke font-semibold">
            Share link or ID
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 rounded-2xl border border-steel/60 bg-black/20 px-4 py-3.5">
              <Link2 className="w-4 h-4 text-smoke shrink-0" />
              <input
                value={value}
                onChange={(event) => {
                  setValue(event.target.value)
                  if (error) setError(null)
                }}
                placeholder="https://.../share/abc123 or abc123"
                className="w-full bg-transparent outline-none text-snow placeholder:text-smoke"
              />
            </div>
            <button
              type="button"
              onClick={handleOpen}
              className="inline-flex items-center justify-center gap-2.5 font-heading font-bold px-6 py-3.5 rounded-xl hover:shadow-lg transition-all duration-300"
              style={{
                background: "var(--button-primary-bg)",
                color: "var(--button-primary-text)",
              }}
            >
              Open
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2.5 border border-steel/60 font-heading font-semibold px-6 py-3.5 rounded-xl transition-all duration-300"
            style={{
              background: "var(--button-secondary-bg)",
              color: "var(--button-secondary-text)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--button-primary-bg)";
              e.currentTarget.style.color = "var(--button-primary-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--button-secondary-bg)";
              e.currentTarget.style.color = "var(--button-secondary-text)";
            }}
          >
            Back to dashboard
          </Link>
          <Link
            href="/sets/new"
            className="inline-flex items-center justify-center gap-2.5 border border-steel/60 font-heading font-semibold px-6 py-3.5 rounded-xl transition-all duration-300"
            style={{
              background: "var(--button-secondary-bg)",
              color: "var(--button-secondary-text)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--button-primary-bg)";
              e.currentTarget.style.color = "var(--button-primary-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--button-secondary-bg)";
              e.currentTarget.style.color = "var(--button-secondary-text)";
            }}
          >
            Create new set
          </Link>
        </div>
      </div>
    </div>
  )
}