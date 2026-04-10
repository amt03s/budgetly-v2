// Form dialog for creating or editing a saving goal (name, target amount, deadline, current progress).

"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBudget } from "@/lib/budget-context"
import type { SavingGoal } from "@/lib/types"

interface SavingGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: SavingGoal | null
}

export function SavingGoalDialog({ open, onOpenChange, goal }: SavingGoalDialogProps) {
  const { wallets, addSavingGoal, updateSavingGoal } = useBudget()
  const [name, setName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [walletId, setWalletId] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (goal) {
      setName(goal.name)
      setTargetAmount(goal.targetAmount.toString())
      setWalletId(goal.walletId)
      setTargetDate(goal.targetDate ?? "")
      setNote(goal.note ?? "")
      return
    }

    setName("")
    setTargetAmount("")
    setWalletId(wallets[0]?.id ?? "")
    setTargetDate("")
    setNote("")
  }, [goal, open, wallets])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedTarget = Number.parseFloat(targetAmount)
    if (!name.trim() || !walletId || Number.isNaN(parsedTarget) || parsedTarget <= 0) {
      return
    }

    setIsSubmitting(true)
    try {
      if (goal) {
        await updateSavingGoal(goal.id, {
          name: name.trim(),
          targetAmount: parsedTarget,
          walletId,
          targetDate: targetDate || undefined,
          note: note.trim() || undefined,
        })
      } else {
        await addSavingGoal({
          name: name.trim(),
          targetAmount: parsedTarget,
          walletId,
          targetDate: targetDate || undefined,
          note: note.trim() || undefined,
        })
      }
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit Saving Goal" : "Add Saving Goal"}</DialogTitle>
          <DialogDescription>
            {goal
              ? "Update your target details and timeline."
              : "Create a goal and track your progress over time."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="saving-goal-name">Goal Name</Label>
            <Input
              id="saving-goal-name"
              placeholder="e.g., Emergency Fund"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="saving-goal-target">Target Amount</Label>
            <Input
              id="saving-goal-target"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="saving-goal-wallet">Source Wallet</Label>
            <Select value={walletId} onValueChange={setWalletId}>
              <SelectTrigger id="saving-goal-wallet">
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="saving-goal-date">Target Date (optional)</Label>
            <Input
              id="saving-goal-date"
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="saving-goal-note">Notes (optional)</Label>
            <Textarea
              id="saving-goal-note"
              rows={2}
              placeholder="Add context for this goal"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || wallets.length === 0}>
              {goal ? "Save Changes" : "Add Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
