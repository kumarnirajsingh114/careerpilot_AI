"use client"

import React, { useState, useEffect } from "react"
import { Compass, ArrowRight, BookOpen, ExternalLink, Calendar, Plus, Loader, Award } from "lucide-react"
import { apiRequest } from "@/lib/api"

interface RecommendedCourse {
  id: string
  course_title: string
  provider: string
  url?: string
  skill_covered?: string
}

interface CareerMilestone {
  id: string
  sequence_order: number
  milestone_title: string
  description: string
  estimated_timeline?: string
  recommended_courses: RecommendedCourse[]
}

interface CareerPath {
  id: string
  current_role: string
  target_role: string
  created_at: string
  milestones: CareerMilestone[]
}

export default function CareerPathPage() {
  const [currentRole, setCurrentRole] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [roadmaps, setRoadmaps] = useState<CareerPath[]>([])
  const [selectedRoadmap, setSelectedRoadmap] = useState<CareerPath | null>(null)

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const data = await apiRequest("/career/roadmaps")
        setRoadmaps(data)
        if (data.length > 0) {
          setSelectedRoadmap(data[0])
        }
      } catch (_) {}
    }
    fetchPaths()
  }, [])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentRole || !targetRole) {
      alert("Please fill in current and target roles.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const newPath = await apiRequest("/career/roadmap", {
        method: "POST",
        body: JSON.stringify({ current_role: currentRole, target_role: targetRole }),
      })
      setRoadmaps((prev) => [newPath, ...prev])
      setSelectedRoadmap(newPath)
    } catch (err: any) {
      setError(err.message || "Failed to chart roadmap.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Career Path Planner</h1>
        <p className="text-slate-400 text-sm">
          Map out technical milestones, estimated timelines, and learning resources to hit your target role goals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Path configurations */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-lg flex items-center space-x-2">
              <Compass className="h-5 w-5 text-indigo-400" />
              <span>Chart New path</span>
            </h3>

            {error && (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Current Role</label>
                <input
                  type="text"
                  required
                  placeholder="Junior Developer"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Target role</label>
                <input
                  type="text"
                  required
                  placeholder="Lead Solutions Architect"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
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
                    <span>Planning transition...</span>
                  </>
                ) : (
                  <>
                    <span>Chart Career Path</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Past roadmaps list */}
          {roadmaps.length > 0 && (
            <div className="glass p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">Saved Roadmaps</h3>
              <div className="space-y-2">
                {roadmaps.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoadmap(r)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedRoadmap?.id === r.id
                        ? "bg-indigo-500/10 border-indigo-500/30 text-white"
                        : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="font-semibold text-sm truncate">{r.target_role}</div>
                    <div className="text-[10px] text-slate-400 mt-1">From {r.current_role}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right columns: Roadmap node visual graphs */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRoadmap ? (
            <div className="space-y-8">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-500/15 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">{selectedRoadmap.target_role}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Transition roadmap charted from **{selectedRoadmap.current_role}**
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <Compass className="h-6 w-6" />
                </div>
              </div>

              {/* Milestone visual list */}
              <div className="relative border-l border-white/10 pl-6 ml-4 space-y-8">
                {selectedRoadmap.milestones.map((m, idx) => (
                  <div key={m.id} className="relative space-y-3">
                    {/* Node Dot icon indicator */}
                    <div className="absolute -left-[35px] top-1 h-6 w-6 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center text-[10px] font-extrabold text-indigo-400">
                      {m.sequence_order}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="text-lg font-bold text-white">{m.milestone_title}</h4>
                      {m.estimated_timeline && (
                        <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-slate-300">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{m.estimated_timeline}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed">{m.description}</p>

                    {/* Recommended courses cards */}
                    {m.recommended_courses && m.recommended_courses.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {m.recommended_courses.map((c) => (
                          <a
                            key={c.id}
                            href={c.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-indigo-500/30 transition-all group flex items-start justify-between"
                          >
                            <div className="space-y-1.5 overflow-hidden pr-2">
                              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                                {c.provider}
                              </span>
                              <div className="font-semibold text-xs text-white group-hover:text-indigo-400 transition-colors truncate">
                                {c.course_title}
                              </div>
                              {c.skill_covered && (
                                <p className="text-[10px] text-slate-400 truncate">Covers: {c.skill_covered}</p>
                              )}
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass p-12 text-center rounded-2xl space-y-3 flex flex-col items-center justify-center min-h-[400px]">
              <Compass className="h-10 w-10 text-slate-600 animate-spin" />
              <h3 className="font-bold text-white text-lg">Initialize transition planner</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Enter your current job and desired target job on the left. The Career Agent will generate a step-by-step educational roadmap for you.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
