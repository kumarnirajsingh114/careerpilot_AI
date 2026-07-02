// API Base URL config
const API_URL = "http://localhost:8000/api/v1";

// Helper: Make API requests with Auth headers
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Set default Content-Type to JSON unless we are uploading files (FormData)
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errData = await response.json();
      errorDetail = errData.detail || errorDetail;
    } catch (_) {}
    throw new Error(errorDetail);
  }

  return response.json();
}

// Global initialization check on DOM Content Loaded
document.addEventListener("DOMContentLoaded", () => {
  setupNavbar();
  
  // Page routing and initialization based on element presence
  if (document.getElementById("auth-form")) initAuthPage();
  if (document.getElementById("dashboard-section")) initDashboardPage();
  if (document.getElementById("resume-studio-section")) initResumeStudioPage();
  if (document.getElementById("career-planner-section")) initCareerPlannerPage();
  if (document.getElementById("interview-arena-section")) initInterviewArenaPage();
  if (document.getElementById("kanban-section")) initKanbanPage();
});

// Setup Navigation state
function setupNavbar() {
  const token = localStorage.getItem("token");
  const guestBtns = document.getElementById("guest-nav-btns");
  const userBtns = document.getElementById("user-nav-btns");
  
  if (token) {
    if (guestBtns) guestBtns.style.display = "none";
    if (userBtns) userBtns.style.display = "flex";
  } else {
    if (guestBtns) guestBtns.style.display = "flex";
    if (userBtns) userBtns.style.display = "none";
    
    // Redirect protected pages to home/auth
    const protectedPages = ["dashboard.html", "resume.html", "career.html", "interview.html", "applications.html"];
    const path = window.location.pathname;
    if (protectedPages.some(page => path.includes(page))) {
      window.location.href = "auth.html";
    }
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      window.location.href = "index.html";
    });
  }
}

// --- 1. Authentication Page ---
function initAuthPage() {
  const form = document.getElementById("auth-form");
  const emailInput = document.getElementById("auth-email");
  const passwordInput = document.getElementById("auth-password");
  const nameInput = document.getElementById("auth-name");
  const nameGroup = document.getElementById("name-form-group");
  const toggleBtn = document.getElementById("toggle-auth-mode");
  const submitBtn = document.getElementById("auth-submit-btn");
  const title = document.getElementById("auth-title");
  const desc = document.getElementById("auth-desc");
  const errorAlert = document.getElementById("auth-error-alert");

  let isSignUp = false;

  toggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    isSignUp = !isSignUp;
    errorAlert.style.display = "none";
    
    if (isSignUp) {
      title.textContent = "Create Account";
      desc.textContent = "Start optimizing your career goals today";
      nameGroup.style.display = "flex";
      submitBtn.textContent = "Create Account";
      toggleBtn.textContent = "Already have an account? Sign In";
    } else {
      title.textContent = "Sign In";
      desc.textContent = "Manage your agents and track progress";
      nameGroup.style.display = "none";
      submitBtn.textContent = "Sign In";
      toggleBtn.textContent = "Need an account? Sign Up";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorAlert.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";

    const payload = {
      email: emailInput.value,
      password: passwordInput.value
    };
    if (isSignUp) {
      payload.full_name = nameInput.value || null;
    }

    try {
      if (isSignUp) {
        // Run Register API request
        await apiRequest("/auth/signup", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      // Run Login API request
      const loginRes = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: payload.email, password: payload.password })
      });

      localStorage.setItem("token", loginRes.access_token);
      window.location.href = "dashboard.html";
    } catch (err) {
      errorAlert.textContent = err.message;
      errorAlert.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.textContent = isSignUp ? "Create Account" : "Sign In";
    }
  });
}

