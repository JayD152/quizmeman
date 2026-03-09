import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { extractMatchingPairs } from "@/lib/matching"
import TakeQuiz from "@/components/TakeQuiz"
import type { QuizData } from "@/types"

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default async function TakePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/signin")

  const { id } = await params

  const studySet = await prisma.studySet.findUnique({
    where: { id, userId: session.user.id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: {
          choices: { orderBy: { order: "asc" } },
        },
      },
    },
  })

  if (!studySet) redirect("/")
  if (studySet.type === "FLASHCARD") redirect(`/sets/${id}/flashcards`)

  type PrismaQuestion = (typeof studySet.questions)[number]
  type PrismaChoice = PrismaQuestion["choices"][number]

  // Strip correct answers (don't send to client)
  let questions = studySet.questions.map((q: PrismaQuestion) => {
    const question = q as PrismaQuestion & { imageUrl?: string | null }
    const matchingPairs =
      q.type === "MATCHING"
        ? extractMatchingPairs({
            text: q.text,
            correctAnswer: q.correctAnswer,
            choices: q.choices.map((c: PrismaChoice) => ({
              id: c.id,
              text: c.text,
              order: c.order,
            })),
          })
        : undefined

    return {
    id: q.id,
    text: q.text,
    imageUrl: question.imageUrl || undefined,
    type: q.type as "MULTIPLE_CHOICE" | "WRITTEN" | "TRUE_FALSE" | "MATCHING",
    order: q.order,
    choices: q.choices.map((c: PrismaChoice) => ({
      id: c.id,
      text: c.text,
      order: c.order,
    })),
    matchingPairs,
    }
  })

  // Shuffle if enabled
  if (studySet.shuffle) {
    questions = shuffleArray(questions)
    questions = questions.map((q: typeof questions[number]) => ({
      ...q,
      choices: q.type === "MULTIPLE_CHOICE" ? shuffleArray(q.choices) : q.choices,
    }))
  }

  const quizData: QuizData = {
    id: studySet.id,
    title: studySet.title,
    timeLimit: studySet.timeLimit,
    shuffle: studySet.shuffle,
    questions,
  }

  return <TakeQuiz studySet={quizData} />
}
