"use client"

import { useEffect, useState } from "react"
import { Share2, Check, Copy } from "lucide-react"

interface ShareSetButtonProps {
  setId: string
}

export default function ShareSetButton({ setId }: ShareSetButtonProps) {
  const [copied, setCopied] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [supportsShare, setSupportsShare] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timeout)
  }, [copied])

  useEffect(() => {
    setSupportsShare(typeof navigator !== "undefined" && typeof navigator.share === "function")
  }, [])

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/${setId}`

    setIsCopying(true)
    try {
      if (supportsShare) {
        await navigator.share({
          title: "QuizMe study set",
          text: "Open this shared study set in QuizMe.",
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
      } catch {
        window.prompt("Copy this share link", shareUrl)
      }
    } finally {
      setIsCopying(false)
    }
  }

  const Icon = copied ? Check : supportsShare ? Share2 : Copy

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={isCopying}
      className="text-smoke hover:text-white transition-colors p-1 disabled:opacity-60"
      title={copied ? "Link copied" : "Share study set"}
      aria-label={copied ? "Link copied" : "Share study set"}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}