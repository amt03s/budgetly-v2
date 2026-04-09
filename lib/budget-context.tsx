"use client"

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore"
import { db } from "./firebase"
import type {
  Transaction,
  Wallet,
  ChatMessage,
  Debt,
  SavingGoal,
  RecurringTransactionTemplate,
  RecurringFrequency,
} from "./types"
import { useAuth } from "./auth-context"

interface BudgetContextType {
  transactions: Transaction[]
  wallets: Wallet[]
  chatMessages: ChatMessage[]
  debts: Debt[]
  savingGoals: SavingGoal[]
  recurringTemplates: RecurringTransactionTemplate[]
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  addWallet: (wallet: Pick<Wallet, "name" | "initialBalance">) => Promise<void>
  updateWallet: (id: string, wallet: Partial<Wallet>) => Promise<void>
  deleteWallet: (id: string) => Promise<void>
  transferBetweenWallets: (params: {
    fromWalletId: string
    toWalletId: string
    amount: number
    fee?: number
    date: string
    note?: string
  }) => Promise<void>
  addChatMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void
  addDebt: (debt: Omit<Debt, "id" | "createdAt" | "paidAmount" | "status">) => Promise<void>
  updateDebt: (id: string, updates: Partial<Omit<Debt, "id">>) => Promise<void>
  deleteDebt: (id: string) => Promise<void>
  recordDebtPayment: (id: string, paymentAmount: number, walletId: string, date: string) => Promise<void>
  addSavingGoal: (goal: Omit<SavingGoal, "id" | "savedAmount" | "createdAt" | "status">) => Promise<void>
  updateSavingGoal: (id: string, updates: Partial<Omit<SavingGoal, "id">>) => Promise<void>
  deleteSavingGoal: (id: string) => Promise<void>
  recordGoalContribution: (id: string, amount: number, date: string) => Promise<void>
  recordGoalWithdrawal: (id: string, amount: number, date: string) => Promise<void>
  addRecurringTemplate: (template: Omit<RecurringTransactionTemplate, "id" | "createdAt" | "lastGeneratedAt" | "isPaused">) => Promise<string>
  updateRecurringTemplate: (id: string, updates: Partial<Omit<RecurringTransactionTemplate, "id" | "createdAt">>) => Promise<void>
  toggleRecurringTemplatePaused: (id: string, paused: boolean) => Promise<void>
  deleteRecurringTemplate: (id: string) => Promise<void>
  runRecurringTemplateNow: (id: string) => Promise<void>
  totalBalance: number
  totalIncome: number
  totalExpenses: number
  totalDebt: number
  totalReceivable: number
  getWalletById: (id: string) => Wallet | undefined
  getTransactionsByWallet: (walletId: string) => Transaction[]
  isLoading: boolean
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

function toDateKey(input: Date): string {
  const year = input.getFullYear()
  const month = String(input.getMonth() + 1).padStart(2, "0")
  const day = String(input.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function shiftDateByFrequency(dateKey: string, frequency: RecurringFrequency): string {
  const [year, month, day] = dateKey.split("-").map((part) => Number(part))
  const base = new Date(year, (month || 1) - 1, day || 1)

  if (frequency === "daily") {
    base.setDate(base.getDate() + 1)
  } else if (frequency === "weekly") {
    base.setDate(base.getDate() + 7)
  } else if (frequency === "monthly") {
    base.setMonth(base.getMonth() + 1)
  } else {
    base.setFullYear(base.getFullYear() + 1)
  }

  return toDateKey(base)
}

function omitUndefinedFields<T extends Record<string, any>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as Partial<T>
}

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([])
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTransactionTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isGeneratingRecurringRef = useRef(false)

  const walletCollection = useMemo(() => {
    if (!user) {
      return null
    }

    return collection(db, "users", user.uid, "wallets")
  }, [user])

  const transactionCollection = useMemo(() => {
    if (!user) {
      return null
    }

    return collection(db, "users", user.uid, "transactions")
  }, [user])

  const debtCollection = useMemo(() => {
    if (!user) {
      return null
    }

    return collection(db, "users", user.uid, "debts")
  }, [user])

  const goalCollection = useMemo(() => {
    if (!user) {
      return null
    }

    return collection(db, "users", user.uid, "savingGoals")
  }, [user])

  const recurringTemplateCollection = useMemo(() => {
    if (!user) {
      return null
    }

    return collection(db, "users", user.uid, "recurringTemplates")
  }, [user])

  // Subscribe to wallets collection
  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!walletCollection) {
      setWallets([])
      setTransactions([])
      setChatMessages([])
      setDebts([])
      setSavingGoals([])
      setRecurringTemplates([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setWallets([])
    const walletsQuery = query(walletCollection, orderBy("name"))
    const unsubscribe = onSnapshot(
      walletsQuery,
      (snapshot) => {
        const walletsData: Wallet[] = snapshot.docs.map((walletDoc) => {
          const data = walletDoc.data()
          const initialBalance =
            typeof data.initialBalance === "number"
              ? data.initialBalance
              : typeof data.balance === "number"
                ? data.balance
                : 0

          return {
            id: walletDoc.id,
            name: typeof data.name === "string" ? data.name : "Unnamed Wallet",
            initialBalance,
            balance: initialBalance,
          }
        })
        setWallets(walletsData)
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching wallets:", error)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [isAuthLoading, walletCollection])

  // Subscribe to transactions collection
  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!transactionCollection) {
      setTransactions([])
      return
    }

    setTransactions([])
    const transactionsQuery = query(transactionCollection, orderBy("date", "desc"))
    const unsubscribe = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const transactionsData: Transaction[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[]
        setTransactions(transactionsData)
      },
      (error) => {
        console.error("Error fetching transactions:", error)
      }
    )

    return () => unsubscribe()
  }, [isAuthLoading, transactionCollection])

  // Subscribe to debts collection
  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!debtCollection) {
      setDebts([])
      return
    }

