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
  const { wallets, addTransaction, updateTransaction } = useBudget()
  const [type, setType] = useState<TransactionType>("expense")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<Category>("food")
  const [walletId, setWalletId] = useState("")
  const [date, setDate] = useState("")
  const [customCategory, setCustomCategory] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (transaction) {
      setType(transaction.type)
      setAmount(transaction.amount.toString())
      setCategory(transaction.category)
      setWalletId(transaction.walletId)
      setDate(transaction.date)
      setCustomCategory(transaction.customCategory || "")
      setDescription(transaction.description || "")
    } else {
      setType("expense")
      setAmount("")
      setCategory("food")
      setWalletId(wallets[0]?.id || "")
      setDate(new Date().toISOString().split("T")[0])
      setCustomCategory("")
      setDescription("")
    }
  }, [transaction, wallets, open])

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const handleSubmit = (e: React.FormEvent) => {
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

    if (transaction) {
      updateTransaction(transaction.id, transactionData)
    } else {
      addTransaction(transactionData)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <DialogFooter className="pt-4">
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
