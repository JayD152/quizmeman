export interface StudySetCard {
  id: string
  title: string
  type: "MULTIPLE_CHOICE" | "WRITTEN" | "MIXED"
  questionCount: number
  lastScore: number | null
  avgScore: number | null
  attemptCount: number
  createdAt: Date
}

export interface QuizQuestion {
  id: string
  text: string
  type: "MULTIPLE_CHOICE" | "WRITTEN"
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
