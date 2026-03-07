import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const studySet = await prisma.studySet.findUnique({
    where: { id, userId: session.user.id },
    include: {
      questions: {
        include: { choices: true },
        orderBy: { order: "asc" },
      },
    },
  })

  if (!studySet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (studySet.type === "FLASHCARD") {
    return NextResponse.json(
      { error: "Flashcard sets are study-only and do not support quiz attempts." },
      { status: 400 }
    )
  }

  let totalCorrect = 0
  const answerData: {
    questionId: string
    selectedChoiceId: string | null
    writtenAnswer: string | null
    isCorrect: boolean
  }[] = []

  for (const ans of body.answers as { questionId: string; selectedChoiceId?: string; writtenAnswer?: string }[]) {
    const question = studySet.questions.find(
      (q: { id: string }) => q.id === ans.questionId
    )
    if (!question) continue

    let isCorrect = false

    if (question.type === "MULTIPLE_CHOICE") {
      const correctChoice = question.choices.find((c: { isCorrect: boolean }) => c.isCorrect)
      isCorrect = ans.selectedChoiceId === correctChoice?.id
    } else if (question.type === "WRITTEN") {
      isCorrect =
        (ans.writtenAnswer || "").trim().toLowerCase() ===
        (question.correctAnswer || "").trim().toLowerCase()
    } else if (question.type === "TRUE_FALSE") {
      isCorrect =
        (ans.writtenAnswer || "").trim().toUpperCase() ===
        (question.correctAnswer || "").trim().toUpperCase()
    } else {
      continue
    }

    if (isCorrect) totalCorrect++

    answerData.push({
      questionId: ans.questionId,
      selectedChoiceId: ans.selectedChoiceId || null,
      writtenAnswer: ans.writtenAnswer || null,
      isCorrect,
    })
  }

  const totalQuestions = studySet.questions.length
  const score =
    totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

  const attempt = await prisma.attempt.create({
    data: {
      score,
      totalCorrect,
      totalQuestions,
      timeTaken: body.timeTaken || null,
      studySetId: id,
      userId: session.user.id,
      answers: {
        create: answerData,
      },
    },
  })

  return NextResponse.json({ attemptId: attempt.id }, { status: 201 })
}
