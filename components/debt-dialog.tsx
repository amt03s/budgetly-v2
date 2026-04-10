// Form dialog for creating or editing a debt or receivable entry (amount, type, due date, notes).

"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import type { Debt, DebtType } from "@/lib/types"

interface DebtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt?: Debt | null
}

export function DebtDialog({ open, onOpenChange, debt }: DebtDialogProps) {
  const { addDebt, updateDebt } = useBudget()
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<DebtType>("owed_by_me")
  const [dueDate, setDueDate] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (debt) {
      setName(debt.name)
      setAmount(debt.amount.toString())
      setType(debt.type)
      setDueDate(debt.dueDate ?? "")
      setDescription(debt.description ?? "")
    } else {
      setName("")
      setAmount("")
      setType("owed_by_me")
      setDueDate("")
      setDescription("")
    }
  }, [debt, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = Number.parseFloat(amount)
    if (!name.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) return

    setIsSubmitting(true)
    try {
      if (debt) {
        await updateDebt(debt.id, {
          name: name.trim(),
          amount: parsedAmount,
          type,
          dueDate: dueDate || undefined,
          description: description.trim() || undefined,
        })
      } else {
        await addDebt({
          name: name.trim(),
          amount: parsedAmount,
          type,
          dueDate: dueDate || undefined,
          description: description.trim() || undefined,
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
          <DialogTitle>{debt ? "Edit Debt" : "Add Debt"}</DialogTitle>
          <DialogDescription>
            {debt
              ? "Update the details of this debt."
              : "Track money you owe or money owed to you."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="debt-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as DebtType)}>
              <SelectTrigger id="debt-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owed_by_me">I owe (Debt)</SelectItem>
                <SelectItem value="owed_to_me">Owed to me (Receivable)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="debt-name">
              {type === "owed_by_me" ? "Creditor Name" : "Debtor Name"}
            </Label>
            <Input
              id="debt-name"
              placeholder={type === "owed_by_me" ? "e.g., John, Bank XYZ" : "e.g., Alice, Client ABC"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="debt-amount">Amount</Label>
            <Input
              id="debt-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="debt-due-date">Due Date (optional)</Label>
            <Input
              id="debt-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="debt-description">Notes (optional)</Label>
            <Textarea
              id="debt-description"
              placeholder="Additional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {debt ? "Save Changes" : "Add Debt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