// --- 2. User Dashboard Page ---
function initDashboardPage() {
  const welcomeText = document.getElementById("dashboard-welcome");
  const resumeList = document.getElementById("dashboard-resume-list");
  const uploadInput = document.getElementById("resume-upload-input");
  const uploadLabel = document.getElementById("upload-btn-label");
  const errorAlert = document.getElementById("dashboard-error-alert");

  const loadData = async () => {
    try {
      const user = await apiRequest("/auth/me");
      welcomeText.textContent = `Welcome back, ${user.full_name || user.email.split("@")[0]}`;
      
      const resumes = await apiRequest("/resumes");
      renderResumes(resumes);
    } catch (err) {
      errorAlert.textContent = "Failed to synchronize profile dashboard data.";
      errorAlert.style.display = "block";
    }
  };

  const renderResumes = (resumes) => {
    resumeList.innerHTML = "";
    if (resumes.length === 0) {
      resumeList.innerHTML = `
        <div class="glass text-center p-8 text-slate-500" style="grid-column: 1/-1;">
          <p>No parsed profile resumes found. Please upload a PDF/DOCX to start.</p>
        </div>
      `;
      return;
    }

    resumes.forEach(res => {
      const card = document.createElement("div");
      card.className = "glass glass-hover p-6 flex flex-col justify-between";
      
      const skills = res.parsed_json_profile?.skills || [];
      const skillsMarkup = skills.slice(0, 4).map(sk => `
        <span style="font-size:10px; font-weight:600; padding:2px 6px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:4px;">
          ${sk.name}
        </span>
      `).join(" ");

      card.innerHTML = `
        <div>
          <h4 style="font-size: 0.95rem; margin-bottom: 0.25rem;">${res.filename}</h4>
          <p style="font-size: 0.75rem; margin-bottom: 1rem;">Uploaded: ${new Date(res.created_at).toLocaleDateString()}</p>
          <div class="flex gap-2" style="flex-wrap: wrap; margin-bottom: 1rem;">
            ${skillsMarkup}
          </div>
        </div>
        <a href="resume.html" class="btn btn-secondary" style="font-size: 11px; padding: 0.375rem 0.75rem; width: fit-content;">Tailor Resume</a>
      `;
      resumeList.appendChild(card);
    });
  };

  uploadInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type) && !file.name.endsWith(".docx")) {
      alert("Unsupported file format. Please upload PDF or DOCX.");
      return;
    }

    uploadLabel.textContent = "Uploading & Analyzing...";
    const formData = new FormData();
    formData.append("file", file);

    try {
      await apiRequest("/resumes/upload", {
        method: "POST",
        body: formData
      });
      loadData();
    } catch (err) {
      alert(err.message || "Failed to upload document.");
    } finally {
      uploadLabel.textContent = "Upload PDF/DOCX Resume";
    }
  });

  loadData();
}

// --- 3. Resume Studio Page ---
function initResumeStudioPage() {
  const resumeSelect = document.getElementById("studio-resume-select");
  const jobTitleInput = document.getElementById("studio-job-title");
  const jobDescInput = document.getElementById("studio-job-desc");
  const submitBtn = document.getElementById("studio-submit-btn");
  
  // Results layout elements
  const scoreBadge = document.getElementById("studio-match-score");
  const scorePercent = document.getElementById("studio-match-percent");
  const ratingText = document.getElementById("studio-match-rating");
  const atsFeedback = document.getElementById("studio-ats-feedback");
  const outputResume = document.getElementById("studio-output-resume");
  const outputCover = document.getElementById("studio-output-cover-letter");
  
  const studioOutputArea = document.getElementById("studio-output-area");
  const idleOutputMsg = document.getElementById("studio-idle-msg");

  // Load user resumes dropdown options
  const loadResumes = async () => {
    try {
      const data = await apiRequest("/resumes");
      resumeSelect.innerHTML = "";
      if (data.length === 0) {
        resumeSelect.innerHTML = `<option value="">Upload a resume first</option>`;
        submitBtn.disabled = true;
        return;
      }

      data.forEach(res => {
        const opt = document.createElement("option");
        opt.value = res.id;
        opt.textContent = res.filename;
        resumeSelect.appendChild(opt);
      });
    } catch (_) {}
  };

  const form = document.getElementById("resume-tailor-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!resumeSelect.value) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Optimizing Resume Experience...";
    
    // Reset view
    idleOutputMsg.style.display = "none";
    studioOutputArea.style.display = "none";

    try {
      const result = await apiRequest("/resumes/tailor", {
        method: "POST",
        body: JSON.stringify({
          resume_id: resumeSelect.value,
          target_job_title: jobTitleInput.value,
          target_job_description: jobDescInput.value
        })
      });

      // Display ATS Score agent results
      scorePercent.textContent = `${result.ats_score}%`;
      scoreBadge.style.width = `${result.ats_score}%`;
      
      const gapAnalysis = result.feedback || {};
      ratingText.textContent = gapAnalysis.gap_recommendations || "Analysis complete.";
      
      // Matched & Missing skill tags lists
      const missingKeywordsMarkup = (gapAnalysis.missing_keywords || []).map(kw => `
        <span style="font-size:10px; font-weight:600; padding:2px 6px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:4px; color:#f87171;">
          ${kw}
        </span>
      `).join(" ");
      
      const matchedMarkup = (gapAnalysis.matched_skills || []).map(sk => `
        <span style="font-size:10px; font-weight:600; padding:2px 6px; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.2); border-radius:4px; color:#4ade80;">
          ${sk}
        </span>
      `).join(" ");

      atsFeedback.innerHTML = `
        <div style="margin-bottom:1rem;">
          <h4 style="font-size:11px; text-transform:uppercase; margin-bottom:0.5rem; color:#9ca3af;">Missing Keywords</h4>
          <div class="flex gap-2" style="flex-wrap:wrap;">${missingKeywordsMarkup || "None"}</div>
        </div>
        <div>
          <h4 style="font-size:11px; text-transform:uppercase; margin-bottom:0.5rem; color:#9ca3af;">Matched Skills</h4>
          <div class="flex gap-2" style="flex-wrap:wrap;">${matchedMarkup || "None"}</div>
        </div>
      `;

      // Tailored Resume & Cover Letter outputs
      outputResume.textContent = result.tailored_text_markdown || "Failed to customize resume.";
      outputCover.textContent = result.cover_letter_markdown || "Failed to generate Cover Letter.";
      
      studioOutputArea.style.display = "block";
    } catch (err) {
      alert(err.message || "Tailoring failed.");
      idleOutputMsg.style.display = "flex";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Tailor Profile & Generate Cover Letter";
    }
  });

  loadResumes();
}

