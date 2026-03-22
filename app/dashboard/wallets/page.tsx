import { WalletsList } from "@/components/wallets-list"

export default function WalletsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wallets</h1>
        <p className="text-sm text-muted-foreground">
          Manage your accounts and balances
        </p>
      </div>

      <WalletsList />
    </div>
  )
}
