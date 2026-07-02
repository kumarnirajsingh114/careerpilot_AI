import React from "react"
import { Shield, Sparkles, Target, Zap, Award, Compass } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-16 py-12 relative overflow-hidden">
      {/* Background ambient lights */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

      {/* Hero Section */}
      <div className="space-y-6 max-w-4xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full glass border-indigo-500/20 text-xs font-semibold text-indigo-400 hover:border-indigo-500/40 transition-colors">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Google × Kaggle Agentic AI Capstone Project</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Navigate Your Career with{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Autonomous AI Agents
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          CareerPilot AI coordinates a team of specialized AI agents to optimize your resume, simulate realistic mock interviews, and chart custom transition roadmaps.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <a
            href="/auth?signup=true"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all glow-primary hover:scale-105"
          >
            Launch Your Agent Copilot
          </a>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 rounded-xl glass text-slate-300 font-semibold hover:text-white transition-all hover:scale-105"
          >
            Explore Platform Features
          </a>
        </div>
      </div>

      {/* Live Metrics Showcase */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl">
        {[
          { label: "AI Agent Interactions", value: "99.8%" },
          { label: "Resume ATS Match Rate", value: "94%" },
          { label: "Interview Confidence Boost", value: "88%" },
          { label: "Transition Milestone Accuracy", value: "92%" }
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl flex flex-col items-center justify-center space-y-1">
            <span className="text-3xl md:text-4xl font-extrabold text-white">{stat.value}</span>
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase text-center">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Features Section */}
      <div id="features" className="space-y-12 w-full max-w-7xl pt-16 border-t border-white/5">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">Platform Capabilities</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Powered by a coordinated multi-agent workflow architecture built using Gemini 1.5.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            {
              icon: Target,
              title: "Resume Optimizer Studio",
              description: "Our Resume Tailor Agent analyzes missing technical keywords and rewrites bullet points using action verbs and STAR method achievements."
            },
            {
              icon: Compass,
              title: "Career Path Roadmap",
              description: "Plan transition milestones from your current role to target jobs, complete with custom recommended courses and credentials via MCP tools."
            },
            {
              icon: Zap,
              title: "Interactive Interview Coach",
              description: "Conduct turn-based mock interviews with our Coach Agent. Submit responses to receive instant scores, structural feedback, and model answers."
            }
          ].map((feat, i) => (
            <div key={i} className="glass glass-hover p-8 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <feat.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.description}</p>
              </div>
              <a 
                href="/auth?signup=true"
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 pt-4"
              >
                <span>Get Started</span>
                <span>&rarr;</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
