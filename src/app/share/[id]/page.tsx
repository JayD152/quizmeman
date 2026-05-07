import Link from "next/link"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { BookOpen, Layers, ShieldCheck, Sparkles, UserRound } from "lucide-react"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import ImportSharedSetButton from "@/components/ImportSharedSetButton"

const TYPE_CONFIG = {
  MULTIPLE_CHOICE: { label: "Multiple Choice" },
  WRITTEN: { label: "Written" },
  TRUE_FALSE: { label: "True / False" },
  MATCHING: { label: "Matching" },
  MIXED: { label: "Mixed" },
  FLASHCARD: { label: "Flashcards" },
} as const

export default async function SharedSetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  const studySet = await prisma.studySet.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      _count: {
        select: { questions: true },
      },
    },
  })

  if (!studySet) notFound()

  const authorName = studySet.user.name || "Anonymous author"
  const authorInitials =
    authorName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "A"

  return (
    <div className="min-h-[calc(100vh-5rem)] relative overflow-hidden px-6 py-10 sm:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_20%)] pointer-events-none" />
      <div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/8 blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
        <section className="bg-night/85 backdrop-blur border border-steel/60 rounded-[2rem] p-8 sm:p-10 shadow-2xl shadow-black/20 animate-slide-up">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-fog">
              Shared study set
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-fog">
              ID {studySet.id.slice(0, 8)}
            </span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-snow max-w-3xl">
            {studySet.title}
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-fog leading-relaxed">
            Open this set in your library, keep your own copy, and study it without changing the original.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-steel/50 bg-black/20 p-4">
              <span className="text-[10px] uppercase tracking-[0.28em] text-smoke font-semibold">Type</span>
              <p className="mt-2 font-heading text-xl text-snow">{TYPE_CONFIG[studySet.type].label}</p>
            </div>
            <div className="rounded-2xl border border-steel/50 bg-black/20 p-4">
              <span className="text-[10px] uppercase tracking-[0.28em] text-smoke font-semibold">Questions</span>
              <p className="mt-2 font-heading text-xl text-snow">{studySet._count.questions}</p>
            </div>
            <div className="rounded-2xl border border-steel/50 bg-black/20 p-4">
              <span className="text-[10px] uppercase tracking-[0.28em] text-smoke font-semibold">Owner</span>
              <p className="mt-2 font-heading text-xl text-snow">{authorName}</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            {session?.user?.id ? (
              <ImportSharedSetButton shareId={studySet.id} />
            ) : (
              <Link
                href={`/signin?callbackUrl=${encodeURIComponent(`/share/${studySet.id}`)}`}
                className="inline-flex items-center justify-center gap-2.5 bg-white text-black font-heading font-bold px-6 py-3.5 rounded-xl hover:shadow-lg hover:shadow-white/15 transition-all duration-300"
              >
                Sign in to import
              </Link>
            )}
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2.5 border border-steel/60 bg-white/5 text-snow font-heading font-semibold px-6 py-3.5 rounded-xl hover:bg-white hover:text-black transition-all duration-300"
            >
              Back to dashboard
            </Link>
          </div>
        </section>

        <aside className="space-y-6 animate-slide-up" style={{ animationDelay: "120ms" }}>
          <div className="rounded-[2rem] border border-steel/60 bg-night/75 backdrop-blur p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-snow mb-4">
              <UserRound className="w-5 h-5 text-white" />
              <h2 className="font-heading text-2xl font-semibold">Author</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center text-lg font-bold text-snow">
                {studySet.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={studySet.user.image} alt={authorName} className="h-full w-full object-cover" />
                ) : (
                  authorInitials
                )}
              </div>
              <div>
                <p className="font-heading text-xl text-snow">{authorName}</p>
                <p className="text-sm text-fog">Original creator of this set</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-steel/60 bg-night/75 backdrop-blur p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-snow mb-4">
              <Sparkles className="w-5 h-5 text-white" />
              <h2 className="font-heading text-2xl font-semibold">How it works</h2>
            </div>
            <ul className="space-y-3 text-fog">
              <li className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-white shrink-0 mt-0.5" />
                Your import is a private copy stored in your own account.
              </li>
              <li className="flex gap-3">
                <BookOpen className="w-5 h-5 text-white shrink-0 mt-0.5" />
                The original owner keeps their version unchanged.
              </li>
              <li className="flex gap-3">
                <Layers className="w-5 h-5 text-white shrink-0 mt-0.5" />
                You can edit, quiz, or study the imported copy immediately.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}