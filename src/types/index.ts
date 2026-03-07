export interface StudySetCard {
  id: string
  title: string
  type: "MULTIPLE_CHOICE" | "WRITTEN" | "TRUE_FALSE" | "MIXED" | "FLASHCARD"
  questionCount: number
  lastScore: number | null
  avgScore: number | null
  attemptCount: number
  createdAt: Date
}

export interface QuizQuestion {
  id: string
  text: string
  type: "MULTIPLE_CHOICE" | "WRITTEN" | "TRUE_FALSE"
  order: number
  choices: QuizChoice[]
}

export interface QuizChoice {
  id: string
  text: string
  order: number
}

export interface QuizData {
  id: string
  title: string
  timeLimit: number | null
  shuffle: boolean
  questions: QuizQuestion[]
}

export interface FlashcardData {
  id: string
  title: string
  shuffle: boolean
  cards: {
    id: string
    term: string
    definition: string
    order: number
  }[]
}
