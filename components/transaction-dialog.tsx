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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBudget } from "@/lib/budget-context"
import {
  type Transaction,
  type TransactionType,
  type Category,
  type RecurringFrequency,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CATEGORY_LABELS,
} from "@/lib/types"

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
}

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
}: TransactionDialogProps) {
  const { wallets, addTransaction, updateTransaction, addRecurringTemplate } = useBudget()
  const [type, setType] = useState<TransactionType>("expense")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<Category>("food")
  const [walletId, setWalletId] = useState("")
  const [date, setDate] = useState("")
  const [customCategory, setCustomCategory] = useState("")
  const [description, setDescription] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly")

  const shiftDateByFrequency = (dateKey: string, selectedFrequency: RecurringFrequency): string => {
    const [year, month, day] = dateKey.split("-").map((part) => Number(part))
    const base = new Date(year, (month || 1) - 1, day || 1)

    if (selectedFrequency === "daily") {
      base.setDate(base.getDate() + 1)
    } else if (selectedFrequency === "weekly") {
      base.setDate(base.getDate() + 7)
    } else if (selectedFrequency === "monthly") {
      base.setMonth(base.getMonth() + 1)
    } else {
      base.setFullYear(base.getFullYear() + 1)
    }

    const nextYear = base.getFullYear()
    const nextMonth = String(base.getMonth() + 1).padStart(2, "0")
    const nextDay = String(base.getDate()).padStart(2, "0")
    return `${nextYear}-${nextMonth}-${nextDay}`
  }

  useEffect(() => {
    if (transaction) {
      setType(transaction.type)
      setAmount(transaction.amount.toString())
      setCategory(transaction.category)
      setWalletId(transaction.walletId)
      setDate(transaction.date)
      setCustomCategory(transaction.customCategory || "")
      setDescription(transaction.description || "")
      setIsRecurring(false)
      setFrequency("monthly")
    } else {
      setType("expense")
      setAmount("")
      setCategory("food")
      setWalletId(wallets[0]?.id || "")
      setDate(new Date().toISOString().split("T")[0])
      setCustomCategory("")
      setDescription("")
      setIsRecurring(false)
      setFrequency("monthly")
    }
  }, [transaction, wallets, open])

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !walletId) return

    const trimmedCustomCategory = customCategory.trim()
    const trimmedDescription = description.trim()

    if (category === "other" && !trimmedCustomCategory) {
      return
    }

    const transactionData = {
      amount: parseFloat(amount),
      type,
      category,
      customCategory: category === "other" ? trimmedCustomCategory : "",
      walletId,
      date,
      description: trimmedDescription,
    }

    try {
      if (transaction) {
        await updateTransaction(transaction.id, transactionData)
      } else if (isRecurring) {
        const recurringName =
          trimmedDescription ||
          CATEGORY_LABELS[category] ||
          (type === "income" ? "Recurring income" : "Recurring expense")

        const templateId = await addRecurringTemplate({
          name: recurringName,
          amount: parseFloat(amount),
          type,
          category,
          customCategory: category === "other" ? trimmedCustomCategory : "",
          walletId,
          description: trimmedDescription,
          frequency,
          startDate: date,
          nextRunDate: shiftDateByFrequency(date, frequency),
        })

        await addTransaction({
          ...transactionData,
          recurringTemplateId: templateId,
          isRecurringInstance: true,
        })
      } else {
        await addTransaction(transactionData)
      }

      onOpenChange(false)
    } catch (error) {
      console.error("Error saving transaction:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md sm:h-[78vh] sm:max-h-[78vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? "Update the transaction details, category, wallet, and date."
              : "Add a new income or expense transaction and assign it to a wallet."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="flex flex-col gap-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={type}
              onValueChange={(value: TransactionType) => {
                setType(value)
                setCategory(value === "expense" ? "food" : "salary")
                setCustomCategory("")
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(value: Category) => {
                  setCategory(value)
                  if (value !== "other") {
                    setCustomCategory("")
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {category === "other" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="customCategory">Specify Category</Label>
                <Input
                  id="customCategory"
                  placeholder="e.g., Pet care, Side project"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="wallet">Wallet</Label>
              <Select value={walletId} onValueChange={setWalletId}>
                <SelectTrigger>
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
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {!transaction && (
              <>
                <div className="flex items-center gap-2 rounded-md border p-3">
                  <Checkbox
                    id="isRecurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => setIsRecurring(Boolean(checked))}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="isRecurring" className="cursor-pointer">Make this recurring</Label>
                    <p className="text-xs text-muted-foreground">
                      Budgetly will auto-create future transactions using this schedule.
                    </p>
                  </div>
                </div>

                {isRecurring && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={frequency} onValueChange={(value: RecurringFrequency) => setFrequency(value)}>
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="pt-4 mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {transaction ? "Save Changes" : "Add Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
