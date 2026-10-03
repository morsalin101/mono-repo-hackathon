export type AuthUser = {
  id: number
  username: string
  name: string
  role: "user" | "admin"
}

export type AISettings = {
  provider: "gemini"
  ttsProvider: "gemini" | "cartesia"
  modelName: string
  ttsModelName: string
  ttsVoiceName: string
  ttsEnabled: boolean
  apiKeyMasked: string
  hasApiKey: boolean
  cartesiaApiKeyMasked: string
  hasCartesiaApiKey: boolean
  systemPrompt: string
  isEnabled: boolean
  updatedAt: string
}

export type KnowledgeDocument = {
  id: number
  title: string
  content: string
  uploaded_at: string
}

const TOKEN_KEY = "sohoj_pay_api_token"

export const hasStoredToken = () => Boolean(localStorage.getItem(TOKEN_KEY))

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.")
  }
  return data as T
}

function storeAuth(data: { token: string; user: AuthUser }) {
  localStorage.setItem(TOKEN_KEY, data.token)
  return data.user
}

export async function login(username: string, password: string) {
  const data = await apiRequest<{ token: string; user: AuthUser }>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
  return storeAuth(data)
}

export async function quickLogin(role: "user" | "admin") {
  const data = await apiRequest<{ token: string; user: AuthUser }>("/auth/quick-login/", {
    method: "POST",
    body: JSON.stringify({ role }),
  })
  return storeAuth(data)
}

export async function getMe() {
  const data = await apiRequest<{ user: AuthUser, aiEnabled: boolean, aiConfigured: boolean }>("/auth/me/")
  return data
}

export async function getPublicConfig() {
  return apiRequest<{ aiEnabled: boolean, aiConfigured: boolean }>("/config/")
}

export async function logout() {
  try {
    await apiRequest("/auth/logout/", { method: "POST" })
  } finally {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export async function getAISettings() {
  const data = await apiRequest<{ settings: AISettings }>("/admin/ai-settings/")
  return data.settings
}

export async function saveAISettings(input: {
  provider: "gemini"
  ttsProvider: string
  modelName: string
  ttsModelName: string
  ttsVoiceName: string
  ttsEnabled: boolean
  apiKey: string
  cartesiaApiKey: string
  systemPrompt: string
  isEnabled: boolean
}) {
  const data = await apiRequest<{ settings: AISettings; message: string }>("/admin/ai-settings/", {
    method: "PUT",
    body: JSON.stringify(input),
  })
  return data
}

export async function testAIConnection(modelName: string, apiKey: string) {
  return apiRequest<{ ok: boolean; message: string; response: string }>("/admin/ai-settings/test/", {
    method: "POST",
    body: JSON.stringify({ provider: "gemini", modelName, apiKey }),
  })
}

async function audioRequest(path: string, body: unknown) {
  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`/api${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || "Could not generate speech.")
  }
  return response.blob()
}

export async function testTTSConnection(ttsProvider: string, ttsModelName: string, ttsVoiceName: string, apiKey: string, cartesiaApiKey: string) {
  return audioRequest("/admin/ai-settings/tts-test/", { ttsProvider, ttsModelName, ttsVoiceName, apiKey, cartesiaApiKey })
}

export async function generateGeneralTTS(text: string) {
  return audioRequest("/agent/tts/", { text })
}

export async function sendAgentMessage(message: string, conversationId?: number, mode?: string) {
  return apiRequest<{ conversationId: number; reply: string; model: string }>("/agent/chat/", {
    method: "POST",
    body: JSON.stringify({ message, conversationId, mode }),
  })
}

export async function getKnowledgeDocuments() {
  return apiRequest<{ documents: KnowledgeDocument[] }>("/admin/knowledge/", {
    method: "GET",
  })
}

export async function addKnowledgeDocument(title: string, content: string) {
  return apiRequest<KnowledgeDocument>("/admin/knowledge/", {
    method: "POST",
    body: JSON.stringify({ title, content }),
  })
}

export async function deleteKnowledgeDocument(docId: number) {
  return apiRequest<{ ok: boolean }>(`/admin/knowledge/${docId}/`, {
    method: "DELETE",
  })
}

export type ContactItem = {
  id: number
  name: string
  number: string
  type: string
  avatar: string
}

export type TransactionItem = {
  id: number
  type: string
  amount: string
  recipient: string
  date: string
  status: string
  icon: string
  color: string
}

export async function getContacts() {
  return apiRequest<ContactItem[]>("/contacts/", { method: "GET" })
}

export async function addContact(name: string, number: string, type: string = "Agent", avatar: string = "👤") {
  return apiRequest<ContactItem>("/contacts/", {
    method: "POST",
    body: JSON.stringify({ name, number, type, avatar }),
  })
}

export async function getTransactions() {
  return apiRequest<TransactionItem[]>("/transactions/", { method: "GET" })
}

export async function addTransaction(type: string, amount: string, recipient: string, date: string, status: string = "Success", icon: string = "transfer", color: string = "blue") {
  return apiRequest<TransactionItem>("/transactions/", {
    method: "POST",
    body: JSON.stringify({ type, amount, recipient, date, status, icon, color }),
  })
}

