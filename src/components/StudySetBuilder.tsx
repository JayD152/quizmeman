"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  Shuffle,
  CheckCircle2,
  PenLine,
  Layers,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react"

type QuestionType = "MULTIPLE_CHOICE" | "WRITTEN"
type SetType = "MULTIPLE_CHOICE" | "WRITTEN" | "MIXED"

interface Choice {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  type: QuestionType
  text: string
  choices: Choice[]
  correctAnswer: string
}

function makeChoice(): Choice {
  return { id: crypto.randomUUID(), text: "", isCorrect: false }
}

function makeMCQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    type: "MULTIPLE_CHOICE",
    text: "",
    choices: [makeChoice(), makeChoice(), makeChoice(), makeChoice()],
    correctAnswer: "",
  }
}

function makeWrittenQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    type: "WRITTEN",
    text: "",
    choices: [],
    correctAnswer: "",
  }
}

export default function StudySetBuilder() {
  const router = useRouter()
  const [step, setStep] = useState<"type" | "build">("type")
  const [setType, setSetType] = useState<SetType>("MULTIPLE_CHOICE")
  const [title, setTitle] = useState("")
  const [timeLimitMin, setTimeLimitMin] = useState("")
  const [shuffle, setShuffle] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectType = (type: SetType) => {
    setSetType(type)
    setStep("build")
    if (type === "MULTIPLE_CHOICE") {
      setQuestions([makeMCQuestion()])
    } else if (type === "WRITTEN") {
      setQuestions([makeWrittenQuestion()])
    } else {
      setQuestions([])
    }
  }

  const addQuestion = (type: QuestionType) => {
    setQuestions((prev) => [
      ...prev,
      type === "MULTIPLE_CHOICE" ? makeMCQuestion() : makeWrittenQuestion(),
    ])
  }

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const updateQuestionText = (id: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, text } : q))
    )
  }

  const updateCorrectAnswer = (id: string, correctAnswer: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, correctAnswer } : q))
    )
  }

  const setCorrectChoice = (questionId: string, choiceId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              choices: q.choices.map((c) => ({
                ...c,
                isCorrect: c.id === choiceId,
              })),
            }
          : q
      )
    )
  }

  const updateChoiceText = (
    questionId: string,
    choiceId: string,
    text: string
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              choices: q.choices.map((c) =>
                c.id === choiceId ? { ...c, text } : c
              ),
            }
          : q
      )
    )
  }

  const removeChoice = (questionId: string, choiceId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, choices: q.choices.filter((c) => c.id !== choiceId) }
          : q
      )
    )
  }

  const addChoices = (questionId: string, count: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q
        const remaining = 6 - q.choices.length
        const toAdd = Math.min(count, remaining)
        const newChoices = Array.from({ length: toAdd }, () => makeChoice())
        return { ...q, choices: [...q.choices, ...newChoices] }
      })
    )
  }

  const handleSave = async () => {
    setError(null)

    if (!title.trim()) {
      setError("Please enter a title for your study set")
      return
    }

    if (questions.length === 0) {
      setError("Add at least one question")
      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) {
        setError(`Question ${i + 1} is missing text`)
        return
      }
      if (q.type === "MULTIPLE_CHOICE") {
        if (q.choices.length < 2) {
          setError(`Question ${i + 1} needs at least 2 choices`)
          return
        }
        if (q.choices.some((c) => !c.text.trim())) {
          setError(`Question ${i + 1} has empty answer choices`)
          return
        }
        if (!q.choices.some((c) => c.isCorrect)) {
          setError(`Question ${i + 1} needs a correct answer selected`)
          return
        }
      }
      if (q.type === "WRITTEN" && !q.correctAnswer.trim()) {
        setError(`Question ${i + 1} needs a correct answer`)
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch("/api/study-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type: setType,
          timeLimit: timeLimitMin ? parseInt(timeLimitMin) * 60 : null,
          shuffle,
          questions: questions.map((q, i) => ({
            text: q.text.trim(),
            type: q.type,
            order: i,
            choices:
              q.type === "MULTIPLE_CHOICE"
                ? q.choices.map((c, ci) => ({
                    text: c.text.trim(),
                    isCorrect: c.isCorrect,
                    order: ci,
                  }))
                : undefined,
            correctAnswer:
              q.type === "WRITTEN" ? q.correctAnswer.trim() : undefined,
          })),
        }),
      })

      if (!res.ok) throw new Error("Failed to save")
      router.push("/")
    } catch {
      setError("Failed to save study set. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // ─── Type Selection Step ───
  if (step === "type") {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 animate-fade-in">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-fog hover:text-snow transition-colors mb-10 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-snow tracking-tight mb-3">
          Create a New Study Set
        </h1>
        <p className="text-fog text-lg mb-12">
          Choose the type of questions for your study set.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Multiple Choice */}
          <button
            onClick={() => selectType("MULTIPLE_CHOICE")}
            className="group bg-night border border-steel/50 rounded-2xl p-8 text-left hover:border-white/30 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:bg-white/10 transition-colors">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-heading text-xl font-bold text-snow mb-2">
              Multiple Choice
            </h3>
            <p className="text-fog text-sm leading-relaxed">
              Questions with selectable answer choices. Great for quick review
              and memorization.
            </p>
          </button>

          {/* Written */}
          <button
            onClick={() => selectType("WRITTEN")}
            className="group bg-night border border-steel/50 rounded-2xl p-8 text-left hover:border-white/30 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:bg-white/10 transition-colors">
              <PenLine className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-heading text-xl font-bold text-snow mb-2">
              Written
            </h3>
            <p className="text-fog text-sm leading-relaxed">
              Type your answers from memory. Perfect for deep recall and essay
              practice.
            </p>
          </button>

          {/* Mixed */}
          <button
            onClick={() => selectType("MIXED")}
            className="group bg-night border border-steel/50 rounded-2xl p-8 text-left hover:border-white/30 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:bg-white/10 transition-colors">
              <Layers className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-heading text-xl font-bold text-snow mb-2">
              Mixed
            </h3>
            <p className="text-fog text-sm leading-relaxed">
              Combine both question types for a well-rounded study experience.
            </p>
          </button>
        </div>
      </div>
    )
  }

  // ─── Build Step ───
  const accentColor = "white"

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => setStep("type")}
        className="flex items-center gap-2 text-fog hover:text-snow transition-colors mb-8 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Change type
      </button>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-3.5 mb-8 animate-scale-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400/60 hover:text-red-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Name your study set..."
        className="w-full bg-transparent border-none text-3xl sm:text-4xl font-heading font-bold text-snow placeholder-steel focus:outline-none mb-8"
      />

      {/* Settings Row */}
      <div className="flex flex-wrap items-center gap-4 mb-10 pb-10 border-b border-steel/30">
        {/* Timer */}
        <div className="flex items-center gap-2.5 bg-night border border-steel/50 rounded-xl px-4 py-2.5">
          <Clock className="w-4 h-4 text-smoke" />
          <input
            type="number"
            value={timeLimitMin}
            onChange={(e) => setTimeLimitMin(e.target.value)}
            placeholder="No limit"
            min="1"
            max="180"
            className="w-20 bg-transparent text-snow placeholder-smoke text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-smoke text-sm">min</span>
        </div>

        {/* Shuffle Toggle */}
        <button
          onClick={() => setShuffle(!shuffle)}
          className={`flex items-center gap-2.5 border rounded-xl px-4 py-2.5 transition-all duration-200 cursor-pointer ${
            shuffle
              ? "bg-white/10 border-white/30 text-white"
              : "bg-night border-steel/50 text-smoke hover:text-fog"
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span className="text-sm font-medium">Shuffle</span>
        </button>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, index) => (
          <div
            key={q.id}
            className="bg-night border border-steel/50 rounded-2xl p-6 animate-scale-in"
          >
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span
                  className={`font-heading font-bold text-sm text-white`}
                >
                  Q{index + 1}
                </span>
                {setType === "MIXED" && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-white/5 text-fog`}
                  >
                    {q.type === "MULTIPLE_CHOICE"
                      ? "Multiple Choice"
                      : "Written"}
                  </span>
                )}
              </div>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="text-smoke hover:text-white transition-colors p-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Question Text */}
            <input
              type="text"
              value={q.text}
              onChange={(e) => updateQuestionText(q.id, e.target.value)}
              placeholder="Enter your question..."
              className="w-full bg-dusk border border-steel/60 rounded-xl px-4 py-3 text-snow placeholder-smoke focus:border-white/30 focus:outline-none transition-colors mb-4"
            />

            {/* Multiple Choice Options */}
            {q.type === "MULTIPLE_CHOICE" && (
              <>
                <div className="space-y-2.5">
                  {q.choices.map((choice, ci) => (
                    <div key={choice.id} className="flex items-center gap-3">
                      <button
                        onClick={() => setCorrectChoice(q.id, choice.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer ${
                          choice.isCorrect
                            ? "border-white bg-white scale-110"
                            : "border-steel hover:border-fog"
                        }`}
                      >
                        {choice.isCorrect && (
                          <Check className="w-3.5 h-3.5 text-black" />
                        )}
                      </button>
                      <input
                        type="text"
                        value={choice.text}
                        onChange={(e) =>
                          updateChoiceText(q.id, choice.id, e.target.value)
                        }
                        placeholder={`Answer choice ${ci + 1}`}
                        className="flex-1 bg-dusk border border-steel/60 rounded-lg px-4 py-2.5 text-snow text-sm placeholder-smoke focus:border-white/30 focus:outline-none transition-colors"
                      />
                      {q.choices.length > 2 && (
                        <button
                          onClick={() => removeChoice(q.id, choice.id)}
                          className="text-smoke hover:text-white transition-colors p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Choices Buttons */}
                {q.choices.length < 6 && (
                  <div className="flex gap-2 mt-3">
                    {q.choices.length + 2 <= 6 && (
                      <button
                        onClick={() => addChoices(q.id, 2)}
                        className="text-xs text-fog hover:text-white border border-steel/40 rounded-lg px-3 py-1.5 hover:border-white/20 transition-colors cursor-pointer"
                      >
                        +2 choices
                      </button>
                    )}
                    {q.choices.length + 4 <= 6 && (
                      <button
                        onClick={() => addChoices(q.id, 4)}
                        className="text-xs text-fog hover:text-white border border-steel/40 rounded-lg px-3 py-1.5 hover:border-white/20 transition-colors cursor-pointer"
                      >
                        +4 choices
                      </button>
                    )}
                    {q.choices.length < 6 && (
                      <button
                        onClick={() => addChoices(q.id, 1)}
                        className="text-xs text-fog hover:text-white border border-steel/40 rounded-lg px-3 py-1.5 hover:border-white/20 transition-colors cursor-pointer"
                      >
                        +1 choice
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Written Answer */}
            {q.type === "WRITTEN" && (
              <div>
                <label className="text-xs text-fog mb-1.5 block font-medium uppercase tracking-wider">
                  Correct Answer
                </label>
                <input
                  type="text"
                  value={q.correctAnswer}
                  onChange={(e) => updateCorrectAnswer(q.id, e.target.value)}
                  placeholder="Enter the correct answer..."
                  className="w-full bg-dusk border border-steel/60 rounded-xl px-4 py-3 text-snow placeholder-smoke focus:border-white/30 focus:outline-none transition-colors"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Question Button(s) */}
      <div className="mt-6 flex justify-center gap-3">
        {setType === "MIXED" ? (
          <>
            <button
              onClick={() => addQuestion("MULTIPLE_CHOICE")}
              className="flex items-center gap-2 bg-night border border-steel/50 text-fog hover:text-white hover:border-white/20 rounded-xl px-5 py-3 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">
                Add Multiple Choice
              </span>
            </button>
            <button
              onClick={() => addQuestion("WRITTEN")}
              className="flex items-center gap-2 bg-night border border-steel/50 text-fog hover:text-white hover:border-white/20 rounded-xl px-5 py-3 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">Add Written</span>
            </button>
          </>
        ) : (
          <button
            onClick={() =>
              addQuestion(
                setType === "MULTIPLE_CHOICE"
                  ? "MULTIPLE_CHOICE"
                  : "WRITTEN"
              )
            }
            className="flex items-center gap-2 bg-night border border-dashed border-steel text-fog hover:text-white hover:border-white/20 rounded-xl px-6 py-3.5 transition-all duration-200 w-full justify-center cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Add Question</span>
          </button>
        )}
      </div>

      {/* Save */}
      <div className="mt-12 pt-8 border-t border-steel/30">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2.5 bg-white text-black font-heading font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-white/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? "Saving..." : "Save Study Set"}
        </button>
      </div>
    </div>
  )
}
