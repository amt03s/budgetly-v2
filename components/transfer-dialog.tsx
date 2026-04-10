// Form dialog for creating a fund transfer between two wallets, recording paired debit and credit transactions.

"use client"

import { useEffect, useMemo, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBudget } from "@/lib/budget-context"

interface TransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransferDialog({ open, onOpenChange }: TransferDialogProps) {
  const { wallets, transferBetweenWallets } = useBudget()
  const [fromWalletId, setFromWalletId] = useState("")
  const [toWalletId, setToWalletId] = useState("")
  const [amount, setAmount] = useState("")
  const [transferFee, setTransferFee] = useState("")
  const [date, setDate] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    if (!open) {
      return
    }

    const firstWalletId = wallets[0]?.id ?? ""
    const secondWalletId = wallets.find((w) => w.id !== firstWalletId)?.id ?? ""

    setFromWalletId(firstWalletId)
    setToWalletId(secondWalletId)
    setAmount("")
    setTransferFee("")
    setDate(new Date().toISOString().split("T")[0])
    setNote("")
  }, [open, wallets])

  const toWalletOptions = useMemo(
    () => wallets.filter((wallet) => wallet.id !== fromWalletId),
    [wallets, fromWalletId]
  )

  useEffect(() => {
    if (!toWalletOptions.length) {
      setToWalletId("")
      return
    }

    const isCurrentDestinationValid = toWalletOptions.some(
      (wallet) => wallet.id === toWalletId
    )
    if (!isCurrentDestinationValid) {
      setToWalletId(toWalletOptions[0].id)
    }
  }, [toWalletOptions, toWalletId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = Number.parseFloat(amount)
    const parsedFee = transferFee.trim() === "" ? 0 : Number.parseFloat(transferFee)
    if (
      !fromWalletId ||
      !toWalletId ||
      Number.isNaN(parsedAmount) ||
      parsedAmount <= 0 ||
      Number.isNaN(parsedFee) ||
      parsedFee < 0
    ) {
      return
    }

    await transferBetweenWallets({
      fromWalletId,
      toWalletId,
      amount: parsedAmount,
      fee: parsedFee,
      date,
      note,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Between Wallets</DialogTitle>
          <DialogDescription>
            Move money from one wallet to another. This will create matching transfer
            transactions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fromWallet">From Wallet</Label>
            <Select value={fromWalletId} onValueChange={setFromWalletId}>
              <SelectTrigger id="fromWallet">
                <SelectValue placeholder="Select source wallet" />
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
            <Label htmlFor="toWallet">To Wallet</Label>
            <Select value={toWalletId} onValueChange={setToWalletId}>
              <SelectTrigger id="toWallet">
                <SelectValue placeholder="Select destination wallet" />
              </SelectTrigger>
              <SelectContent>
                {toWalletOptions.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="transferAmount">Amount</Label>
            <Input
              id="transferAmount"
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
            <Label htmlFor="transferFee">Transfer Fee (optional)</Label>
            <Input
              id="transferFee"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={transferFee}
              onChange={(e) => setTransferFee(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="transferDate">Date</Label>
            <Input
              id="transferDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="transferNote">Note (optional)</Label>
            <Input
              id="transferNote"
              placeholder="e.g., Move to savings"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={wallets.length < 2 || !fromWalletId || !toWalletId || fromWalletId === toWalletId}
            >
              Transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}