import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import StudySetBuilder, { type StudySetBuilderInitialData } from "@/components/StudySetBuilder"

export default async function EditSetPage({
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

  const initialData: StudySetBuilderInitialData = {
    id: studySet.id,
    title: studySet.title,
    type: studySet.type as StudySetBuilderInitialData["type"],
    timeLimit: studySet.timeLimit,
    shuffle: studySet.shuffle,
    questions: studySet.questions.map((q) => {
      const question = q as typeof q & { imageUrl: string | null }
      return {
      id: q.id,
      type: q.type as StudySetBuilderInitialData["questions"][number]["type"],
      text: q.text,
      imageUrl: question.imageUrl,
      correctAnswer: q.correctAnswer,
      choices: q.choices.map((c) => ({
        id: c.id,
        text: c.text,
        isCorrect: c.isCorrect,
      })),
      }
    }),
  }

  return <StudySetBuilder initialData={initialData} />
}
