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
  ToggleLeft,
  BookOpenText,
  GitCompareArrows,
  Image as ImageIcon,
} from "lucide-react"

type QuestionType = "MULTIPLE_CHOICE" | "WRITTEN" | "TRUE_FALSE" | "MATCHING" | "FLASHCARD"
type SetType = "MULTIPLE_CHOICE" | "WRITTEN" | "TRUE_FALSE" | "MATCHING" | "MIXED" | "FLASHCARD"

interface Choice {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  type: QuestionType
  text: string
  imageUrl: string
  choices: Choice[]
  correctAnswer: string
}

export interface StudySetBuilderInitialData {
  id: string
  title: string
  type: SetType
  timeLimit: number | null
  shuffle: boolean
  questions: {
    id: string
    type: QuestionType
    text: string
    imageUrl: string | null
    correctAnswer: string | null
    choices: {
      id: string
      text: string
      isCorrect: boolean
    }[]
  }[]
}

interface StudySetBuilderProps {
  initialData?: StudySetBuilderInitialData
}

function makeChoice(): Choice {
  return { id: crypto.randomUUID(), text: "", isCorrect: false }
}

function makeMCQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    type: "MULTIPLE_CHOICE",
    text: "",
    imageUrl: "",
    choices: [makeChoice(), makeChoice(), makeChoice(), makeChoice()],
    correctAnswer: "",
  }
}

function makeWrittenQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    type: "WRITTEN",
    text: "",
    imageUrl: "",
    choices: [],
    correctAnswer: "",
  }
}

function makeTrueFalseQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    type: "TRUE_FALSE",
    text: "",
    imageUrl: "",
    choices: [],
    correctAnswer: "TRUE",
  }
}

function makeMatchingQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    type: "MATCHING",
    text: "",
    imageUrl: "",
    choices: [],
    correctAnswer: "",
  }
}

function makeFlashcard(): Question {
  return {
    id: crypto.randomUUID(),
    type: "FLASHCARD",
    text: "",
    imageUrl: "",
    choices: [],
    correctAnswer: "",
  }
}

function makeQuestionForType(type: QuestionType): Question {
  if (type === "MULTIPLE_CHOICE") return makeMCQuestion()
  if (type === "WRITTEN") return makeWrittenQuestion()
  if (type === "TRUE_FALSE") return makeTrueFalseQuestion()
  if (type === "MATCHING") return makeMatchingQuestion()
  return makeFlashcard()
}

function questionTypeLabel(type: QuestionType): string {
  if (type === "MULTIPLE_CHOICE") return "Multiple Choice"
  if (type === "WRITTEN") return "Written"
  if (type === "TRUE_FALSE") return "True / False"
  if (type === "MATCHING") return "Matching"
  return "Flashcard"
}