// --- 4. Career Pathway Planner Page ---
function initCareerPlannerPage() {
  const currentInput = document.getElementById("career-current");
  const targetInput = document.getElementById("career-target");
  const submitBtn = document.getElementById("career-submit-btn");
  
  const timeline = document.getElementById("career-timeline-view");
  const roadmapsList = document.getElementById("career-saved-list");
  const timelineSection = document.getElementById("career-output-section");
  const idleMsg = document.getElementById("career-idle-msg");

  const loadRoadmaps = async () => {
    try {
      const data = await apiRequest("/career/roadmaps");
      renderSavedList(data);
    } catch (_) {}
  };

  const renderSavedList = (list) => {
    roadmapsList.innerHTML = "";
    if (list.length === 0) return;

    list.forEach(path => {
      const card = document.createElement("div");
      card.className = "glass p-4 text-left cursor-pointer hover:bg-white/5 border border-white/5";
      card.innerHTML = `
        <div style="font-weight:750; font-size:13px; color:#fff;">${path.target_role}</div>
        <div style="font-size:10px; color:#9ca3af; margin-top:2px;">From ${path.current_role}</div>
      `;
      card.addEventListener("click", () => renderTimeline(path));
      roadmapsList.appendChild(card);
    });
  };

  const renderTimeline = (path) => {
    idleMsg.style.display = "none";
    timelineSection.style.display = "block";
    
    document.getElementById("career-roadmap-header").textContent = `Roadmap: ${path.current_role} ➔ ${path.target_role}`;
    
    timeline.innerHTML = "";
    path.milestones.forEach(m => {
      const item = document.createElement("div");
      item.className = "timeline-item";
      
      const coursesMarkup = m.recommended_courses.map(c => `
        <a href="${c.url || '#'}" target="_blank" class="glass p-3 flex justify-between items-center text-left" style="text-decoration:none; margin-top:0.5rem; font-size:11px;">
          <div>
            <span style="font-size:9px; color:#818cf8; font-weight:700; text-transform:uppercase;">${c.provider}</span>
            <div style="font-weight:600; color:#fff;">${c.course_title}</div>
            <div style="font-size:9px; color:#9ca3af;">Covers: ${c.skill_covered || 'N/A'}</div>
          </div>
          <span style="font-size:12px; color:#818cf8;">➔</span>
        </a>
      `).join("");

      item.innerHTML = `
        <div class="timeline-dot">${m.sequence_order}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
          <h4 style="font-size:1rem; color:#fff;">${m.milestone_title}</h4>
          <span style="font-size:11px; padding:2px 8px; background:rgba(255,255,255,0.05); border-radius:4px; color:#a5b4fc;">
            ${m.estimated_timeline || 'TBD'}
          </span>
        </div>
        <p style="font-size:0.8rem; line-height:1.4;">${m.description}</p>
        <div style="display:grid; grid-template-cols:1fr; gap:0.5rem; margin-top:0.5rem;">
          ${coursesMarkup}
        </div>
      `;
      timeline.appendChild(item);
    });
  };

  const form = document.getElementById("career-roadmap-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Calculating Career Transition Roadmap...";

    try {
      const newPath = await apiRequest("/career/roadmap", {
        method: "POST",
        body: JSON.stringify({
          current_role: currentInput.value,
          target_role: targetInput.value
        })
      });
      loadRoadmaps();
      renderTimeline(newPath);
    } catch (err) {
      alert(err.message || "Failed to compute transition milestone paths.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Chart Career Roadmap Path";
    }
  });

  loadRoadmaps();
}

