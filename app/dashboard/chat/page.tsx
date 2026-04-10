// Route page for the AI chat ("Budge") interface.

import { AIChat } from "@/components/ai-chat"

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budge</h1>
        <p className="text-sm text-muted-foreground">
          Chat with your AI budgeting guide
        </p>
      </div>

      <AIChat />
    </div>
  )
}
