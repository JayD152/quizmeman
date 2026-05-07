import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const sharedSet = await prisma.studySet.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: {
          choices: { orderBy: { order: "asc" } },
        },
      },
    },
  })

  if (!sharedSet) {
    return NextResponse.json({ error: "Shared set not found" }, { status: 404 })
  }

  const importedSet = await prisma.studySet.create({
    data: {
      title: sharedSet.title,
      type: sharedSet.type,
      timeLimit: sharedSet.timeLimit,
      shuffle: sharedSet.shuffle,
      userId: session.user.id,
      questions: {
        create: sharedSet.questions.map((question) => ({
          text: question.text,
          imageUrl: question.imageUrl,
          type: question.type,
          order: question.order,
          correctAnswer: question.correctAnswer,
          choices:
            question.choices.length > 0
              ? {
                  create: question.choices.map((choice) => ({
                    text: choice.text,
                    isCorrect: choice.isCorrect,
                    order: choice.order,
                  })),
                }
              : undefined,
        })),
      },
    },
  })

  return NextResponse.json({ id: importedSet.id }, { status: 201 })
}