// --- 5. Mock Interview Arena Page ---
function initInterviewArenaPage() {
  const resumeSelect = document.getElementById("arena-resume-select");
  const jobTitleInput = document.getElementById("arena-job-title");
  const jobDescInput = document.getElementById("arena-job-desc");
  const startBtn = document.getElementById("arena-start-btn");
  
  const setupSection = document.getElementById("interview-setup-section");
  const activeSection = document.getElementById("interview-active-section");
  
  const messagesBox = document.getElementById("interview-chat-box");
  const chatForm = document.getElementById("interview-chat-form");
  const chatInput = document.getElementById("interview-chat-input");
  const sendBtn = document.getElementById("interview-send-btn");
  const tipsContent = document.getElementById("arena-coach-tips-content");

  let sessionId = null;

  // Load resumes dropdown options
  const loadResumes = async () => {
    try {
      const data = await apiRequest("/resumes");
      resumeSelect.innerHTML = "";
      if (data.length === 0) {
        resumeSelect.innerHTML = `<option value="">Upload a resume first</option>`;
        startBtn.disabled = true;
        return;
      }
      data.forEach(res => {
        const opt = document.createElement("option");
        opt.value = res.id;
        opt.textContent = res.filename;
        resumeSelect.appendChild(opt);
      });
    } catch (_) {}
  };

  const startPractice = async (e) => {
    e.preventDefault();
    if (!resumeSelect.value) return;

    startBtn.disabled = true;
    startBtn.textContent = "Warming up simulator...";

    try {
      const res = await apiRequest("/interview/sessions", {
        method: "POST",
        body: JSON.stringify({
          resume_id: resumeSelect.value,
          job_title: jobTitleInput.value,
          job_description: jobDescInput.value
        })
      });

      sessionId = res.session_id;
      setupSection.style.display = "none";
      activeSection.style.display = "grid";
      
      appendMessage("agent", res.first_question);
    } catch (err) {
      alert("Failed to start session.");
      startBtn.disabled = false;
      startBtn.textContent = "Start Practice Session";
    }
  };

  const appendMessage = (speaker, text) => {
    const msg = document.createElement("div");
    msg.className = `message message-${speaker}`;
    msg.textContent = text;
    messagesBox.appendChild(msg);
    messagesBox.scrollTop = messagesBox.scrollHeight;
  };

  // Let's rewrite the submit action to use the exact correct endpoint:
  const handleSubmitTurn = async (answer) => {
    chatInput.disabled = true;
    sendBtn.disabled = true;

    try {
      const result = await apiRequest(`/interview/sessions/${sessionId}/turn`, {
        method: "POST",
        body: JSON.stringify({ answer_text: answer })
      });

      if (result.feedback) {
        tipsContent.innerHTML = `
          <div style="margin-bottom:0.75rem; font-weight:700; font-size:12px; color:#a5b4fc;">
            Last Turn Score: ${result.turn_score || result.score || 0}/100
          </div>
          <div style="font-size:11px; line-height:1.4; color:#d1d5db; overflow-y:auto; max-height:400px; whitespace:pre-wrap;">
            ${result.feedback}
          </div>
        `;
      }

      if (result.is_completed) {
        appendMessage("agent", "Interview session completed! Calculating final report...");
        fetchReport();
      } else if (result.next_question) {
        appendMessage("agent", result.next_question);
      }
    } catch (err) {
      alert("Submission error.");
    } finally {
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  };

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const answer = chatInput.value.trim();
    if (!answer || !sessionId) return;
    chatInput.value = "";
    appendMessage("user", answer);
    handleSubmitTurn(answer);
  });

  const fetchReport = async () => {
    try {
      const report = await apiRequest(`/interview/sessions/${sessionId}/report`);
      tipsContent.innerHTML = `
        <div style="text-align:center; padding:1rem; background:rgba(99,102,241,0.1); border-radius:8px; border:1px solid rgba(99,102,241,0.2); margin-bottom:1rem;">
          <span style="font-size:10px; font-weight:700; text-transform:uppercase; color:#9ca3af;">Overall Score</span>
          <div style="font-size:2rem; font-weight:850; color:#fff; margin:0.25rem 0;">${report.overall_score}/100</div>
          <p style="font-size:11px; color:#d1d5db;">${report.feedback_summary}</p>
        </div>
        <a href="dashboard.html" class="btn btn-secondary w-full text-center">Return Dashboard</a>
      `;
    } catch (_) {}
  };

  const setupForm = document.getElementById("interview-setup-form");
  if (setupForm) {
    setupForm.addEventListener("submit", startPractice);
  } else {
    startBtn.addEventListener("click", startPractice);
  }
  loadResumes();
}

