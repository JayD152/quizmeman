import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const choiceSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
  order: z.number(),
})

const questionSchema = z.object({
  text: z.string().min(1),
  type: z.enum(["MULTIPLE_CHOICE", "WRITTEN"]),
  order: z.number(),
  choices: z.array(choiceSchema).optional(),
  correctAnswer: z.string().optional(),
})

const createSetSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["MULTIPLE_CHOICE", "WRITTEN", "MIXED"]),
  timeLimit: z.number().positive().nullable(),
  shuffle: z.boolean(),
  questions: z.array(questionSchema).min(1),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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

  const sets = studySets.map((s: typeof studySets[number]) => ({
    id: s.id,
    title: s.title,
    type: s.type,
    questionCount: s._count.questions,
    lastScore: s.attempts[0]?.score ?? null,
    avgScore:
      s.attempts.length > 0
        ? s.attempts.reduce((sum: number, a: { score: number }) => sum + a.score, 0) / s.attempts.length
        : null,
    attemptCount: s.attempts.length,
    createdAt: s.createdAt,
  }))

  return NextResponse.json(sets)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createSetSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.issues },
      { status: 400 }
    )
  }

  const { title, type, timeLimit, shuffle, questions } = parsed.data

  const studySet = await prisma.studySet.create({
    data: {
      title,
      type,
      timeLimit,
      shuffle,
      userId: session.user.id,
      questions: {
        create: questions.map((q) => ({
          text: q.text,
          type: q.type,
          order: q.order,
          correctAnswer: q.type === "WRITTEN" ? q.correctAnswer : null,
          choices:
            q.type === "MULTIPLE_CHOICE" && q.choices
              ? {
                  create: q.choices.map((c) => ({
                    text: c.text,
                    isCorrect: c.isCorrect,
                    order: c.order,
                  })),
                }
              : undefined,
        })),
      },
    },
  })

  return NextResponse.json({ id: studySet.id }, { status: 201 })
}
