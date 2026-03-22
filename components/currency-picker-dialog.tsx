"use client"

import { useState } from "react"
import { Check, Globe } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SUPPORTED_CURRENCIES } from "@/lib/currency"
import { useCurrency } from "@/lib/currency-context"
import { cn } from "@/lib/utils"

interface CurrencyPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When true, the dialog cannot be dismissed without choosing a currency */
  required?: boolean
}

export function CurrencyPickerDialog({
  open,
  onOpenChange,
  required = false,
}: CurrencyPickerDialogProps) {
  const { currency, setCurrency } = useCurrency()
  const [selected, setSelected] = useState(currency)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await setCurrency(selected)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={required ? undefined : onOpenChange}
    >
      <DialogContent className="max-w-md" onInteractOutside={required ? (e) => e.preventDefault() : undefined}>
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <DialogTitle>Choose your currency</DialogTitle>
          </div>
          <DialogDescription>
            {required
              ? "Pick the currency you want to use for all your transactions."
              : "Amounts will be converted using live exchange rates."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="mt-2 h-72 rounded-lg border">
          <div className="p-1">
            {SUPPORTED_CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setSelected(c.code)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                  selected === c.code
                    ? "bg-foreground text-background"
                    : "hover:bg-muted"
                )}
              >
                <span className="w-8 shrink-0 text-base leading-none">
                  {c.symbol}
                </span>
                <span className="flex-1 font-medium">{c.label}</span>
                <span className="text-xs opacity-60">{c.code}</span>
                {selected === c.code && (
                  <Check className="ml-1 h-4 w-4 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-2">
          {!required && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : required ? "Get started" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