// --- 6. Kanban Board Tracker Page ---
function initKanbanPage() {
  const jobTitleInput = document.getElementById("kanban-job-title");
  const companyInput = document.getElementById("kanban-company");
  const salaryInput = document.getElementById("kanban-salary");
  const statusSelect = document.getElementById("kanban-status");
  const addBtn = document.getElementById("kanban-add-btn");
  const errorAlert = document.getElementById("kanban-error-alert");

  const columns = {
    "Applied": document.getElementById("col-applied"),
    "Interviewing": document.getElementById("col-interviewing"),
    "Offer": document.getElementById("col-offer"),
    "Rejected": document.getElementById("col-rejected")
  };

  const loadData = async () => {
    try {
      const apps = await apiRequest("/jobs/applications");
      renderBoard(apps);
    } catch (err) {
      errorAlert.textContent = "Failed to fetch job applications.";
      errorAlert.style.display = "block";
    }
  };

  const renderBoard = (apps) => {
    // Reset columns content
    Object.keys(columns).forEach(col => {
      columns[col].innerHTML = "";
    });

    apps.forEach(app => {
      const card = document.createElement("div");
      card.className = "kanban-card";
      card.innerHTML = `
        <div>
          <h4 style="font-size: 13px; color:#fff; font-weight:700;">${app.job_title}</h4>
          <span style="font-size: 10px; color:#818cf8; font-weight:600;">${app.company}</span>
        </div>
        <div style="font-size:10px; color:#9ca3af; display:flex; flex-direction:column; gap:2px; border-top:1px solid rgba(255,255,255,0.05); padding-top:0.5rem;">
          <span>Salary: ${app.salary_range || 'Not specified'}</span>
          <span>Applied: ${new Date(app.applied_at).toLocaleDateString()}</span>
        </div>
        <button class="btn btn-secondary move-card-btn" style="font-size:9px; padding:3px 6px; width:fit-content; border-radius:4px; margin-top:2px;">
          Next Stage ➔
        </button>
      `;

      card.querySelector(".move-card-btn").addEventListener("click", async () => {
        const statuses = ["Applied", "Interviewing", "Offer", "Rejected"];
        const currentIdx = statuses.indexOf(app.status);
        const nextIdx = (currentIdx + 1) % statuses.length;
        const nextStatus = statuses[nextIdx];

        try {
          await apiRequest(`/jobs/applications/${app.id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: nextStatus })
          });
          loadData();
        } catch (_) {
          alert("Failed to update pipeline stage.");
        }
      });

      if (columns[app.status]) {
        columns[app.status].appendChild(card);
      }
    });

    // Render count tags
    Object.keys(columns).forEach(col => {
      const countTag = document.getElementById(`count-${col.toLowerCase()}`);
      if (countTag) {
        countTag.textContent = columns[col].children.length;
      }
    });
  };

  const form = document.getElementById("kanban-add-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    addBtn.disabled = true;

    try {
      await apiRequest("/jobs/applications", {
        method: "POST",
        body: JSON.stringify({
          job_title: jobTitleInput.value,
          company: companyInput.value,
          salary_range: salaryInput.value || null,
          status: statusSelect.value
        })
      });

      jobTitleInput.value = "";
      companyInput.value = "";
      salaryInput.value = "";
      loadData();
    } catch (err) {
      alert("Failed to track application card.");
    } finally {
      addBtn.disabled = false;
    }
  });

  loadData();
}
