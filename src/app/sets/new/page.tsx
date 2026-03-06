import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth-options"
import StudySetBuilder from "@/components/StudySetBuilder"

export default async function NewSetPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/signin")

  return <StudySetBuilder />
}
