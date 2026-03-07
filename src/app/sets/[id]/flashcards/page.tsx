import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import FlashcardStudy from "@/components/FlashcardStudy"
import type { FlashcardData } from "@/types"

export default async function FlashcardsPage({
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
      },
    },
  })

  if (!studySet) redirect("/")
  if (studySet.type !== "FLASHCARD") redirect(`/sets/${id}/take`)

  const flashcardData: FlashcardData = {
    id: studySet.id,
    title: studySet.title,
    shuffle: studySet.shuffle,
    cards: studySet.questions
      .filter((q) => q.type === "FLASHCARD")
      .map((q) => ({
        id: q.id,
        term: q.text,
        definition: q.correctAnswer || "",
        order: q.order,
      })),
  }

  if (flashcardData.cards.length === 0) redirect("/")

  return <FlashcardStudy studySet={flashcardData} />
}
