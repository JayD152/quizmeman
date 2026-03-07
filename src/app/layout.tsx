import type { Metadata } from "next"
import { Outfit, Plus_Jakarta_Sans } from "next/font/google"
import { Providers } from "@/components/Providers"
import { Navbar } from "@/components/Navbar"
import "./globals.css"

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
})

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "QuizMe",
  description: "Create and take custom quizzes to ace your studies",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              const key = "quizme-theme";
              const saved = localStorage.getItem(key);
              const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
              const useDark = saved ? saved === "dark" : prefersDark;
              document.documentElement.classList.toggle("dark", useDark);
            })();`,
          }}
        />
      </head>
      <body className={`${outfit.variable} ${jakarta.variable} antialiased`}>
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
