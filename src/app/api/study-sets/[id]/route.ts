import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { isValidMatchingPayload } from "@/lib/matching"
import { z } from "zod"

const optionalImageUrlSchema = z.union([z.string().url(), z.literal(""), z.undefined()])

const choiceSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
  order: z.number(),
})

const questionSchema = z.object({
  text: z.string().min(1),
  imageUrl: optionalImageUrlSchema,
  type: z.enum(["MULTIPLE_CHOICE", "WRITTEN", "TRUE_FALSE", "MATCHING", "FLASHCARD"]),
  order: z.number(),
  choices: z.array(choiceSchema).optional(),
  correctAnswer: z.string().optional(),
})

const updateSetSchema = z
  .object({
    title: z.string().min(1).max(200),
    type: z.enum(["MULTIPLE_CHOICE", "WRITTEN", "TRUE_FALSE", "MATCHING", "MIXED", "FLASHCARD"]),
    timeLimit: z.number().positive().nullable(),
    shuffle: z.boolean(),
    questions: z.array(questionSchema).min(1),
  })
  .superRefine((data, ctx) => {
    for (let i = 0; i < data.questions.length; i++) {
      const question = data.questions[i]

      if (question.type === "MULTIPLE_CHOICE") {
        if (!question.choices || question.choices.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["questions", i, "choices"],
            message: "Multiple choice questions need at least 2 choices.",
          })
        }
        if (!question.choices?.some((choice) => choice.isCorrect)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["questions", i, "choices"],
            message: "Multiple choice questions need a correct choice.",
          })
        }
      }

      if (question.type === "WRITTEN" || question.type === "FLASHCARD") {
        if (!question.correctAnswer?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["questions", i, "correctAnswer"],
            message: "Written and flashcard questions require a correct answer.",
          })
        }
      }

      if (question.type === "MATCHING") {
        const choicesCount = question.choices?.length || 0
        const hasLegacyShape = choicesCount === 0 && Boolean(question.correctAnswer?.trim())

        if (hasLegacyShape) continue

        if (!question.choices || choicesCount < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["questions", i, "choices"],
            message: "Matching questions need at least 2 left-side terms.",
          })
        }

        if (!isValidMatchingPayload(question.correctAnswer, choicesCount)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["questions", i, "correctAnswer"],
            message: "Matching questions require a right-side term for every left-side term.",
          })
        }
      }

      if (question.type === "TRUE_FALSE") {
        if (!["TRUE", "FALSE"].includes((question.correctAnswer || "").toUpperCase())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["questions", i, "correctAnswer"],
            message: "True/False questions must have TRUE or FALSE as the correct answer.",
          })
        }
      }
    }

    if (data.type === "MIXED") {
      if (data.questions.some((q) => q.type === "FLASHCARD")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questions"],
          message: "Flashcard cards cannot be part of mixed quiz sets.",
        })
      }
    } else if (data.questions.some((q) => q.type !== data.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questions"],
        message: "All questions must match the selected set type.",
      })
    }

    if (data.type === "FLASHCARD" && data.timeLimit !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timeLimit"],
        message: "Flashcard sets do not support timed mode.",
      })
    }
  })

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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

  if (!studySet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(studySet)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const studySet = await prisma.studySet.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!studySet || studySet.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.studySet.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = updateSetSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.issues },
      { status: 400 }
    )
  }

  const existing = await prisma.studySet.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { title, type, timeLimit, shuffle, questions } = parsed.data

  await prisma.$transaction(async (tx) => {
    await tx.answerChoice.deleteMany({
      where: { question: { studySetId: id } },
    })

    await tx.attemptAnswer.deleteMany({
      where: { question: { studySetId: id } },
    })

    await tx.question.deleteMany({ where: { studySetId: id } })

    await tx.studySet.update({
      where: { id },
      data: {
        title,
        type,
        timeLimit,
        shuffle,
        questions: {
          create: questions.map((q) => ({
            text: q.text,
            imageUrl: q.imageUrl?.trim() ? q.imageUrl.trim() : null,
            type: q.type,
            order: q.order,
            correctAnswer:
              q.type === "WRITTEN" || q.type === "TRUE_FALSE" || q.type === "MATCHING" || q.type === "FLASHCARD"
                ? q.type === "TRUE_FALSE"
                  ? q.correctAnswer?.trim().toUpperCase()
                  : q.correctAnswer?.trim()
                : null,
            choices:
              (q.type === "MULTIPLE_CHOICE" || q.type === "MATCHING") && q.choices
                ? {
                    create: q.choices.map((c) => ({
                      text: c.text,
                      isCorrect: q.type === "MULTIPLE_CHOICE" ? c.isCorrect : false,
                      order: c.order,
                    })),
                  }
                : undefined,
          })),
        },
      },
    })
  })

  return NextResponse.json({ success: true })
}
