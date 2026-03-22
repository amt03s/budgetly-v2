import { GoogleGenerativeAI } from "@google/generative-ai"
import { formatCurrencyWithCode } from "@/lib/currency"
export const maxDuration = 60

type ChatMessage = {
  role: "user" | "assistant"
  content?: string
  parts?: Array<{ type?: string; text?: string }>
}

function getMessageText(message: ChatMessage): string {
  const partsText = message.parts?.map((p) => p.text ?? "").join("")
  return partsText || message.content || ""
}

export async function POST(req: Request) {
  const { messages, financialData, currency = "PHP" }: { messages: ChatMessage[]; financialData: Record<string, unknown>; currency?: string } = await req.json()

  const fmt = (n: number) => formatCurrencyWithCode(n, currency)

  const systemPrompt = `You are a helpful personal finance assistant for Budgetly, a budgeting app. 
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

  const client = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
  const model = client.getGenerativeModel({ model: "gemini-2.5-flash" })

  const history = messages
    .slice(0, -1)
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: getMessageText(m) }],
    }))
    .filter((m) => m.parts[0].text.trim().length > 0)

  const chat = model.startChat({
    history,
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
  })

  const lastMessage = messages[messages.length - 1]
  const lastMessageContent = lastMessage ? getMessageText(lastMessage) : ""

  if (!lastMessageContent.trim()) {
    return Response.json({ text: "" })
  }

  const result = await chat.sendMessage(lastMessageContent)
  const text = result.response
    .text()
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim()

  return Response.json({ text })
}