    const debtsQuery = query(debtCollection, orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(
      debtsQuery,
      (snapshot) => {
        const debtsData: Debt[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Debt[]
        setDebts(debtsData)
      },
      (error) => {
        console.error("Error fetching debts:", error)
      }
    )

    return () => unsubscribe()
  }, [isAuthLoading, debtCollection])

  // Subscribe to savings goals collection
  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!goalCollection) {
      setSavingGoals([])
      return
    }

    const goalsQuery = query(goalCollection, orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(
      goalsQuery,
      (snapshot) => {
        const goalsData: SavingGoal[] = snapshot.docs.map((goalDoc) => ({
          id: goalDoc.id,
          ...goalDoc.data(),
        })) as SavingGoal[]
        setSavingGoals(goalsData)
      },
      (error) => {
        console.error("Error fetching saving goals:", error)
      }
    )

    return () => unsubscribe()
  }, [isAuthLoading, goalCollection])

  // Subscribe to recurring templates collection
  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!recurringTemplateCollection) {
      setRecurringTemplates([])
      return
    }

    const recurringQuery = query(recurringTemplateCollection, orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(
      recurringQuery,
      (snapshot) => {
        const templateData: RecurringTransactionTemplate[] = snapshot.docs.map((templateDoc) => ({
          id: templateDoc.id,
          ...templateDoc.data(),
        })) as RecurringTransactionTemplate[]

        setRecurringTemplates(templateData)
      },
      (error) => {
        console.error("Error fetching recurring templates:", error)
      }
    )

    return () => unsubscribe()
  }, [isAuthLoading, recurringTemplateCollection])

  // Calculate wallet balances from transactions
  const walletsWithBalances = useMemo(() => {
    const balances: Record<string, number> = {}
    wallets.forEach((w) => {
      balances[w.id] = w.initialBalance
    })

    transactions.forEach((txn) => {
      if (balances[txn.walletId] !== undefined) {
        if (txn.type === "income") {
          balances[txn.walletId] += txn.amount
        } else {
          balances[txn.walletId] -= txn.amount
        }
      }
    })

    return wallets.map((w) => ({
      ...w,
      balance: balances[w.id] ?? 0,
    }))
  }, [wallets, transactions])

  const addTransaction = useCallback(async (transaction: Omit<Transaction, "id">) => {
    if (!transactionCollection) {
      throw new Error("You must be signed in to add a transaction")
    }

    try {
      const payload = {
        ...transaction,
        createdAt:
          typeof transaction.createdAt === "number" ? transaction.createdAt : Date.now(),
      }

      await addDoc(
        transactionCollection,
        omitUndefinedFields(payload as Record<string, unknown>)
      )
    } catch (error) {
      console.error("Error adding transaction:", error)
      throw error
    }
  }, [transactionCollection])

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    if (!user) {
      throw new Error("You must be signed in to update a transaction")
    }

    try {
      const transactionRef = doc(db, "users", user.uid, "transactions", id)
      await updateDoc(
        transactionRef,
        omitUndefinedFields(updates as Record<string, any>)
      )
    } catch (error) {
      console.error("Error updating transaction:", error)
      throw error
    }
  }, [user])

  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) {
      throw new Error("You must be signed in to delete a transaction")
    }

    try {
      const targetTransaction = transactions.find((transaction) => transaction.id === id)

      if (targetTransaction?.transferId) {
        const linkedTransferTransactions = transactions.filter(
          (transaction) => transaction.transferId === targetTransaction.transferId
        )

        const batch = writeBatch(db)
        linkedTransferTransactions.forEach((transaction) => {
          const transactionRef = doc(db, "users", user.uid, "transactions", transaction.id)
          batch.delete(transactionRef)
        })
        await batch.commit()
        return
      }

      const transactionRef = doc(db, "users", user.uid, "transactions", id)
      await deleteDoc(transactionRef)
    } catch (error) {
      console.error("Error deleting transaction:", error)
      throw error
    }
  }, [transactions, user])

  const addWallet = useCallback(async (wallet: Pick<Wallet, "name" | "initialBalance">) => {
    if (!walletCollection) {
      throw new Error("You must be signed in to add a wallet")
    }

    try {
      await addDoc(walletCollection, {
        ...wallet,
        balance: wallet.initialBalance,
      })
    } catch (error) {
      console.error("Error adding wallet:", error)
      throw error
    }
  }, [walletCollection])

  const updateWallet = useCallback(async (id: string, updates: Partial<Wallet>) => {
    if (!user) {
      throw new Error("You must be signed in to update a wallet")
    }

    try {
      const walletRef = doc(db, "users", user.uid, "wallets", id)
      await updateDoc(walletRef, {
        ...updates,
        ...(typeof updates.initialBalance === "number"
          ? { balance: updates.initialBalance }
          : {}),
      })
    } catch (error) {
      console.error("Error updating wallet:", error)
      throw error
    }
  }, [user])

  const deleteWallet = useCallback(async (id: string) => {
    if (!user) {
      throw new Error("You must be signed in to delete a wallet")
    }

    try {
      const walletTransactions = transactions.filter((t) => t.walletId === id)
      const transferIds = new Set(
        walletTransactions
          .map((transaction) => transaction.transferId)
          .filter((transferId): transferId is string => Boolean(transferId))
      )
      const linkedTransferTransactions =
        transferIds.size > 0
          ? transactions.filter(
              (transaction) =>
                Boolean(transaction.transferId) &&
                transferIds.has(transaction.transferId as string)
            )
          : []
      const transactionIdsToDelete = new Set([
        ...walletTransactions.map((transaction) => transaction.id),
        ...linkedTransferTransactions.map((transaction) => transaction.id),
      ])
      const walletGoals = savingGoals.filter((goal) => goal.walletId === id)
      const walletRecurringTemplates = recurringTemplates.filter((template) => template.walletId === id)

      const refsToDelete = [
        ...Array.from(transactionIdsToDelete).map((transactionId) =>
          doc(db, "users", user.uid, "transactions", transactionId)
        ),
        ...walletGoals.map((goal) =>
          doc(db, "users", user.uid, "savingGoals", goal.id)
        ),
        ...walletRecurringTemplates.map((template) =>
          doc(db, "users", user.uid, "recurringTemplates", template.id)
        ),
        doc(db, "users", user.uid, "wallets", id),
      ]

      const batchLimit = 450
      for (let index = 0; index < refsToDelete.length; index += batchLimit) {
        const batch = writeBatch(db)
        refsToDelete.slice(index, index + batchLimit).forEach((ref) => {
          batch.delete(ref)
        })
        await batch.commit()
      }
    } catch (error) {
      console.error("Error deleting wallet:", error)
      throw error
    }
  }, [transactions, savingGoals, recurringTemplates, user])

  const transferBetweenWallets = useCallback(async (
    params: {
      fromWalletId: string
      toWalletId: string
      amount: number
      fee?: number
      date: string
      note?: string
    }
  ) => {
    if (!user || !transactionCollection) {
      throw new Error("You must be signed in to transfer funds")
    }

    const { fromWalletId, toWalletId, amount, fee = 0, date, note } = params
    if (fromWalletId === toWalletId) {
      throw new Error("Source and destination wallets must be different")
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Transfer amount must be greater than zero")
    }
    if (!Number.isFinite(fee) || fee < 0) {
      throw new Error("Transfer fee cannot be negative")
    }

    const sourceWallet = wallets.find((wallet) => wallet.id === fromWalletId)
    const destinationWallet = wallets.find((wallet) => wallet.id === toWalletId)
    if (!sourceWallet || !destinationWallet) {
      throw new Error("Both wallets must exist")
    }

    const trimmedNote = note?.trim()
    const transferCreatedAt = Date.now()
    const transferId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 12)
    const batch = writeBatch(db)
    const outgoingRef = doc(transactionCollection)
    const incomingRef = doc(transactionCollection)
    const feeRef = fee > 0 ? doc(transactionCollection) : null

    const outgoingTransaction = omitUndefinedFields({
      amount,
      type: "expense" as const,
      category: "other" as const,
      customCategory: "Transfer",
      transferId,
      walletId: fromWalletId,
      date,
      createdAt: transferCreatedAt + 1,
      description: trimmedNote || `Transfer to ${destinationWallet.name}`,
    })

    const incomingTransaction = omitUndefinedFields({
      amount,
      type: "income" as const,
      category: "other" as const,
      customCategory: "Transfer",
      transferId,
      walletId: toWalletId,
      date,
      createdAt: transferCreatedAt,
      description: trimmedNote || `Transfer from ${sourceWallet.name}`,
    })

    const feeTransaction = feeRef
      ? omitUndefinedFields({
          amount: fee,
          type: "expense" as const,
          category: "other" as const,
          customCategory: "Transfer Fee",
          walletId: fromWalletId,
          date,
          createdAt: transferCreatedAt + 2,
          description: trimmedNote
            ? `${trimmedNote} (Transfer fee)`
            : `Transfer fee to move funds to ${destinationWallet.name}`,
        })
      : null

    batch.set(outgoingRef, outgoingTransaction)
    batch.set(incomingRef, incomingTransaction)
    if (feeRef && feeTransaction) {
      batch.set(feeRef, feeTransaction)
    }
    await batch.commit()
  }, [user, transactionCollection, wallets])

  const addRecurringTemplate = useCallback(async (
    template: Omit<RecurringTransactionTemplate, "id" | "createdAt" | "lastGeneratedAt" | "isPaused">
  ) => {
    if (!recurringTemplateCollection) {
      throw new Error("You must be signed in to create a recurring transaction")
    }

    const templatePayload = omitUndefinedFields({
      ...template,
      isPaused: false,
      createdAt: Date.now(),
    } as Record<string, unknown>)

    const created = await addDoc(recurringTemplateCollection, templatePayload)
    return created.id
  }, [recurringTemplateCollection])

  const updateRecurringTemplate = useCallback(async (
    id: string,
    updates: Partial<Omit<RecurringTransactionTemplate, "id" | "createdAt">>
  ) => {
    if (!user) {
      throw new Error("You must be signed in to update a recurring transaction")
    }

    const templateRef = doc(db, "users", user.uid, "recurringTemplates", id)
    await updateDoc(templateRef, omitUndefinedFields(updates as Record<string, any>))
  }, [user])

  const toggleRecurringTemplatePaused = useCallback(async (id: string, paused: boolean) => {
    if (!user) {
      throw new Error("You must be signed in to update a recurring transaction")
    }

    const templateRef = doc(db, "users", user.uid, "recurringTemplates", id)
    await updateDoc(templateRef, { isPaused: paused })
  }, [user])

  const deleteRecurringTemplate = useCallback(async (id: string) => {
    if (!user) {
      throw new Error("You must be signed in to delete a recurring transaction")
    }

    const templateRef = doc(db, "users", user.uid, "recurringTemplates", id)
    await deleteDoc(templateRef)
  }, [user])

  const runRecurringTemplateNow = useCallback(async (id: string) => {
    if (!user || !transactionCollection) {
      throw new Error("You must be signed in to run a recurring transaction")
    }

    const template = recurringTemplates.find((item) => item.id === id)
    if (!template) {
      throw new Error("Recurring transaction not found")
    }

    const runDate = template.nextRunDate
    const existsAlready = transactions.some(
      (item) => item.recurringTemplateId === template.id && item.date === runDate
    )

    const batch = writeBatch(db)
    if (!existsAlready) {
      const newTransactionRef = doc(transactionCollection)
      batch.set(newTransactionRef, omitUndefinedFields({
        amount: template.amount,
        type: template.type,
        category: template.category,
        customCategory: template.customCategory || "",
        walletId: template.walletId,
        date: runDate,
        createdAt: Date.now(),
        description: template.description || template.name,
        recurringTemplateId: template.id,
        isRecurringInstance: true,
      } as Record<string, unknown>))
    }

    const templateRef = doc(db, "users", user.uid, "recurringTemplates", template.id)
    const nextRunDate = shiftDateByFrequency(runDate, template.frequency)
    batch.update(templateRef, {
      nextRunDate,
      isPaused: Boolean(template.endDate && nextRunDate > template.endDate),
      lastGeneratedAt: Date.now(),
    })

    await batch.commit()
  }, [user, transactionCollection, recurringTemplates, transactions])

  useEffect(() => {
    if (!user || !transactionCollection || !recurringTemplateCollection) {
      return
    }

    if (recurringTemplates.length === 0 || isGeneratingRecurringRef.current) {
      return
    }

    const runGeneration = async () => {
      isGeneratingRecurringRef.current = true

      try {
        const today = toDateKey(new Date())
        const activeTemplates = recurringTemplates.filter((template) => {
          return !template.isPaused && template.nextRunDate <= today
        })

        if (activeTemplates.length === 0) {
          return
        }

        const pendingTransactionsSnapshot = await getDocs(query(transactionCollection, orderBy("date", "desc")))
        const knownKeys = new Set<string>()
        pendingTransactionsSnapshot.docs.forEach((transactionDoc) => {
          const transactionData = transactionDoc.data() as Transaction
          if (transactionData.recurringTemplateId && transactionData.date) {
            knownKeys.add(`${transactionData.recurringTemplateId}|${transactionData.date}`)
          }
        })

        const batch = writeBatch(db)
        let hasAnyChange = false

        activeTemplates.forEach((template) => {
          let cursorDate = template.nextRunDate
          let loops = 0

          while (cursorDate <= today && loops < 24) {
            const transactionKey = `${template.id}|${cursorDate}`

            if (!knownKeys.has(transactionKey)) {
              const generatedRef = doc(transactionCollection)
              batch.set(generatedRef, omitUndefinedFields({
                amount: template.amount,
                type: template.type,
                category: template.category,
                customCategory: template.customCategory || "",
                walletId: template.walletId,
                date: cursorDate,
                createdAt: Date.now() + loops,
                description: template.description || template.name,
                recurringTemplateId: template.id,
                isRecurringInstance: true,
              } as Record<string, unknown>))

              knownKeys.add(transactionKey)
              hasAnyChange = true
            }

            const nextDate = shiftDateByFrequency(cursorDate, template.frequency)
            const shouldPause = Boolean(template.endDate && nextDate > template.endDate)

            cursorDate = nextDate
            loops += 1

            if (shouldPause) {
              break
            }
          }

          if (cursorDate !== template.nextRunDate) {
            const templateRef = doc(db, "users", user.uid, "recurringTemplates", template.id)
            batch.update(templateRef, {
              nextRunDate: cursorDate,
              isPaused: Boolean(template.endDate && cursorDate > template.endDate),
              lastGeneratedAt: Date.now(),
            })
            hasAnyChange = true
          }
        })

        if (hasAnyChange) {
          await batch.commit()
        }
      } catch (error) {
        console.error("Error generating recurring transactions:", error)
      } finally {
        isGeneratingRecurringRef.current = false
      }
    }

    void runGeneration()
  }, [user, transactionCollection, recurringTemplateCollection, recurringTemplates])

  const addDebt = useCallback(async (debt: Omit<Debt, "id" | "createdAt" | "paidAmount" | "status">) => {
    if (!debtCollection) {
      throw new Error("You must be signed in to add a debt")
    }

    await addDoc(
      debtCollection,
      omitUndefinedFields({
        ...debt,
        paidAmount: 0,
        status: "active",
        createdAt: Date.now(),
      } as Record<string, unknown>)
    )
  }, [debtCollection])

  const updateDebt = useCallback(async (id: string, updates: Partial<Omit<Debt, "id">>) => {
    if (!user) {
      throw new Error("You must be signed in to update a debt")
    }

    const debtRef = doc(db, "users", user.uid, "debts", id)
    await updateDoc(debtRef, omitUndefinedFields(updates as Record<string, any>))
  }, [user])

  const deleteDebt = useCallback(async (id: string) => {
    if (!user) {
      throw new Error("You must be signed in to delete a debt")
    }

    const debtRef = doc(db, "users", user.uid, "debts", id)
    await deleteDoc(debtRef)
  }, [user])

  const recordDebtPayment = useCallback(async (id: string, paymentAmount: number, walletId: string, date: string) => {
    if (!user || !transactionCollection) {
      throw new Error("You must be signed in to record a payment")
    }

    const debt = debts.find((d) => d.id === id)
    if (!debt) throw new Error("Debt not found")

    const actualPayment = Math.min(paymentAmount, debt.amount - debt.paidAmount)
    const newPaidAmount = debt.paidAmount + actualPayment
    const newStatus: Debt["status"] = newPaidAmount >= debt.amount ? "paid" : "active"

    const debtRef = doc(db, "users", user.uid, "debts", id)
    const transactionPayload = omitUndefinedFields({
      amount: actualPayment,
      type: debt.type === "owed_by_me" ? "expense" : "income",
      category: "other" as const,
      customCategory: debt.type === "owed_by_me" ? `Debt payment – ${debt.name}` : `Received from ${debt.name}`,
      walletId,
      date,
      createdAt: Date.now(),
      description: debt.description,
    } as Record<string, unknown>)

    await Promise.all([
      updateDoc(debtRef, { paidAmount: newPaidAmount, status: newStatus }),
      addDoc(transactionCollection, transactionPayload),
    ])
  }, [user, transactionCollection, debts])

  const addSavingGoal = useCallback(async (goal: Omit<SavingGoal, "id" | "savedAmount" | "createdAt" | "status">) => {
    if (!goalCollection) {
      throw new Error("You must be signed in to add a saving goal")
    }

    await addDoc(
      goalCollection,
      omitUndefinedFields({
        ...goal,
        savedAmount: 0,
        status: "active",
        createdAt: Date.now(),
      } as Record<string, unknown>)
    )
  }, [goalCollection])

  const updateSavingGoal = useCallback(async (id: string, updates: Partial<Omit<SavingGoal, "id">>) => {
    if (!user) {
      throw new Error("You must be signed in to update a saving goal")
    }

    const existingGoal = savingGoals.find((goal) => goal.id === id)
    const nextTarget =
      typeof updates.targetAmount === "number"
        ? updates.targetAmount
        : existingGoal?.targetAmount
    const nextSaved =
      typeof updates.savedAmount === "number"
        ? updates.savedAmount
        : existingGoal?.savedAmount

    const payload = omitUndefinedFields({
      ...updates,
      ...(typeof nextSaved === "number" && typeof nextTarget === "number"
        ? { status: nextSaved >= nextTarget ? "completed" : "active" }
        : {}),
    } as Record<string, any>)

    const goalRef = doc(db, "users", user.uid, "savingGoals", id)
    await updateDoc(goalRef, payload)
  }, [user, savingGoals])

  const deleteSavingGoal = useCallback(async (id: string) => {
    if (!user) {
      throw new Error("You must be signed in to delete a saving goal")
    }

    const goalRef = doc(db, "users", user.uid, "savingGoals", id)
    await deleteDoc(goalRef)
  }, [user])

  const recordGoalContribution = useCallback(async (id: string, amount: number, date: string) => {
    if (!user || !transactionCollection) {
      throw new Error("You must be signed in to record goal contributions")
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Contribution amount must be greater than zero")
    }

    const goal = savingGoals.find((item) => item.id === id)
    if (!goal) {
      throw new Error("Saving goal not found")
    }

    const wallet = walletsWithBalances.find((item) => item.id === goal.walletId)
    if (!wallet) {
      throw new Error("Wallet for this saving goal was not found")
    }

    if (wallet.balance <= 0) {
      throw new Error("Selected wallet has no available balance")
    }

    const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0)
    const actualAmount = Math.min(amount, remaining, wallet.balance)
    if (actualAmount <= 0) {
      throw new Error("This saving goal is already completed")
    }

    const nextSavedAmount = goal.savedAmount + actualAmount
    const goalRef = doc(db, "users", user.uid, "savingGoals", id)

    const transactionPayload = omitUndefinedFields({
      amount: actualAmount,
      type: "expense" as const,
      category: "savings" as const,
      customCategory: "Saving Goal",
      walletId: goal.walletId,
      date,
      createdAt: Date.now(),
      description: `Contribution to ${goal.name}`,
    } as Record<string, unknown>)

    await Promise.all([
      updateDoc(goalRef, {
        savedAmount: nextSavedAmount,
        status: nextSavedAmount >= goal.targetAmount ? "completed" : "active",
      }),
      addDoc(transactionCollection, transactionPayload),
    ])
  }, [user, transactionCollection, savingGoals, walletsWithBalances])

  const recordGoalWithdrawal = useCallback(async (id: string, amount: number, date: string) => {
    if (!user || !transactionCollection) {
      throw new Error("You must be signed in to record goal withdrawals")
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Withdrawal amount must be greater than zero")
    }

    const goal = savingGoals.find((item) => item.id === id)
    if (!goal) {
      throw new Error("Saving goal not found")
    }

    const actualAmount = Math.min(amount, goal.savedAmount)
    if (actualAmount <= 0) {
      throw new Error("There is no saved amount to withdraw")
    }

    const nextSavedAmount = goal.savedAmount - actualAmount
    const goalRef = doc(db, "users", user.uid, "savingGoals", id)

    const transactionPayload = omitUndefinedFields({
      amount: actualAmount,
      type: "income" as const,
      category: "savings" as const,
      customCategory: "Saving Goal Withdrawal",
      walletId: goal.walletId,
      date,
      createdAt: Date.now(),
      description: `Withdrawal from ${goal.name}`,
    } as Record<string, unknown>)

    await Promise.all([
      updateDoc(goalRef, {
        savedAmount: nextSavedAmount,
        status: nextSavedAmount >= goal.targetAmount ? "completed" : "active",
      }),
      addDoc(transactionCollection, transactionPayload),
    ])
  }, [user, transactionCollection, savingGoals])

  const addChatMessage = useCallback((message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    }
    setChatMessages((prev) => [...prev, newMessage])
  }, [])

  const { totalBalance, totalIncome, totalExpenses, totalDebt, totalReceivable } = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income" && !t.transferId)
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = transactions
      .filter((t) => t.type === "expense" && !t.transferId)
      .reduce((sum, t) => sum + t.amount, 0)
    const balance = walletsWithBalances.reduce((sum, wallet) => sum + wallet.balance, 0)
    const activeDebts = debts.filter((d) => d.status === "active")
    const debt = activeDebts
      .filter((d) => d.type === "owed_by_me")
      .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0)
    const receivable = activeDebts
      .filter((d) => d.type === "owed_to_me")
      .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0)

    return {
      totalIncome: income,
      totalExpenses: expenses,
      totalBalance: balance,
      totalDebt: debt,
      totalReceivable: receivable,
    }
  }, [transactions, walletsWithBalances, debts])

  const getWalletById = useCallback(
    (id: string) => walletsWithBalances.find((w) => w.id === id),
    [walletsWithBalances]
  )

  const getTransactionsByWallet = useCallback(
    (walletId: string) => transactions.filter((t) => t.walletId === walletId),
    [transactions]
  )

  return (
    <BudgetContext.Provider
      value={{
        transactions,
        wallets: walletsWithBalances,
        chatMessages,
        debts,
        savingGoals,
        recurringTemplates,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addWallet,
        updateWallet,
        deleteWallet,
        transferBetweenWallets,
        addChatMessage,
        addDebt,
        updateDebt,
        deleteDebt,
        recordDebtPayment,
        addSavingGoal,
        updateSavingGoal,
        deleteSavingGoal,
        recordGoalContribution,
        recordGoalWithdrawal,
        addRecurringTemplate,
        updateRecurringTemplate,
        toggleRecurringTemplatePaused,
        deleteRecurringTemplate,
        runRecurringTemplateNow,
        totalBalance,
        totalIncome,
        totalExpenses,
        totalDebt,
        totalReceivable,
        getWalletById,
        getTransactionsByWallet,
        isLoading,
      }}
    >
      {children}
    </BudgetContext.Provider>
  )
}

export function useBudget() {
  const context = useContext(BudgetContext)
  if (context === undefined) {
    throw new Error("useBudget must be used within a BudgetProvider")
  }
  return context
}
