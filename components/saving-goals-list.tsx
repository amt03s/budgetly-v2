// Saving goals management panel: lists goals with progress bars, supports add/edit/delete, and allows depositing or withdrawing funds from a goal.

"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useBudget } from "@/lib/budget-context"
import { useCurrency } from "@/lib/currency-context"
import type { SavingGoal } from "@/lib/types"
import { Plus, Pencil, Trash2, PiggyBank } from "lucide-react"
import { SavingGoalDialog } from "./saving-goal-dialog"
import { cn } from "@/lib/utils"

export function SavingGoalsList() {
  const {
    savingGoals,
    wallets,
    deleteSavingGoal,
    recordGoalContribution,
    recordGoalWithdrawal,
  } = useBudget()
  const { formatAmount } = useCurrency()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null)
  const [contributeOpen, setContributeOpen] = useState(false)
  const [activeGoal, setActiveGoal] = useState<SavingGoal | null>(null)
  const [contributionAmount, setContributionAmount] = useState("")
  const [contributionDate, setContributionDate] = useState("")
  const [isSubmittingContribution, setIsSubmittingContribution] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawGoal, setWithdrawGoal] = useState<SavingGoal | null>(null)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawDate, setWithdrawDate] = useState("")
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false)

  const totals = useMemo(() => {
    const target = savingGoals.reduce((sum, goal) => sum + goal.targetAmount, 0)
    const saved = savingGoals.reduce((sum, goal) => sum + goal.savedAmount, 0)
    const activeCount = savingGoals.filter((goal) => goal.status === "active").length
    return {
      target,
      saved,
      activeCount,
      percent: target > 0 ? Math.min((saved / target) * 100, 100) : 0,
    }
  }, [savingGoals])

  const handleAdd = () => {
    setEditingGoal(null)
    setDialogOpen(true)
  }

  const handleEdit = (goal: SavingGoal) => {
    setEditingGoal(goal)
    setDialogOpen(true)
  }

  const handleDelete = async (goalId: string) => {
    await deleteSavingGoal(goalId)
  }

  const handleOpenContribute = (goal: SavingGoal) => {
    setActiveGoal(goal)
    setContributionAmount("")
    setContributionDate(new Date().toISOString().split("T")[0])
    setContributeOpen(true)
  }

  const handleContribute = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!activeGoal) {
      return
    }

    const parsedAmount = Number.parseFloat(contributionAmount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return
    }

    setIsSubmittingContribution(true)
    try {
      await recordGoalContribution(activeGoal.id, parsedAmount, contributionDate)
      setContributeOpen(false)
    } finally {
      setIsSubmittingContribution(false)
    }
  }

  const handleOpenWithdraw = (goal: SavingGoal) => {
    setWithdrawGoal(goal)
    setWithdrawAmount("")
    setWithdrawDate(new Date().toISOString().split("T")[0])
    setWithdrawOpen(true)
  }

  const handleWithdraw = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!withdrawGoal) {
      return
    }

    const parsedAmount = Number.parseFloat(withdrawAmount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return
    }

    setIsSubmittingWithdraw(true)
    try {
      await recordGoalWithdrawal(withdrawGoal.id, parsedAmount, withdrawDate)
      setWithdrawOpen(false)
    } finally {
      setIsSubmittingWithdraw(false)
    }
  }

  const getWalletName = (walletId: string) => wallets.find((wallet) => wallet.id === walletId)?.name ?? "Unknown wallet"

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Saving Goals</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {totals.activeCount} active • {formatAmount(totals.saved)} saved of {formatAmount(totals.target)}
            </p>
          </div>
          <Button onClick={handleAdd} size="sm" disabled={wallets.length === 0}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {savingGoals.length > 0 && (
            <div className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">All goals progress</span>
                <span className="font-medium">{totals.percent.toFixed(0)}%</span>
              </div>
              <Progress value={totals.percent} className="h-2" />
            </div>
          )}

          {wallets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Create a wallet before adding saving goals.
            </p>
          ) : savingGoals.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No saving goals yet. Add your first goal to start tracking.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {savingGoals.map((goal) => {
                const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0)
                const progress = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0
                const isCompleted = goal.status === "completed"

                return (
                  <div
                    key={goal.id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{goal.name}</p>
                          <Badge variant={isCompleted ? "secondary" : "default"}>
                            {isCompleted ? "Completed" : "Active"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Wallet: {getWalletName(goal.walletId)}
                        </p>
                        {goal.targetDate && (
                          <p className="text-xs text-muted-foreground">
                            Target date: {new Date(goal.targetDate).toLocaleDateString()}
                          </p>
                        )}
                        {goal.note && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{goal.note}</p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        {!isCompleted && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenContribute(goal)}
                            className="h-8"
                          >
                            <PiggyBank className="mr-1 h-4 w-4" />
                            Save
                          </Button>
                        )}
                        {goal.savedAmount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenWithdraw(goal)}
                            className="h-8"
                          >
                            Withdraw
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(goal)}
                          className="opacity-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="opacity-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this saving goal?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{goal.name}" and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(goal.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{formatAmount(goal.savedAmount)} saved</span>
                        <span className={cn("font-medium", isCompleted ? "text-green-600" : "text-foreground")}>
                          {formatAmount(remaining)} remaining
                        </span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                      <p className="mt-1 text-right text-xs text-muted-foreground">
                        Target: {formatAmount(goal.targetAmount)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <SavingGoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editingGoal}
      />

      <Dialog open={contributeOpen} onOpenChange={setContributeOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
            <DialogDescription>
              {activeGoal
                ? `Record a savings contribution for \"${activeGoal.name}\".`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleContribute} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-contribution-amount">Amount</Label>
              <Input
                id="goal-contribution-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={contributionAmount}
                onChange={(event) => setContributionAmount(event.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-contribution-date">Date</Label>
              <Input
                id="goal-contribution-date"
                type="date"
                value={contributionDate}
                onChange={(event) => setContributionDate(event.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setContributeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingContribution}>
                Save Contribution
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Withdraw Savings</DialogTitle>
            <DialogDescription>
              {withdrawGoal
                ? `Move money back from \"${withdrawGoal.name}\" to its wallet.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWithdraw} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-withdraw-amount">Amount</Label>
              <Input
                id="goal-withdraw-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={withdrawGoal?.savedAmount}
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(event) => setWithdrawAmount(event.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-withdraw-date">Date</Label>
              <Input
                id="goal-withdraw-date"
                type="date"
                value={withdrawDate}
                onChange={(event) => setWithdrawDate(event.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setWithdrawOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingWithdraw}>
                Confirm Withdrawal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
