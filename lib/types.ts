// Shared TypeScript types and enums for the whole application (Transaction, Wallet, Debt, SavingGoal, RecurringTransactionTemplate, etc.).

export type TransactionType = "income" | "expense"

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly"

export type Category =
  | "food"
  | "transport"
  | "bills"
  | "entertainment"
  | "shopping"
  | "health"
  | "education"
  | "rent"
  | "savings"
  | "allowance"
  | "work_income"
  | "salary"
  | "bonus"
  | "commission"
  | "freelance"
  | "investment"
  | "gift"
  | "other"

export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  category: Category
  customCategory?: string
  savingGoalId?: string
  createdAt?: number
  transferId?: string
  walletId: string
  date: string
  description?: string
  recurringTemplateId?: string
  isRecurringInstance?: boolean
}

export interface RecurringTransactionTemplate {
  id: string
  name: string
  amount: number
  type: TransactionType
  category: Category
  customCategory?: string
  walletId: string
  description?: string
  frequency: RecurringFrequency
  startDate: string
  nextRunDate: string
  endDate?: string
  isPaused: boolean
  createdAt: number
  lastGeneratedAt?: number
}

export interface Wallet {
  id: string
  name: string
  initialBalance: number
  balance: number
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export type DebtType = "owed_by_me" | "owed_to_me"
export type DebtStatus = "active" | "paid"

export interface Debt {
  id: string
  name: string
  amount: number
  paidAmount: number
  type: DebtType
  dueDate?: string
  description?: string
  createdAt: number
  status: DebtStatus
}

export type SavingGoalStatus = "active" | "completed"

export interface SavingGoal {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  walletId: string
  targetDate?: string
  note?: string
  createdAt: number
  status: SavingGoalStatus
}

export const EXPENSE_CATEGORIES: Category[] = [
  "food",
  "transport",
  "bills",
  "entertainment",
  "shopping",
  "health",
  "education",
  "rent",
  "savings",
  "gift",
  "other",
]

export const INCOME_CATEGORIES: Category[] = [
  "allowance",
  "work_income",
  "salary",
  "bonus",
  "commission",
  "freelance",
  "investment",
  "gift",
  "other",
]

export const ALL_CATEGORIES: Category[] = [
  ...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES.filter((c) => c !== "other")]),
]

export const CATEGORY_LABELS: Record<Category, string> = {
  food: "Food & Dining",
  transport: "Transportation",
  bills: "Bills & Utilities",
  entertainment: "Entertainment",
  shopping: "Shopping",
  health: "Health",
  education: "Education",
  rent: "Rent",
  savings: "Savings",
  allowance: "Allowance",
  work_income: "Work Income",
  salary: "Salary",
  bonus: "Bonus",
  commission: "Commission",
  freelance: "Freelance",
  investment: "Investment",
  gift: "Gift",
  other: "Other",
}

export function getTransactionCategoryLabel(
  transaction: Pick<Transaction, "category" | "customCategory">
): string {
  if (transaction.category === "other" && transaction.customCategory?.trim()) {
    return transaction.customCategory.trim()
  }

  return CATEGORY_LABELS[transaction.category]
}
