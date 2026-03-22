"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useBudget } from "@/lib/budget-context"
import { useCurrency } from "@/lib/currency-context"
import { getTransactionCategoryLabel } from "@/lib/types"
import { Send, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  text: string
}

export function AIChat() {
  const { transactions, totalBalance, totalIncome, totalExpenses, wallets } = useBudget()
  const { currency } = useCurrency()
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Calculate spending by category for context
  const categorySpending = useMemo(() => {
    const spending: Record<string, number> = {}
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const label = getTransactionCategoryLabel(t)
        spending[label] = (spending[label] || 0) + t.amount
      })
    return spending
  }, [transactions])

  const financialData = useMemo(
    () => ({
      totalBalance,
      totalIncome,
      totalExpenses,
      walletCount: wallets.length,
      transactionCount: transactions.length,
      categorySpending,
    }),
    [totalBalance, totalIncome, totalExpenses, wallets.length, transactions.length, categorySpending]
  )

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      const viewport = scrollAreaRef.current?.querySelector(
        '[data-slot="scroll-area-viewport"]'
      ) as HTMLDivElement | null

      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" })
      }
    })

    return () => window.cancelAnimationFrame(id)
  }, [messages, isLoading])

  const suggestedPrompts = [
    "What are my spending trends?",
    "How can I save more money?",
    "What's my biggest expense category?",
    "Give me budgeting tips",
  ]

  const sendUserMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.text })),
          financialData,
          currency,
        }),
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = (await response.json()) as { text?: string }
      const assistantText = data.text?.trim() || "I could not generate a response right now."

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: assistantText,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "I ran into a connection issue. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return
    void sendUserMessage(inputValue)
    setInputValue("")
  }

  const handleSuggestedPrompt = (prompt: string) => {
    void sendUserMessage(prompt)
  }

  return (
    <Card className="flex h-[calc(100vh-12rem)] min-h-0 flex-col md:h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Budget Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1 pr-4">
          <div className="flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-6 text-sm text-muted-foreground">
                  Ask me about your spending, income, or budgeting tips!
                </p>
                <div className="grid gap-2 w-full max-w-sm">
                  {suggestedPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      onClick={() => handleSuggestedPrompt(prompt)}
                      disabled={isLoading}
                      className="justify-start text-left text-sm h-auto py-2"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      message.role === "user" ? "bg-foreground" : "bg-muted"
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4 text-background" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.role === "user" ? "bg-foreground text-background" : "bg-muted"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground"></span>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground delay-75"></span>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground delay-150"></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="mt-4 flex shrink-0 gap-2">
          <Input
            id="budget-chat-input"
            name="budgetChatInput"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your finances..."
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
