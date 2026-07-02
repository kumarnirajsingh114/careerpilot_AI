"use client"

import React, { useState, useEffect } from "react"
import { ArrowLeft, Target, FileText, CheckCircle, Sparkles, AlertCircle, Copy, Check, Loader } from "lucide-react"
import { apiRequest } from "@/lib/api"

interface Resume {
  id: string
  resume_url: string
  parsed_json_profile?: {
    summary?: string
  }
}

export default function ResumeStudio() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState("")
  const [targetJobTitle, setTargetJobTitle] = useState("")
  const [targetJobDescription, setTargetJobDescription] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  // Output states
  const [matchScore, setMatchScore] = useState<number | null>(null)
  const [matchRating, setMatchRating] = useState("")
  const [matchFeedback, setMatchFeedback] = useState("")
  const [tailoredText, setTailoredText] = useState("")

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const data = await apiRequest("/resumes")
        setResumes(data)
        if (data.length > 0) {
          setSelectedResumeId(data[0].id)
        }
      } catch (err: any) {
        setError("Please make sure you have uploaded a resume in your dashboard first.")
      }
    }
    fetchResumes()
  }, [])

  const handleTailor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedResumeId || !targetJobTitle || !targetJobDescription) {
      alert("Please fill in all inputs.")
      return
    }

    setLoading(true)
    setError("")
    setTailoredText("")
    setMatchScore(null)

    try {
      // 1. Get Match Score
      const matchResult = await apiRequest(
        `/jobs/match-score?job_description=${encodeURIComponent(targetJobDescription)}`
      )
      setMatchScore(matchResult.score)
      setMatchRating(matchResult.rating)
      setMatchFeedback(matchResult.feedback)

      // 2. Get Tailored Resume
      const tailorResult = await apiRequest("/resumes/tailor", {
        method: "POST",
        body: JSON.stringify({
          resume_id: selectedResumeId,
          target_job_title: targetJobTitle,
          target_job_description: targetJobDescription,
        }),
      })
      setTailoredText(tailorResult.tailored_text_markdown)
    } catch (err: any) {
      setError(err.message || "Tailoring request failed.")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tailoredText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Resume Optimizer Studio</h1>
        <p className="text-slate-400 text-sm">
          Optimize your experience metrics and keywords specifically for a target role description.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left pane: Inputs Form */}
        <div className="glass p-6 rounded-2xl space-y-6 self-start">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <span>Target job details</span>
          </h2>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-sm flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleTailor} className="space-y-4">
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
                placeholder="Senior Full Stack Engineer"
                value={targetJobTitle}
                onChange={(e) => setTargetJobTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Job Description</label>
              <textarea
                required
                rows={8}
                placeholder="Paste the full job post details, key tools requested, and responsibilities here..."
                value={targetJobDescription}
                onChange={(e) => setTargetJobDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all hover:scale-[1.01] active:scale-[0.99] glow-primary disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>AI Agent is Tailoring...</span>
                </>
              ) : (
                <>
                  <Target className="h-5 w-5" />
                  <span>Analyze Compatibility & Tailor</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right pane: Results */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-between min-h-[500px] relative overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
              <Loader className="h-10 w-10 text-indigo-500 animate-spin" />
              <p className="text-slate-300 text-sm">Parsing keywords & rewriting bullet points...</p>
            </div>
          ) : null}

          {tailoredText ? (
            <div className="space-y-6 flex flex-col h-full justify-between">
              {/* Semantic Analysis Rating */}
              {matchScore !== null && (
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ATS Score Compatibility</span>
                    <span className="text-sm font-bold text-indigo-400">{matchRating}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full"
                        style={{ width: `${matchScore}%` }}
                      ></div>
                    </div>
                    <span className="font-extrabold text-white text-lg shrink-0">{matchScore}%</span>
                  </div>
                  <p className="text-[11px] text-slate-300 italic">{matchFeedback}</p>
                </div>
              )}

              {/* Document Output View */}
              <div className="flex-1 flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tailored Resume Output (Markdown)</span>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white transition-all flex items-center space-x-1"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-black/40 border border-white/5 text-sm text-slate-300 font-mono whitespace-pre-wrap max-h-[450px]">
                  {tailoredText}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 p-8">
              <FileText className="h-12 w-12 text-slate-600" />
              <h3 className="font-bold text-white text-lg">No Output Generated Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Fill in the job details on the left, choose a parsed resume, and click analyze to tailormake your resume bullet points.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
