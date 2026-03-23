import { SavingGoalsList } from "@/components/saving-goals-list"

export default function GoalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Saving Goals</h1>
        <p className="text-sm text-muted-foreground">
          Plan future targets and record your saving progress
        </p>
      </div>

      <SavingGoalsList />
    </div>
  )
}
