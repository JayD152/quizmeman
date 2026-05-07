"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"

interface ImportSharedSetButtonProps {
  shareId: string
}

export default function ImportSharedSetButton({ shareId }: ImportSharedSetButtonProps) {
  const router = useRouter()
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImport = async () => {
    setIsImporting(true)
    setError(null)

    try {
      const response = await fetch(`/api/share/${shareId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = (await response.json().catch(() => null)) as { id?: string; error?: string } | null

      if (!response.ok) {
        if (response.status === 401) {
          router.push(`/signin?callbackUrl=${encodeURIComponent(`/share/${shareId}`)}`)
          return
        }

        throw new Error(data?.error || "Unable to import this study set")
      }

      if (!data?.id) {
        throw new Error("Unable to import this study set")
      }

      router.push(`/sets/${data.id}/edit`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to import this study set")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleImport}
        disabled={isImporting}
        className="inline-flex items-center justify-center gap-2.5 bg-white text-black font-heading font-bold px-6 py-3.5 rounded-xl hover:shadow-lg hover:shadow-white/15 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
        Import to Library
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  )
}