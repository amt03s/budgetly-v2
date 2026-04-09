import { GoogleGenerativeAI } from "@google/generative-ai"
import { formatCurrencyWithCode } from "@/lib/currency"
export const maxDuration = 60
export const runtime = "nodejs"

type ChatMessage = {
  role: "user" | "assistant"
  content?: string
  parts?: Array<{ type?: string; text?: string }>
}

function getMessageText(message: ChatMessage): string {
  const partsText = message.parts?.map((p) => p.text ?? "").join("")
  return partsText || message.content || ""
}

function buildGeminiHistory(messages: ChatMessage[]) {
  const rawHistory = messages
    .slice(0, -1)
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      text: getMessageText(m).trim(),
    }))
    .filter((m) => m.text.length > 0)

  const collapsed: Array<{ role: "user" | "model"; text: string }> = []
  for (const entry of rawHistory) {
    const prev = collapsed[collapsed.length - 1]
    if (prev && prev.role === entry.role) {
      // Gemini expects alternating turns; merge consecutive same-role messages.
      prev.text = `${prev.text}\n${entry.text}`
    } else {
      collapsed.push(entry)
    }
  }

  while (collapsed.length > 0 && collapsed[0].role !== "user") {
    collapsed.shift()
  }

  return collapsed.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }))
}

function isTransientGeminiError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes("503") ||
    lower.includes("service unavailable") ||
    lower.includes("high demand") ||
    lower.includes("temporarily") ||
    lower.includes("timeout")
  )
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getConfiguredModelNames() {
  const primary = process.env.GEMINI_MODEL || "gemini-2.5-flash"
  const fallback = (process.env.GEMINI_FALLBACK_MODELS || "gemini-2.0-flash,gemini-1.5-flash")
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0)

  return Array.from(new Set([primary, ...fallback]))
}

function getApiKeySource() {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return "GOOGLE_GENERATIVE_AI_API_KEY"
  }
  if (process.env.GEMINI_API_KEY) {
    return "GEMINI_API_KEY"
  }
  if (process.env.GOOGLE_API_KEY) {
    return "GOOGLE_API_KEY"
  }
  return null
}

export async function GET() {
  const keySource = getApiKeySource()

  return Response.json({
    ok: true,
    env: process.env.NODE_ENV,
    hasGeminiKey: Boolean(keySource),
    geminiKeySource: keySource,
    configuredModels: getConfiguredModelNames(),
    timestamp: new Date().toISOString(),
  })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      messages?: ChatMessage[]
      financialData?: Record<string, unknown>
      currency?: string
    }

    const messages = Array.isArray(body.messages) ? body.messages : []
    const financialData = body.financialData ?? {}
    const currency = typeof body.currency === "string" ? body.currency : "PHP"

    if (messages.length === 0) {
      return Response.json({ error: "Missing chat messages" }, { status: 400 })
    }

    const keySource = getApiKeySource()
    const apiKey = keySource ? process.env[keySource] : undefined
    if (!apiKey) {
      return Response.json(
        {
          error: "Missing AI configuration",
          details:
            process.env.NODE_ENV === "development"
              ? "Set GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY)"
              : undefined,
        },
        { status: 500 }
      )
    }

    const fmt = (n: number) => formatCurrencyWithCode(n, currency)

    const systemPrompt = `You are Budge, a helpful personal finance assistant for Budgetly, a budgeting app. 
You help users understand their spending habits, provide budgeting advice, and answer questions about their finances.

Current user financial data:
- Total Balance: ${fmt(Number(financialData.totalBalance ?? 0))}
- Total Income: ${fmt(Number(financialData.totalIncome ?? 0))}
- Total Expenses: ${fmt(Number(financialData.totalExpenses ?? 0))}
- Number of Wallets: ${financialData.walletCount}
- Number of Transactions: ${financialData.transactionCount}
- Spending by Category: ${JSON.stringify(financialData.categorySpending)}

Be concise, friendly, and helpful. Provide specific advice based on their actual financial data when relevant.
If they ask about their finances, use the data provided above to give personalized insights.
Output format rules:
- Use plain text only.
- Do not use markdown.
- Do not use bold, italics, bullet symbols, headings, or code formatting.
- Keep responses easy to read using short sentences and simple line breaks only.`

    const client = new GoogleGenerativeAI(apiKey)
    const history = buildGeminiHistory(messages)
    const modelNames = getConfiguredModelNames()

    const lastMessage = messages[messages.length - 1]
    const lastMessageContent = lastMessage ? getMessageText(lastMessage) : ""

    if (!lastMessageContent.trim()) {
      return Response.json({ text: "" })
    }

    const maxAttemptsPerModel = 3
    let lastError: unknown
    let text = ""

    for (const modelName of modelNames) {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      })

      const chat = model.startChat({
        history,
      })

      for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
        try {
          const result = await chat.sendMessage(lastMessageContent)
          text = result.response
            .text()
            .replace(/\*\*/g, "")
            .replace(/\*/g, "")
            .trim()
          break
        } catch (error) {
          lastError = error
          const message = error instanceof Error ? error.message : String(error)

          const isTransient = isTransientGeminiError(message)
          const isLastAttempt = attempt === maxAttemptsPerModel

          if (!isTransient) {
            throw error
          }

          if (!isLastAttempt) {
            // Backoff for temporary model overload.
            await sleep(500 * attempt)
          }
        }
      }

      if (text) {
        break
      }
    }

    if (!text) {
      throw lastError instanceof Error ? lastError : new Error("Gemini returned an empty response")
    }

    return Response.json({ text })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[/api/chat] Gemini error:", message)

    const transient = isTransientGeminiError(message)

    const status =
      message.includes("Bad Request") || message.includes("API key") || message.includes("not found")
        ? 400
        : 503

    return Response.json(
      {
        error: transient
          ? "AI provider is busy right now. Please try again in a few seconds."
          : "AI request failed",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status }
    )
  }
}
