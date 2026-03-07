"use client"

import { SunMoon } from "lucide-react"

const STORAGE_KEY = "quizme-theme"

export function ThemeToggle() {
  function toggleTheme() {
    const root = document.documentElement
    const isDark = root.classList.contains("dark")
    const nextTheme = isDark ? "light" : "dark"

    root.classList.toggle("dark", nextTheme === "dark")
    localStorage.setItem(STORAGE_KEY, nextTheme)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle light and dark mode"
      className="h-9 w-9 rounded-lg border border-steel/60 bg-night text-fog hover:text-snow hover:border-mist transition-colors cursor-pointer flex items-center justify-center"
    >
      <SunMoon className="h-4 w-4" />
    </button>
  )
}
