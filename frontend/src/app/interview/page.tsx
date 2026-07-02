"use client"

import React, { useState, useEffect } from "react"
import { Send, User, Award, Play, AlertCircle, RefreshCw, BarChart2, Star, Loader, BookOpen } from "lucide-react"
import { apiRequest } from "@/lib/api"

interface Resume {
  id: string
  resume_url: string
}

interface Message {
  speaker: "agent" | "user"
  text: string
  score?: number
  feedback?: string
}

export default function InterviewArena() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [jobDescription, setJobDescription] = useState("")

  // State control
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [turns, setTurns] = useState<Message[]>([])
  const [inputAnswer, setInputAnswer] = useState("")
  
  // Grading & report
  const [isCompleted, setIsCompleted] = useState(false)
  const [overallScore, setOverallScore] = useState<number | null>(null)
  const [overallFeedback, setOverallFeedback] = useState("")
  const [currentFeedback, setCurrentFeedback] = useState("")

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const data = await apiRequest("/resumes")
        setResumes(data)
        if (data.length > 0) {
          setSelectedResumeId(data[0].id)
        }
      } catch (_) {}
    }
    fetchResumes()
  }, [])

  const startSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedResumeId || !jobTitle || !jobDescription) {
      alert("Please fill in all inputs.")
      return
    }

    setLoading(true)
    setTurns([])
    setIsCompleted(false)
    setOverallScore(null)
    setCurrentFeedback("")

    try {
      const result = await apiRequest("/interview/sessions", {
        method: "POST",
        body: JSON.stringify({
          resume_id: selectedResumeId,
          job_title: jobTitle,
          job_description: jobDescription,
        }),
      })

      setSessionId(result.session_id)
      setTurns([{ speaker: "agent", text: result.first_question }])
      setSessionActive(true)
    } catch (err) {
      alert("Failed to start session. Ensure backend is running.")
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputAnswer.trim() || !sessionId) return

    const userText = inputAnswer
    setInputAnswer("")
    
    // Add user message locally
    setTurns((prev) => [...prev, { speaker: "user", text: userText }])
    setLoading(true)

    try {
      const result = await apiRequest(`/interview/sessions/${sessionId}/turn`, {
        method: "POST",
        body: JSON.stringify({ answer_text: userText }),
      })

      // Update user turn with feedback
      setTurns((prev) => {
        const copy = [...prev]
        const lastUser = copy[copy.length - 1]
        lastUser.score = result.turn_score
        lastUser.feedback = result.feedback
        return copy
      })

      if (result.feedback) {
        setCurrentFeedback(result.feedback)
      }

      if (result.is_completed) {
        setIsCompleted(true)
        fetchFinalReport()
      } else if (result.next_question) {
        setTurns((prev) => [...prev, { speaker: "agent", text: result.next_question }])
      }
    } catch (err) {
      alert("Failed to submit turn.")
    } finally {
      setLoading(false)
    }
  }

  const fetchFinalReport = async () => {
    if (!sessionId) return
    try {
      const report = await apiRequest(`/interview/sessions/${sessionId}/report`)
      setOverallScore(report.overall_score)
      setOverallFeedback(report.feedback_summary)
    } catch (_) {}
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Mock Interview Arena</h1>
        <p className="text-slate-400 text-sm">
          Simulate a realistic job interview. Receive real-time score evaluations and answers structural coaching.
        </p>
      </div>

      {!sessionActive ? (
        /* SETUP FORM */
        <div className="max-w-2xl mx-auto glass p-8 rounded-2xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Award className="h-5 w-5 text-indigo-400" />
            <span>Configure Interview Session</span>
          </h2>

          <form onSubmit={startSession} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Select Profile Resume</label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
              >
                {resumes.map((res) => (
                  <option key={res.id} value={res.id} className="bg-slate-900 text-white">
                    {res.resume_url}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Target Job Title</label>
              <input
                type="text"
                required
                placeholder="Data Scientist / Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Job Description</label>
              <textarea
                required
                rows={6}
                placeholder="Paste key responsibilities or target job specs here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all hover:scale-[1.01] active:scale-[0.99] glow-primary disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Preparing simulator...</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-current" />
                  <span>Start Practice Session</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* ACTIVE INTERVIEW ARENA */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat simulator Column */}
          <div className="lg:col-span-2 flex flex-col justify-between glass rounded-2xl h-[600px] overflow-hidden">
            {/* Header indicator */}
            <div className="px-6 py-4 border-b border-white/5 bg-slate-900/50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-white text-sm truncate">{jobTitle} Interview</h3>
                <span className="text-[10px] text-indigo-400 font-semibold uppercase">
                  {isCompleted ? "Session Completed" : `Question ${Math.floor((turns.length + 1) / 2)} of 5`}
                </span>
              </div>
              <button
                onClick={() => setSessionActive(false)}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Quit Session
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/20">
              {turns.map((turn, i) => (
                <div
                  key={i}
                  className={`flex ${turn.speaker === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                      turn.speaker === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white/5 border border-white/5 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    <p>{turn.text}</p>
                    {turn.score !== undefined && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-bold text-indigo-200">
                        <span>Answer score:</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-850 border border-indigo-500/20">
                          {turn.score}/100
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && turns.length % 2 !== 0 && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center space-x-2 text-xs text-slate-400">
                    <Loader className="h-4 w-4 animate-spin text-indigo-400" />
                    <span>AI Interviewer is formulating feedback...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Form Input footer */}
            <div className="p-4 border-t border-white/5 bg-slate-900/40 shrink-0">
              {isCompleted ? (
                <div className="text-center py-2 text-sm text-slate-400">
                  Interview finished. Review final evaluation stats on the right.
                </div>
              ) : (
                <form onSubmit={submitAnswer} className="flex gap-2">
                  <input
                    type="text"
                    required
                    disabled={loading}
                    placeholder="Type your response here..."
                    value={inputAnswer}
                    onChange={(e) => setInputAnswer(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all text-sm disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !inputAnswer.trim()}
                    className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50 glow-primary shrink-0"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* AI Tips Sidebar */}
          <div className="glass p-6 rounded-2xl flex flex-col justify-between h-[600px] overflow-hidden">
            <div className="flex-1 flex flex-col space-y-6 overflow-y-auto">
              <h3 className="font-bold text-white text-lg flex items-center space-x-2 shrink-0">
                <BarChart2 className="h-5 w-5 text-indigo-400" />
                <span>AI Coaching Insights</span>
              </h3>

              {isCompleted && overallScore !== null ? (
                /* FINAL REPORT VIEW */
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Performance</span>
                    <div className="text-4xl font-extrabold text-white">{overallScore} / 100</div>
                    <div className="flex justify-center text-yellow-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= Math.round(overallScore / 20) ? "fill-current" : "opacity-30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wide">Summary Feedback</span>
                    <p className="text-slate-300 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
                      {overallFeedback}
                    </p>
                  </div>

                  <button
                    onClick={() => setSessionActive(false)}
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-semibold transition-all"
                  >
                    Practice Again
                  </button>
                </div>
              ) : currentFeedback ? (
                /* TURN FEEDBACK VIEW */
                <div className="space-y-4 flex-1 flex flex-col min-h-0">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide shrink-0">Latest QA Feedback</div>
                  <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {currentFeedback}
                  </div>
                </div>
              ) : (
                /* IDLE TIP */
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 p-6 text-slate-400 text-xs">
                  <BookOpen className="h-10 w-10 text-slate-650" />
                  <p>
                    Submit answers to questions to receive dynamic evaluation feedback based on the STAR method.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
