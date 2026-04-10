// Debts and receivables management panel: lists entries with progress bars, supports add/edit/delete, mark-as-paid, and payment logging.

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useBudget } from "@/lib/budget-context"
import { useCurrency } from "@/lib/currency-context"
import { DebtDialog } from "./debt-dialog"
import type { Debt } from "@/lib/types"
import { Plus, Pencil, Trash2, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function DebtsList() {
  const { debts, wallets, deleteDebt, recordDebtPayment } = useBudget()
  const { formatAmount } = useCurrency()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentWalletId, setPaymentWalletId] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [filter, setFilter] = useState<"all" | "owed_by_me" | "owed_to_me">("all")
  const [statusFilter, setStatusFilter] = useState<"active" | "paid">("active")

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingDebt(null)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteDebt(id)
  }

  const handleOpenPayment = (debt: Debt) => {
    setPayingDebt(debt)
    setPaymentAmount("")
    setPaymentWalletId(wallets[0]?.id ?? "")
    setPaymentDate(new Date().toISOString().split("T")[0])
    setPaymentDialogOpen(true)
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payingDebt || !paymentWalletId) return
    const parsed = Number.parseFloat(paymentAmount)
    if (Number.isNaN(parsed) || parsed <= 0) return

    setIsProcessing(true)
    try {
      await recordDebtPayment(payingDebt.id, parsed, paymentWalletId, paymentDate)
      setPaymentDialogOpen(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const filtered = debts.filter((d) => {
    const typeMatch = filter === "all" || d.type === filter
    const statusMatch = d.status === statusFilter
    return typeMatch && statusMatch
  })

  const isOverdue = (debt: Debt) =>
    debt.dueDate &&
    debt.status === "active" &&
    new Date(debt.dueDate) < new Date(new Date().toDateString())

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Debts &amp; Receivables</CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="owed_by_me">I Owe</TabsTrigger>
                <TabsTrigger value="owed_to_me">Owed to Me</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No {statusFilter} {filter === "all" ? "debts" : filter === "owed_by_me" ? "debts" : "receivables"} found.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((debt) => {
                const remaining = debt.amount - debt.paidAmount
                const progress = (debt.paidAmount / debt.amount) * 100
                const overdue = isOverdue(debt)

                return (
                  <div
                    key={debt.id}
                    className={cn(
                      "group flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50",
                      overdue && "border-destructive/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{debt.name}</p>
                          <Badge
                            variant={debt.type === "owed_by_me" ? "destructive" : "default"}
                            className="shrink-0 text-xs"
                          >
                            {debt.type === "owed_by_me" ? "I Owe" : "Owed to Me"}
                          </Badge>
                          {overdue && (
                            <Badge variant="destructive" className="shrink-0 text-xs">
                              Overdue
                            </Badge>
                          )}
                          {debt.status === "paid" && (
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              Paid
                            </Badge>
                          )}
                        </div>
                        {debt.dueDate && (
                          <p className={cn("text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
                            Due: {new Date(debt.dueDate).toLocaleDateString()}
                          </p>
                        )}
                        {debt.description && (
                          <p className="text-xs text-muted-foreground truncate">{debt.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {debt.status === "active" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenPayment(debt)}
                            title="Record payment"
                            className="opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(debt)}
                          className="opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this debt record?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{debt.name}" and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(debt.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatAmount(debt.paidAmount)} paid
                        </span>
                        <span className={cn("font-medium", debt.status === "active" ? "text-foreground" : "text-muted-foreground")}>
                          {formatAmount(remaining)} remaining
                        </span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground text-right">
                        Total: {formatAmount(debt.amount)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DebtDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        debt={editingDebt}
      />

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {payingDebt
                ? `Record a payment for "${payingDebt.name}". Remaining: ${formatAmount(payingDebt.amount - payingDebt.paidAmount)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="payment-amount">Payment Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={payingDebt ? payingDebt.amount - payingDebt.paidAmount : undefined}
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="payment-wallet">Wallet</Label>
              <Select value={paymentWalletId} onValueChange={setPaymentWalletId} required>
                <SelectTrigger id="payment-wallet">
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="payment-date">Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isProcessing}>
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
