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
import { useBudget } from "@/lib/budget-context"
import type { Wallet } from "@/lib/types"

interface WalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallet?: Wallet | null
}

export function WalletDialog({ open, onOpenChange, wallet }: WalletDialogProps) {
  const { addWallet, updateWallet } = useBudget()
  const [name, setName] = useState("")
  const [initialBalance, setInitialBalance] = useState("0")

  useEffect(() => {
    if (wallet) {
      setName(wallet.name)
      setInitialBalance((wallet.initialBalance ?? wallet.balance).toString())
    } else {
      setName("")
      setInitialBalance("0")
    }
  }, [wallet, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedInitialBalance = Number.parseFloat(initialBalance || "0")

    if (!name.trim() || Number.isNaN(parsedInitialBalance)) return

    if (wallet) {
      updateWallet(wallet.id, {
        name: name.trim(),
        initialBalance: parsedInitialBalance,
      })
    } else {
      addWallet({
        name: name.trim(),
        initialBalance: parsedInitialBalance,
      })
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{wallet ? "Edit Wallet" : "Add Wallet"}</DialogTitle>
          <DialogDescription>
            {wallet
              ? "Update the wallet name and starting balance."
              : "Create a wallet and set its starting balance before any transactions."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Wallet Name</Label>
            <Input
              id="name"
              placeholder="e.g., Cash, Bank Account, GCash"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="initialBalance">Starting Balance</Label>
            <Input
              id="initialBalance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              This sets the wallet's starting amount before any transactions.
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{wallet ? "Save Changes" : "Add Wallet"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