function isValidImageUrl(url: string): boolean {
  if (!url.trim()) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function mapInitialQuestions(initialData: StudySetBuilderInitialData): Question[] {
  return initialData.questions.map((q) => ({
    id: q.id,
    type: q.type,
    text: q.text,
    imageUrl: q.imageUrl || "",
    choices: q.choices.map((choice) => ({
      id: choice.id,
      text: choice.text,
      isCorrect: choice.isCorrect,
    })),
    correctAnswer: q.correctAnswer || (q.type === "TRUE_FALSE" ? "TRUE" : ""),
  }))
}

export default function StudySetBuilder({ initialData }: StudySetBuilderProps) {
  const router = useRouter()
  const isEditing = Boolean(initialData)

  const [step, setStep] = useState<"type" | "build">(isEditing ? "build" : "type")
  const [setType, setSetType] = useState<SetType>(initialData?.type ?? "MULTIPLE_CHOICE")
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [timeLimitMin, setTimeLimitMin] = useState(
    initialData?.timeLimit ? Math.max(1, Math.round(initialData.timeLimit / 60)).toString() : ""
  )
  const [shuffle, setShuffle] = useState(initialData?.shuffle ?? false)
  const [questions, setQuestions] = useState<Question[]>(
    initialData ? mapInitialQuestions(initialData) : []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectType = (type: SetType) => {
    setSetType(type)
    setStep("build")
    if (type === "MULTIPLE_CHOICE") {
      setQuestions([makeMCQuestion()])
    } else if (type === "WRITTEN") {
      setQuestions([makeWrittenQuestion()])
    } else if (type === "TRUE_FALSE") {
      setQuestions([makeTrueFalseQuestion()])
    } else if (type === "MATCHING") {
      setQuestions([makeMatchingQuestion()])
    } else if (type === "FLASHCARD") {
      setQuestions([makeFlashcard()])
    } else {
      setQuestions([])
    }
  }

  const addQuestion = (type: QuestionType) => {
    setQuestions((prev) => [...prev, makeQuestionForType(type)])
  }

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const updateQuestionText = (id: string, text: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, text } : q)))
  }

  const updateQuestionImageUrl = (id: string, imageUrl: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, imageUrl } : q)))
  }

  const updateCorrectAnswer = (id: string, correctAnswer: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, correctAnswer } : q))
    )
  }

  const setTrueFalseAnswer = (id: string, answer: "TRUE" | "FALSE") => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, correctAnswer: answer } : q))
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

  const updateChoiceText = (questionId: string, choiceId: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              choices: q.choices.map((c) => (c.id === choiceId ? { ...c, text } : c)),
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
      setError(setType === "FLASHCARD" ? "Add at least one flashcard" : "Add at least one question")
      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) {
        setError(
          setType === "FLASHCARD"
            ? `Card ${i + 1} is missing a term`
            : `Question ${i + 1} is missing text`
        )
        return
      }

      if (!isValidImageUrl(q.imageUrl)) {
        setError(`Question ${i + 1} has an invalid image URL`)
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
      if (q.type === "TRUE_FALSE" && !["TRUE", "FALSE"].includes(q.correctAnswer.toUpperCase())) {
        setError(`Question ${i + 1} needs TRUE or FALSE as the answer`)
        return
      }
      if (q.type === "MATCHING" && !q.correctAnswer.trim()) {
        setError(`Question ${i + 1} needs a matching right-side term`)
        return
      }
      if (q.type === "FLASHCARD" && !q.correctAnswer.trim()) {
        setError(`Card ${i + 1} is missing a definition`)
        return
      }
    }

    setSaving(true)
    try {
      const endpoint = isEditing ? `/api/study-sets/${initialData?.id}` : "/api/study-sets"
      const method = isEditing ? "PATCH" : "POST"

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type: setType,
          timeLimit: setType === "FLASHCARD" ? null : timeLimitMin ? parseInt(timeLimitMin) * 60 : null,
          shuffle,
          questions: questions.map((q, i) => ({
            text: q.text.trim(),
            imageUrl: q.imageUrl.trim(),
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
              q.type === "WRITTEN" || q.type === "MATCHING" || q.type === "FLASHCARD"
                ? q.correctAnswer.trim()
                : q.type === "TRUE_FALSE"
                ? q.correctAnswer.trim().toUpperCase()
                : undefined,
          })),
        }),
      })

      if (!res.ok) throw new Error("Failed to save")
      router.push("/")
      router.refresh()
    } catch {
      setError(isEditing ? "Failed to update study set. Please try again." : "Failed to save study set. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (step === "type") {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 animate-fade-in">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-fog hover:text-snow transition-colors mb-10 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-snow tracking-tight mb-3">
          {isEditing ? "Change Study Set Type" : "Create a New Study Set"}
        </h1>
        <p className="text-fog text-lg mb-12">Choose the study mode you want to build.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          <button
            onClick={() => selectType("MULTIPLE_CHOICE")}
            className="group bg-night border border-steel/50 rounded-2xl p-6 text-left hover:border-white/30 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-heading text-lg font-bold text-snow mb-2">Multiple Choice</h3>
            <p className="text-fog text-sm leading-relaxed">Selectable options with one correct answer.</p>
          </button>

          <button
            onClick={() => selectType("WRITTEN")}
            className="group bg-night border border-steel/50 rounded-2xl p-6 text-left hover:border-white/30 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
              <PenLine className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-heading text-lg font-bold text-snow mb-2">Written</h3>
            <p className="text-fog text-sm leading-relaxed">Type the answer from memory with free-form text.</p>
          </button>

          <button
            onClick={() => selectType("TRUE_FALSE")}
            className="group bg-night border border-steel/50 rounded-2xl p-6 text-left hover:border-white/30 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
              <ToggleLeft className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-heading text-lg font-bold text-snow mb-2">True / False</h3>
            <p className="text-fog text-sm leading-relaxed">Fast binary checks for factual recall.</p>
          </button>

          <button
            onClick={() => selectType("MATCHING")}
            className="group bg-night border border-steel/50 rounded-2xl p-6 text-left hover:border-white/30 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
              <GitCompareArrows className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-heading text-lg font-bold text-snow mb-2">Matching</h3>
            <p className="text-fog text-sm leading-relaxed">Pair each left term with the correct right term.</p>
          </button>

          <button
            onClick={() => selectType("MIXED")}
            className="group bg-night border border-steel/50 rounded-2xl p-6 text-left hover:border-white/30 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-heading text-lg font-bold text-snow mb-2">Mixed Quiz</h3>
            <p className="text-fog text-sm leading-relaxed">Blend multiple choice, written, true/false, and matching.</p>
          </button>

          <button
            onClick={() => selectType("FLASHCARD")}
            className="group bg-night border border-steel/50 rounded-2xl p-6 text-left hover:border-white/30 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
              <BookOpenText className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-heading text-lg font-bold text-snow mb-2">Flashcards</h3>
            <p className="text-fog text-sm leading-relaxed">Build term-definition vocab sets for card review mode.</p>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 animate-fade-in">
      <button
        onClick={() => setStep("type")}
        className="flex items-center gap-2 text-fog hover:text-snow transition-colors mb-8 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Change type
      </button>

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

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={setType === "FLASHCARD" ? "Name your flashcard set..." : "Name your study set..."}
        className="w-full bg-transparent border-none text-3xl sm:text-4xl font-heading font-bold text-snow placeholder-steel focus:outline-none mb-8"
      />

      <div className="flex flex-wrap items-center gap-4 mb-10 pb-10 border-b border-steel/30">
        {setType !== "FLASHCARD" && (
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
        )}

        <button
          onClick={() => setShuffle(!shuffle)}
          className={`flex items-center gap-2.5 border rounded-xl px-4 py-2.5 transition-all duration-200 cursor-pointer ${
            shuffle
              ? "bg-white/10 border-white/30 text-white"
              : "bg-night border-steel/50 text-smoke hover:text-fog"
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span className="text-sm font-medium">{setType === "FLASHCARD" ? "Shuffle cards" : "Shuffle"}</span>
        </button>
      </div>

      <div className="space-y-6">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-night border border-steel/50 rounded-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="font-heading font-bold text-sm text-white">
                  {setType === "FLASHCARD" ? `Card ${index + 1}` : `Q${index + 1}`}
                </span>
                {(setType === "MIXED" || setType === "FLASHCARD") && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-white/5 text-fog">
                    {questionTypeLabel(q.type)}
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

            <input
              type="text"
              value={q.text}
              onChange={(e) => updateQuestionText(q.id, e.target.value)}
              placeholder={q.type === "FLASHCARD" ? "Term" : q.type === "MATCHING" ? "Left-side term" : "Enter your question..."}
              className="w-full bg-dusk border border-steel/60 rounded-xl px-4 py-3 text-snow placeholder-smoke focus:border-white/30 focus:outline-none transition-colors mb-3"
            />

            <div className="relative mb-4">
              <ImageIcon className="w-4 h-4 text-smoke absolute left-3 top-3.5" />
              <input
                type="url"
                value={q.imageUrl}
                onChange={(e) => updateQuestionImageUrl(q.id, e.target.value)}
                placeholder="Image URL (optional)"
                className="w-full pl-9 bg-dusk border border-steel/60 rounded-xl px-4 py-3 text-snow placeholder-smoke focus:border-white/30 focus:outline-none transition-colors"
              />
            </div>

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
                        {choice.isCorrect && <Check className="w-3.5 h-3.5 text-black" />}
                      </button>
                      <input
                        type="text"
                        value={choice.text}
                        onChange={(e) => updateChoiceText(q.id, choice.id, e.target.value)}
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
                    <button
                      onClick={() => addChoices(q.id, 1)}
                      className="text-xs text-fog hover:text-white border border-steel/40 rounded-lg px-3 py-1.5 hover:border-white/20 transition-colors cursor-pointer"
                    >
                      +1 choice
                    </button>
                  </div>
                )}
              </>
            )}

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

            {q.type === "TRUE_FALSE" && (
              <div>
                <label className="text-xs text-fog mb-2 block font-medium uppercase tracking-wider">
                  Correct Answer
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTrueFalseAnswer(q.id, "TRUE")}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold border transition-colors cursor-pointer ${
                      q.correctAnswer.toUpperCase() === "TRUE"
                        ? "bg-white text-black border-white"
                        : "bg-dusk text-fog border-steel/50 hover:text-white"
                    }`}
                  >
                    True
                  </button>
                  <button
                    onClick={() => setTrueFalseAnswer(q.id, "FALSE")}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold border transition-colors cursor-pointer ${
                      q.correctAnswer.toUpperCase() === "FALSE"
                        ? "bg-white text-black border-white"
                        : "bg-dusk text-fog border-steel/50 hover:text-white"
                    }`}
                  >
                    False
                  </button>
                </div>
              </div>
            )}

            {q.type === "FLASHCARD" && (
              <div>
                <label className="text-xs text-fog mb-1.5 block font-medium uppercase tracking-wider">
                  Definition
                </label>
                <textarea
                  value={q.correctAnswer}
                  onChange={(e) => updateCorrectAnswer(q.id, e.target.value)}
                  placeholder="Definition / explanation"
                  rows={4}
                  className="w-full bg-dusk border border-steel/60 rounded-xl px-4 py-3 text-snow placeholder-smoke focus:border-white/30 focus:outline-none transition-colors resize-y"
                />
              </div>
            )}

            {q.type === "MATCHING" && (
              <div>
                <label className="text-xs text-fog mb-1.5 block font-medium uppercase tracking-wider">
                  Matching Right Term
                </label>
                <input
                  type="text"
                  value={q.correctAnswer}
                  onChange={(e) => updateCorrectAnswer(q.id, e.target.value)}
                  placeholder="Right-side matching term"
                  className="w-full bg-dusk border border-steel/60 rounded-xl px-4 py-3 text-snow placeholder-smoke focus:border-white/30 focus:outline-none transition-colors"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {setType === "MIXED" ? (
          <>
            <button
              onClick={() => addQuestion("MULTIPLE_CHOICE")}
              className="flex items-center gap-2 bg-night border border-steel/50 text-fog hover:text-white hover:border-white/20 rounded-xl px-5 py-3 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">Add Multiple Choice</span>
            </button>
            <button
              onClick={() => addQuestion("WRITTEN")}
              className="flex items-center gap-2 bg-night border border-steel/50 text-fog hover:text-white hover:border-white/20 rounded-xl px-5 py-3 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">Add Written</span>
            </button>
            <button
              onClick={() => addQuestion("TRUE_FALSE")}
              className="flex items-center gap-2 bg-night border border-steel/50 text-fog hover:text-white hover:border-white/20 rounded-xl px-5 py-3 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">Add True / False</span>
            </button>
            <button
              onClick={() => addQuestion("MATCHING")}
              className="flex items-center gap-2 bg-night border border-steel/50 text-fog hover:text-white hover:border-white/20 rounded-xl px-5 py-3 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">Add Matching</span>
            </button>
          </>
        ) : (
          <button
            onClick={() =>
              addQuestion(
                setType === "MULTIPLE_CHOICE"
                  ? "MULTIPLE_CHOICE"
                  : setType === "WRITTEN"
                  ? "WRITTEN"
                  : setType === "TRUE_FALSE"
                  ? "TRUE_FALSE"
                  : setType === "MATCHING"
                  ? "MATCHING"
                  : "FLASHCARD"
              )
            }
            className="flex items-center gap-2 bg-night border border-dashed border-steel text-fog hover:text-white hover:border-white/20 rounded-xl px-6 py-3.5 transition-all duration-200 w-full justify-center cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">{setType === "FLASHCARD" ? "Add Card" : "Add Question"}</span>
          </button>
        )}
      </div>

      <div className="mt-12 pt-8 border-t border-steel/30">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2.5 bg-white text-black font-heading font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-white/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving
            ? isEditing
              ? "Updating..."
              : "Saving..."
            : isEditing
            ? "Update Study Set"
            : setType === "FLASHCARD"
            ? "Save Flashcard Set"
            : "Save Study Set"}
        </button>
      </div>
    </div>
  )
}
