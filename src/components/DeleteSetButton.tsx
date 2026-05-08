"use client"

import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

export function DeleteSetButton({ setId }: { setId: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this study set? This cannot be undone.")) return

    const res = await fetch(`/api/study-sets/${setId}`, { method: "DELETE" })
    if (res.ok) {
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="text-smoke hover:text-snow transition-colors cursor-pointer p-1"
      title="Delete study set"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
