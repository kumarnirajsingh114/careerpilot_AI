"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, ArrowRight, CheckCircle, Award, Compass, BarChart, Plus, Loader } from "lucide-react"
import { apiRequest } from "@/lib/api"

interface Resume {
  id: string
  resume_url: string
  created_at: string
  parsed_json_profile?: {
    summary?: string
    skills?: { name: string; level: string }[]
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/auth")
      return
    }

    const fetchDashboardData = async () => {
      try {
        const userData = await apiRequest("/auth/me")
        setUser(userData)

        const resumeList = await apiRequest("/resumes")
        setResumes(resumeList)
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data.")
        if (err.message.includes("credentials") || err.message.includes("Unauthorized")) {
          localStorage.removeItem("token")
          router.push("/auth")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.")
      return
    }

    setUploading(true)
    setError("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const newResume = await apiRequest("/resumes/upload", {
        method: "POST",
        body: formData,
      })
      setResumes((prev) => [newResume, ...prev])
    } catch (err: any) {
      setError(err.message || "Resume upload failed.")
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading your agent dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.full_name || user?.email?.split("@")[0]}
          </h1>
          <p className="text-slate-400 text-sm">
            Monitor and coordinate your AI agents to plan your career growth.
          </p>
        </div>

        {/* Upload widget */}
        <label className="relative flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-all glow-primary hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
          <Upload className="h-5 w-5 mr-2" />
          <span>{uploading ? "Processing PDF..." : "Upload PDF Resume"}</span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Grid widgets dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Actions */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: "Resume Optimizer",
              description: "Tailor your experiences specifically for custom job openings.",
              link: "/resume",
              icon: FileText,
            },
            {
              title: "Interview Coach",
              description: "Complete dynamic mock QA sessions and read feedback reports.",
              link: "/interview",
              icon: Award,
            },
            {
              title: "Career pathways",
              description: "Chart developmental milestones to hit your target role goals.",
              link: "/career-path",
              icon: Compass,
            },
            {
              title: "Job Applications",
              description: "Manage and track application statuses on your kanban pipeline.",
              link: "/applications",
              icon: BarChart,
            },
          ].map((act, idx) => (
            <div
              key={idx}
              onClick={() => router.push(act.link)}
              className="glass glass-hover p-6 rounded-2xl cursor-pointer flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                  <act.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{act.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{act.description}</p>
              </div>
              <div className="flex items-center text-xs font-bold text-slate-300 group-hover:text-white space-x-1">
                <span>Configure Agent</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* User Stats sidebar */}
        <div className="glass p-6 rounded-2xl space-y-6">
          <h3 className="font-bold text-lg text-white">Your Career Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3.5 rounded-xl bg-white/5">
              <span className="text-sm text-slate-400">Resumes Uploaded</span>
              <span className="font-bold text-white">{resumes.length}</span>
            </div>
            <div className="flex justify-between items-center p-3.5 rounded-xl bg-white/5">
              <span className="text-sm text-slate-400">Skills Tracked</span>
              <span className="font-bold text-white">
                {resumes[0]?.parsed_json_profile?.skills?.length || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3.5 rounded-xl bg-white/5">
              <span className="text-sm text-slate-400">Applications Tracked</span>
              <span className="font-bold text-white">0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumes List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Uploaded Profiles</h2>
        {resumes.length === 0 ? (
          <div className="glass p-8 text-center rounded-2xl space-y-3">
            <FileText className="mx-auto h-8 w-8 text-slate-500" />
            <p className="text-sm text-slate-400">
              No profiles parsed yet. Upload your PDF resume to initialize.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumes.map((res) => (
              <div key={res.id} className="glass p-5 rounded-2xl flex items-start space-x-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-2 overflow-hidden">
                  <h4 className="font-bold text-white truncate">{res.resume_url}</h4>
                  <p className="text-xs text-slate-400">
                    Uploaded on {new Date(res.created_at).toLocaleDateString()}
                  </p>
                  {res.parsed_json_profile?.skills && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {res.parsed_json_profile.skills.slice(0, 4).map((sk: any, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-semibold text-slate-300"
                        >
                          {sk.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
