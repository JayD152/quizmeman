"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (pathname === "/signin" || !session) return null

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-midnight/80 border-b border-steel/50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/10 group-hover:shadow-white/20 transition-shadow">
            <span className="text-black font-heading font-extrabold text-base">
              Q
            </span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-xl font-bold text-snow tracking-tight">
              Quiz<span className="text-snow">Me</span>
            </span>
            <span className="text-[10px] text-fog/70 font-semibold tracking-wide uppercase">
              by HCWS
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {session.user?.image && (
            <Image
              src={session.user.image}
              alt={session.user.name || ""}
              width={32}
              height={32}
              className="rounded-full border-2 border-steel"
            />
          )}
          <span className="text-fog text-sm hidden sm:block">
            {session.user?.name}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="text-smoke hover:text-coral flex items-center gap-1.5 text-sm transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
