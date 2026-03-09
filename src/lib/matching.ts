type ChoiceLike = {
  id: string
  text: string
  order: number
}

export interface MatchingPair {
  leftId: string
  left: string
  right: string
  order: number
}

function normalizeRightTerms(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const values = parsed
      .map((item) => {
        if (typeof item === "string") return item
        if (item && typeof item === "object" && typeof item.right === "string") return item.right
        return ""
      })
      .map((value) => value.trim())

    return values
  } catch {
    return []
  }
}

export function serializeMatchingRightTerms(rightTerms: string[]): string {
  return JSON.stringify(rightTerms.map((term) => term.trim()))
}

export function extractMatchingPairs(params: {
  text: string
  correctAnswer: string | null
  choices: ChoiceLike[]
}): MatchingPair[] {
  const sortedChoices = [...params.choices].sort((a, b) => a.order - b.order)
  const rightTerms = normalizeRightTerms(params.correctAnswer)

  if (sortedChoices.length > 0 && rightTerms.length > 0) {
    return sortedChoices
      .map((choice, index) => ({
        leftId: choice.id,
        left: choice.text,
        right: rightTerms[index] || "",
        order: choice.order,
      }))
      .filter((pair) => pair.left.trim() || pair.right.trim())
  }

  if (params.text.trim() && params.correctAnswer?.trim()) {
    return [
      {
        leftId: "legacy-left-0",
        left: params.text,
        right: params.correctAnswer,
        order: 0,
      },
    ]
  }

  return []
}

export function isValidMatchingPayload(correctAnswer: string | undefined, choicesCount: number): boolean {
  if (!correctAnswer?.trim()) return false
  const rightTerms = normalizeRightTerms(correctAnswer)
  if (rightTerms.length !== choicesCount) return false
  return rightTerms.every((term) => term.length > 0)
}
