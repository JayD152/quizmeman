import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { Plus, BookOpen, Target, TrendingUp, Layers, Pencil } from "lucide-react"
import { DeleteSetButton } from "@/components/DeleteSetButton"
import ShareSetButton from "@/components/ShareSetButton"

const TYPE_CONFIG = {
  MULTIPLE_CHOICE: { label: "Multiple Choice", color: "text-white bg-white/5 border-white/15" },
  WRITTEN: { label: "Written", color: "text-fog bg-white/5 border-white/15" },
  TRUE_FALSE: { label: "True / False", color: "text-fog bg-white/5 border-white/15" },
  MATCHING: { label: "Matching", color: "text-fog bg-white/5 border-white/15" },
  MIXED: { label: "Mixed", color: "text-fog bg-white/5 border-white/15" },
  FLASHCARD: { label: "Flashcards", color: "text-fog bg-white/5 border-white/15" },
} as const

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/signin")

  const studySets = await prisma.studySet.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { questions: true } },
      attempts: {
        orderBy: { createdAt: "desc" },
        select: { score: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  const sets = studySets.map((s) => ({
    id: s.id,
    title: s.title,
    type: s.type,
    questionCount: s._count.questions,
    lastScore: s.attempts[0]?.score ?? null,
    avgScore:
      s.attempts.length > 0
        ? s.attempts.reduce((sum, a) => sum + a.score, 0) / s.attempts.length
        : null,
    attemptCount: s.attempts.length,
  }))

  const firstName = session.user?.name?.split(" ")[0] || "there"

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 animate-fade-in">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-snow tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-fog mt-2 text-lg">
            Ready to study? Pick a set or create a new one.
          </p>
        </div>
        <Link
          href="/sets/new"
          className="inline-flex items-center gap-2.5 bg-white text-black font-heading font-bold px-6 py-3.5 rounded-xl hover:shadow-lg hover:shadow-white/15 transition-all duration-300 hover:-translate-y-0.5 shrink-0"
        >
          <Plus className="w-5 h-5" />
          Create New Set
        </Link>
      </div>

      {/* Empty State */}
      {sets.length === 0 ? (
        <div className="text-center py-24 animate-slide-up">
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-night border border-steel/50 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-smoke" />
          </div>
          <h2 className="font-heading text-2xl font-semibold text-snow mb-3">
            No study sets yet
          </h2>
          <p className="text-fog mb-10 max-w-md mx-auto">
            Create your first study set to start building quizzes and tracking your progress.
          </p>
          <Link
            href="/sets/new"
            className="inline-flex items-center gap-2.5 bg-white text-black font-heading font-bold px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-white/15 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Create Your First Set
          </Link>
        </div>
      ) : (
        /* Study Set Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sets.map((set, i) => {
            const cfg = TYPE_CONFIG[set.type]
            return (
              <div
                key={set.id}
                className="group bg-night border border-steel/50 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 animate-slide-up hover:shadow-lg hover:shadow-white/5"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Top Row */}
                <div className="flex items-start justify-between mb-4">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}
                  >
                    {cfg.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/sets/${set.id}/edit`}
                      className="text-smoke hover:text-white transition-colors p-1"
                      title="Edit study set"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <ShareSetButton setId={set.id} />
                    <DeleteSetButton setId={set.id} />
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-heading text-xl font-bold text-snow mb-2 line-clamp-2">
                  {set.title}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-3 text-smoke text-sm mb-6">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {set.questionCount} question{set.questionCount !== 1 ? "s" : ""}
                  </span>
                  {set.attemptCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      {set.attemptCount} attempt{set.attemptCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Scores */}
                {set.type !== "FLASHCARD" ? (
                  <div className="flex items-center gap-5 mb-6">
                    <div>
                      <span className="text-[10px] text-smoke uppercase tracking-widest font-semibold">
                        Last Score
                      </span>
                      <p className="font-heading text-lg font-bold text-snow">
                        {set.lastScore !== null
                          ? `${Math.round(set.lastScore)}%`
                          : "—"}
                      </p>
                    </div>
                    <div className="w-px h-9 bg-steel/60" />
                    <div>
                      <span className="text-[10px] text-smoke uppercase tracking-widest font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Average
                      </span>
                      <p className="font-heading text-lg font-bold text-snow">
                        {set.avgScore !== null
                          ? `${Math.round(set.avgScore)}%`
                          : "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 text-sm text-fog">No scoring in flashcard mode.</div>
                )}

                {/* Take Button */}
                <Link
                  href={set.type === "FLASHCARD" ? `/sets/${set.id}/flashcards` : `/sets/${set.id}/take`}
                  className="block w-full text-center bg-dusk border border-steel/50 text-snow font-heading font-semibold py-3 rounded-xl hover:bg-white hover:text-black hover:border-white/50 transition-all duration-300"
                >
                  {set.type === "FLASHCARD" ? "Study Flashcards" : "Take Quiz"}
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
