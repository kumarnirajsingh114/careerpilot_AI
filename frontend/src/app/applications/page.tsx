"use client"

import React, { useState, useEffect } from "react"
import { Plus, Trash, ArrowRight, Loader, Tag, DollarSign, Calendar, ChevronRight, Check } from "lucide-react"
import { apiRequest } from "@/lib/api"

interface JobApplication {
  id: string
  job_title: string
  company: string
  salary_range?: string
  status: string
  applied_at: string
}

const COLUMNS = ["Applied", "Interviewing", "Offer", "Rejected"]

export default function KanbanTracker() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Form states
  const [showAddForm, setShowAddForm] = useState(false)
  const [jobTitle, setJobTitle] = useState("")
  const [company, setCompany] = useState("")
  const [salaryRange, setSalaryRange] = useState("")
  const [initialStatus, setInitialStatus] = useState("Applied")

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const data = await apiRequest("/jobs/applications")
      setApplications(data)
    } catch (err: any) {
      setError(err.message || "Failed to load applications.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobTitle || !company) return

    setLoading(true)
    try {
      const newApp = await apiRequest("/jobs/applications", {
        method: "POST",
        body: JSON.stringify({
          job_title: jobTitle,
          company: company,
          salary_range: salaryRange || null,
          status: initialStatus,
        }),
      })

      setApplications((prev) => [newApp, ...prev])
      setJobTitle("")
      setCompany("")
      setSalaryRange("")
      setShowAddForm(false)
    } catch (_) {
      alert("Failed to track application.")
    } finally {
      setLoading(false)
    }
  }

  const handleMoveStatus = async (appId: string, currentStatus: string) => {
    const currentIdx = COLUMNS.indexOf(currentStatus)
    if (currentIdx === -1) return
    
    // Cycle to next status, or wrap around
    const nextIdx = (currentIdx + 1) % COLUMNS.length
    const nextStatus = COLUMNS[nextIdx]

    try {
      const updatedApp = await apiRequest(`/jobs/applications/${appId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      })

      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? updatedApp : app))
      )
    } catch (_) {
      alert("Failed to update status.")
    }
  }

  if (loading && applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading applications pipeline...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Application Pipeline</h1>
          <p className="text-slate-400 text-sm">
            Track interview progression and offer status cards on your Kanban pipeline.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all glow-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Application</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Add Application Form Dropdown */}
      {showAddForm && (
        <form onSubmit={handleAddApplication} className="glass p-6 rounded-2xl max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1 col-span-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Job Title</label>
            <input
              type="text"
              required
              placeholder="Software Architect"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          <div className="space-y-1 col-span-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Company</label>
            <input
              type="text"
              required
              placeholder="Google"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          <div className="space-y-1 col-span-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Salary Range (Optional)</label>
            <input
              type="text"
              placeholder="$120k - $150k"
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          <div className="space-y-1 col-span-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Initial Status</label>
            <select
              value={initialStatus}
              onChange={(e) => setInitialStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50 transition-all"
            >
              {COLUMNS.map((col) => (
                <option key={col} value={col} className="bg-slate-900 text-white">
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1 sm:col-span-2 pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-650 text-white text-xs font-semibold hover:bg-indigo-600 transition-all"
            >
              Save Application
            </button>
          </div>
        </form>
      )}

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {COLUMNS.map((col) => {
          const colApps = applications.filter((app) => app.status === col)
          return (
            <div key={col} className="flex flex-col space-y-4 min-h-[400px]">
              {/* Column title */}
              <div className="flex justify-between items-center px-2">
                <span className="font-bold text-sm text-slate-300">{col}</span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold text-slate-400">
                  {colApps.length}
                </span>
              </div>

              {/* Cards area */}
              <div className="flex-1 p-3 rounded-2xl bg-slate-900/30 border border-white/5 space-y-3">
                {colApps.length === 0 ? (
                  <div className="h-24 border border-dashed border-white/5 rounded-xl flex items-center justify-center text-[10px] text-slate-650">
                    No applications
                  </div>
                ) : (
                  colApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl bg-slate-900/80 border border-white/5 hover:border-indigo-500/20 transition-all shadow-md group relative space-y-3"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-white truncate">{app.job_title}</h4>
                        <p className="text-[10px] text-indigo-400 font-semibold truncate">{app.company}</p>
                      </div>

                      <div className="space-y-1.5 pt-1.5 border-t border-white/5 text-[9px] text-slate-400">
                        {app.salary_range && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3 text-slate-500" />
                            <span>{app.salary_range}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Move Column cycle button */}
                      <button
                        onClick={() => handleMoveStatus(app.id, app.status)}
                        className="w-full mt-2.5 py-1.5 rounded bg-white/5 hover:bg-indigo-500/10 text-[9px] font-semibold text-slate-300 hover:text-indigo-400 border border-white/5 hover:border-indigo-500/20 transition-all flex items-center justify-center space-x-1"
                      >
                        <span>Move Stage</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
