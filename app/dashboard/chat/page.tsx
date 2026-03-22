import { AIChat } from "@/components/ai-chat"

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Chat</h1>
        <p className="text-sm text-muted-foreground">
          Get personalized financial advice
        </p>
      </div>

      <AIChat />
    </div>
  )
}
