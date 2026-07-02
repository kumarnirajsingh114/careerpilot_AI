const API_URL = "http://localhost:8000/api/v1"

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  let token = null
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token")
  }

  const headers = new Headers(options.headers || {})
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorMsg = "Something went wrong"
    try {
      const errData = await response.json()
      errorMsg = errData.detail || errorMsg
    } catch (_) {}
    throw new Error(errorMsg)
  }

  return response.json()
}
