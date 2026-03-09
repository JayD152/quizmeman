import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { extractMatchingPairs } from "@/lib/matching"
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Target,
  Clock,
} from "lucide-react"

function parseSubmittedMatchingMap(raw: string | null): Record<string, string> {
  if (!raw?.trim()) return {}

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}

    const next: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (key.trim().length === 0 || typeof value !== "string") continue
      next[key] = value
    }

    return next
  } catch {
    return {}
  }
}

function ScoreRing({ score }: { score: number }) {
  const radius = 58
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color =
    score >= 80 ? "#ffffff" : score >= 60 ? "#a3a3a3" : "#737373"

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="160" height="160" className="-rotate-90">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#1f1f1f"
          strokeWidth="10"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1.2s ease-out",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-heading text-4xl font-extrabold"
          style={{ color }}
        >
          {Math.round(score)}%
        </span>
      </div>
    </div>
  )
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/signin")

  const { id, attemptId } = await params

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      studySet: true,
      answers: {
        include: {
          question: {
            include: {
              choices: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  })

  if (!attempt || attempt.userId !== session.user.id) redirect("/")

  // Get all attempts for average
  const allAttempts = await prisma.attempt.findMany({
    where: { studySetId: id, userId: session.user.id },
    select: { score: true },
  })
  const avgScore =
    allAttempts.reduce((sum: number, a: { score: number }) => sum + a.score, 0) / allAttempts.length

  // Sort answers by question order
  const sortedAnswers = [...attempt.answers].sort(
    (a, b) => a.question.order - b.question.order
  )

  const getMessage = (score: number) => {
    if (score >= 90) return { text: "Outstanding!", icon: Trophy }
    if (score >= 80) return { text: "Great job!", icon: Trophy }
    if (score >= 70) return { text: "Good work!", icon: Target }
    if (score >= 60) return { text: "Not bad!", icon: Target }
    return { text: "Keep practicing!", icon: RotateCcw }
  }

  const message = getMessage(attempt.score)
  const MessageIcon = message.icon

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 animate-fade-in">
      {/* Score Section */}
      <div className="text-center mb-14">
        <ScoreRing score={attempt.score} />

        <div className="flex items-center justify-center gap-2 mt-6 mb-2">
          <MessageIcon
            className={`w-6 h-6 ${
              attempt.score >= 80
                ? "text-white"
                : attempt.score >= 60
                ? "text-fog"
                : "text-smoke"
            }`}
          />
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-snow">
            {message.text}
          </h1>
        </div>

        <h2 className="font-heading text-lg text-fog mb-6">
          {attempt.studySet.title}
        </h2>

        {/* Stats */}
        <div className="inline-flex items-center gap-6 bg-night border border-steel/50 rounded-2xl px-8 py-4">
          <div className="text-center">
            <p className="text-[10px] text-smoke uppercase tracking-widest font-semibold mb-1">
              Correct
            </p>
            <p className="font-heading text-xl font-bold text-white">
              {attempt.totalCorrect}
              <span className="text-smoke text-sm font-normal">
                /{attempt.totalQuestions}
              </span>
            </p>
          </div>
          <div className="w-px h-10 bg-steel/60" />
          <div className="text-center">
            <p className="text-[10px] text-smoke uppercase tracking-widest font-semibold mb-1">
              Average
            </p>
            <p className="font-heading text-xl font-bold text-fog">
              {Math.round(avgScore)}%
            </p>
          </div>
          {attempt.timeTaken && (
            <>
              <div className="w-px h-10 bg-steel/60" />
              <div className="text-center">
                <p className="text-[10px] text-smoke uppercase tracking-widest font-semibold mb-1">
                  Time
                </p>
                <p className="font-heading text-xl font-bold text-fog flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.floor(attempt.timeTaken / 60)}m{" "}
                  {attempt.timeTaken % 60}s
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Question Breakdown */}
      <h3 className="font-heading text-xl font-bold text-snow mb-6">
        Question Breakdown
      </h3>

      <div className="space-y-4">
        {sortedAnswers.map((answer, i) => {
          const question = answer.question
          const isCorrect = answer.isCorrect

          return (
            <div
              key={answer.id}
              className={`border rounded-2xl p-6 transition-all animate-slide-up ${
                isCorrect
                  ? "border-white/15 bg-white/[0.02]"
                  : "border-white/8 bg-white/[0.01]"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Question */}
              <div className="flex items-start gap-3 mb-4">
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-smoke shrink-0 mt-0.5" />
                )}
                <p className="font-heading font-semibold text-snow">
                  {question.text}
                </p>
              </div>

              {/* Answer Details */}
              {question.type === "MULTIPLE_CHOICE" ? (
                <div className="ml-8 space-y-2">
                  {question.choices.map((choice: { id: string; text: string; isCorrect: boolean; order: number }) => {
                    const isSelected =
                      answer.selectedChoiceId === choice.id
                    const isCorrectChoice = choice.isCorrect

                    return (
                      <div
                        key={choice.id}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${
                          isCorrectChoice
                            ? "bg-white/10 text-white border border-white/20"
                            : isSelected && !isCorrectChoice
                            ? "bg-white/5 text-smoke border border-white/10"
                            : "text-smoke"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isCorrectChoice
                              ? "border-white bg-white"
                              : isSelected
                              ? "border-smoke bg-smoke"
                              : "border-steel"
                          }`}
                        >
                          {(isSelected || isCorrectChoice) && (
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                isCorrectChoice
                                  ? "bg-black"
                                  : "bg-black"
                              }`}
                            />
                          )}
                        </div>
                        <span>{choice.text}</span>
                        {isCorrectChoice && (
                          <span className="ml-auto text-[10px] uppercase tracking-wider font-bold text-white">
                            Correct
                          </span>
                        )}
                        {isSelected && !isCorrectChoice && (
                          <span className="ml-auto text-[10px] uppercase tracking-wider font-bold text-smoke">
                            Your answer
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : question.type === "MATCHING" ? (
                <div className="ml-8 space-y-2">
                  {(() => {
                    const pairs = extractMatchingPairs({
                      text: question.text,
                      correctAnswer: question.correctAnswer,
                      choices: question.choices.map((choice) => ({
                        id: choice.id,
                        text: choice.text,
                        order: choice.order,
                      })),
                    })
                    const submittedMap = parseSubmittedMatchingMap(answer.writtenAnswer)

                    return pairs.map((pair) => {
                      const selected = submittedMap[pair.leftId] || ""
                      const pairCorrect = selected.trim().toLowerCase() === pair.right.trim().toLowerCase()

                      return (
                        <div key={pair.leftId} className="border border-white/10 rounded-lg px-3 py-2">
                          <div className="text-sm text-white mb-1">{pair.left}</div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-smoke">Your match:</span>
                            <span className={pairCorrect ? "text-white" : "text-smoke"}>{selected || "(blank)"}</span>
                          </div>
                          {!pairCorrect && (
                            <div className="flex items-center gap-2 text-xs mt-1">
                              <span className="text-smoke">Correct:</span>
                              <span className="text-white">{pair.right}</span>
                            </div>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>
              ) : question.type === "TRUE_FALSE" ? (
                <div className="ml-8 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-smoke">Your answer:</span>
                    <span className={isCorrect ? "text-white" : "text-smoke"}>
                      {(answer.writtenAnswer || "(blank)").toUpperCase()}
                    </span>
                  </div>
                  {!isCorrect && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-smoke">Correct answer:</span>
                      <span className="text-white">{(question.correctAnswer || "").toUpperCase()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="ml-8 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-smoke">Your answer:</span>
                    <span
                      className={isCorrect ? "text-white" : "text-smoke"}
                    >
                      {answer.writtenAnswer || "(blank)"}
                    </span>
                  </div>
                  {!isCorrect && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-smoke">Correct answer:</span>
                      <span className="text-white">
                        {question.correctAnswer}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t border-steel/30">
        <Link
          href={`/sets/${id}/take`}
          className="flex-1 flex items-center justify-center gap-2.5 bg-white text-black font-heading font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-white/15 transition-all duration-300"
        >
          <RotateCcw className="w-5 h-5" />
          Retake Quiz
        </Link>
        <Link
          href="/"
          className="flex-1 flex items-center justify-center gap-2.5 bg-night border border-steel/50 text-snow font-heading font-semibold py-4 rounded-xl hover:bg-dusk hover:border-steel transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
