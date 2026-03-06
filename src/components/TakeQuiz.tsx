"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Clock, Send, AlertTriangle } from "lucide-react"
import type { QuizData } from "@/types"

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function TakeQuiz({ studySet }: { studySet: QuizData }) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    studySet.timeLimit
  )
  const [submitting, setSubmitting] = useState(false)
  const startTimeRef = useRef(Date.now())
  const hasSubmittedRef = useRef(false)

  const handleSubmit = useCallback(async () => {
    if (hasSubmittedRef.current || submitting) return
    hasSubmittedRef.current = true
    setSubmitting(true)

    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000)

    try {
      const res = await fetch(`/api/study-sets/${studySet.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: studySet.questions.map((q) => ({
            questionId: q.id,
            ...(q.type === "MULTIPLE_CHOICE"
              ? { selectedChoiceId: answers[q.id] || null }
              : { writtenAnswer: answers[q.id] || "" }),
          })),
          timeTaken,
        }),
      })

      if (!res.ok) throw new Error("Failed to submit")

      const data = await res.json()
      router.push(`/sets/${studySet.id}/result/${data.attemptId}`)
    } catch {
      hasSubmittedRef.current = false
      setSubmitting(false)
      alert("Failed to submit. Please try again.")
    }
  }, [answers, studySet, submitting, router])

  // Timer
  useEffect(() => {
    if (!studySet.timeLimit) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [studySet.timeLimit])

  // Auto-submit on time up
  useEffect(() => {
    if (timeRemaining === 0) {
      handleSubmit()
    }
  }, [timeRemaining, handleSubmit])

  const answeredCount = Object.keys(answers).length
  const totalCount = studySet.questions.length
  const progress = (answeredCount / totalCount) * 100

  return (
    <div className="relative min-h-screen">
      {/* Timer Bar */}
      {studySet.timeLimit !== null && timeRemaining !== null && (
        <div className="fixed top-16 left-0 right-0 z-30">
          <div className="h-1 bg-night/50">
            <div
              className="h-full transition-all duration-1000 ease-linear rounded-r-full"
              style={{
                width: `${(timeRemaining / studySet.timeLimit) * 100}%`,
                background:
                  timeRemaining > studySet.timeLimit * 0.3
                    ? "#ffffff"
                    : timeRemaining > studySet.timeLimit * 0.1
                    ? "linear-gradient(90deg, #ffffff, #a3a3a3)"
                    : "#a3a3a3",
              }}
            />
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 animate-fade-in">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-snow tracking-tight">
              {studySet.title}
            </h1>
            <p className="text-fog mt-1">
              {answeredCount} of {totalCount} answered
            </p>
          </div>

          {studySet.timeLimit !== null && timeRemaining !== null && (
            <div
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
                timeRemaining > (studySet.timeLimit ?? 0) * 0.3
                  ? "border-steel/50 text-fog"
                  : timeRemaining > (studySet.timeLimit ?? 0) * 0.1
                  ? "border-white/20 text-white bg-white/5"
                  : "border-white/40 text-white bg-white/10 animate-pulse"
              }`}
            >
              {timeRemaining <= (studySet.timeLimit ?? 0) * 0.1 && (
                <AlertTriangle className="w-4 h-4" />
              )}
              <Clock className="w-4 h-4" />
              <span className="font-heading font-bold text-lg tabular-nums">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-night rounded-full mb-10 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {studySet.questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-night border border-steel/50 rounded-2xl p-6 sm:p-8 animate-slide-up"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start gap-4 mb-6">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-dusk text-white font-heading font-bold text-sm shrink-0">
                  {index + 1}
                </span>
                <h2 className="font-heading text-lg font-semibold text-snow leading-relaxed">
                  {question.text}
                </h2>
              </div>

              {/* Multiple Choice */}
              {question.type === "MULTIPLE_CHOICE" && (
                <div className="space-y-3 ml-12">
                  {question.choices.map((choice) => (
                    <label
                      key={choice.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        answers[question.id] === choice.id
                          ? "border-white/50 bg-white/5 shadow-sm shadow-white/10"
                          : "border-steel/40 hover:border-steel bg-dusk/50 hover:bg-dusk"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          answers[question.id] === choice.id
                            ? "border-white bg-white"
                            : "border-steel"
                        }`}
                      >
                        {answers[question.id] === choice.id && (
                          <div className="w-2 h-2 rounded-full bg-midnight" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          answers[question.id] === choice.id
                            ? "text-snow"
                            : "text-fog"
                        }`}
                      >
                        {choice.text}
                      </span>
                      <input
                        type="radio"
                        name={question.id}
                        value={choice.id}
                        checked={answers[question.id] === choice.id}
                        onChange={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: choice.id,
                          }))
                        }
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              )}

              {/* Written */}
              {question.type === "WRITTEN" && (
                <div className="ml-12">
                  <input
                    type="text"
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [question.id]: e.target.value,
                      }))
                    }
                    placeholder="Type your answer..."
                    className="w-full bg-dusk border border-steel/60 rounded-xl px-4 py-3.5 text-snow placeholder-smoke focus:border-white/30 focus:outline-none transition-colors"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="mt-12 pb-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2.5 bg-white text-black font-heading font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-white/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
          {answeredCount < totalCount && !submitting && (
            <p className="text-center text-smoke text-sm mt-3">
              You have {totalCount - answeredCount} unanswered question
              {totalCount - answeredCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
