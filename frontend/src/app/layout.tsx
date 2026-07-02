import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CareerPilot AI - Multi-Agent Career Copilot",
  description: "Optimize your resume, prepare for mock interviews, and chart your career roadmap with AI.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 w-full glass border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center glow-primary">
                <span className="font-bold text-white text-lg">C</span>
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-400 bg-clip-text text-transparent">
                CareerPilot AI
              </span>
            </div>
            
            <nav className="hidden md:flex space-x-1 text-sm font-medium">
              <a href="/dashboard" className="px-3 py-2 rounded-md hover:text-indigo-400 text-slate-300 transition-colors">
                Dashboard
              </a>
              <a href="/resume" className="px-3 py-2 rounded-md hover:text-indigo-400 text-slate-300 transition-colors">
                Resume Studio
              </a>
              <a href="/interview" className="px-3 py-2 rounded-md hover:text-indigo-400 text-slate-300 transition-colors">
                Interview Arena
              </a>
              <a href="/career-path" className="px-3 py-2 rounded-md hover:text-indigo-400 text-slate-300 transition-colors">
                Path Planner
              </a>
              <a href="/applications" className="px-3 py-2 rounded-md hover:text-indigo-400 text-slate-300 transition-colors">
                Kanban tracker
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <a 
                href="/auth" 
                id="login-btn"
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Log In
              </a>
              <a 
                href="/auth?signup=true"
                id="signup-btn"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all glow-primary hover:scale-[1.02]"
              >
                Get Started
              </a>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
