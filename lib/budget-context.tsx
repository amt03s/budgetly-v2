"use client"

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Transaction, Wallet, ChatMessage } from "./types"
import { useAuth } from "./auth-context"

interface BudgetContextType {
  transactions: Transaction[]
  wallets: Wallet[]
  chatMessages: ChatMessage[]
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
    date: string
    note?: string
  }) => Promise<void>
  addChatMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void
  totalBalance: number
  totalIncome: number
  totalExpenses: number
  getWalletById: (id: string) => Wallet | undefined
  getTransactionsByWallet: (walletId: string) => Transaction[]
  isLoading: boolean
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

function omitUndefinedFields<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as Partial<T>
}

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  // Subscribe to wallets collection
  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!walletCollection) {
      setWallets([])
      setTransactions([])
      setChatMessages([])
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
        omitUndefinedFields(updates as Record<string, unknown>)
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
      // Delete all transactions associated with this wallet
      const walletTransactions = transactions.filter((t) => t.walletId === id)
      await Promise.all(
        walletTransactions.map((t) =>
          deleteDoc(doc(db, "users", user.uid, "transactions", t.id))
        )
      )
      // Delete the wallet
      const walletRef = doc(db, "users", user.uid, "wallets", id)
      await deleteDoc(walletRef)
    } catch (error) {
      console.error("Error deleting wallet:", error)
      throw error
    }
  }, [transactions, user])

  const transferBetweenWallets = useCallback(async (
    params: {
      fromWalletId: string
      toWalletId: string
      amount: number
      date: string
      note?: string
    }
  ) => {
    if (!user || !transactionCollection) {
      throw new Error("You must be signed in to transfer funds")
    }

    const { fromWalletId, toWalletId, amount, date, note } = params
    if (fromWalletId === toWalletId) {
      throw new Error("Source and destination wallets must be different")
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Transfer amount must be greater than zero")
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

    batch.set(outgoingRef, outgoingTransaction)
    batch.set(incomingRef, incomingTransaction)
    await batch.commit()
  }, [user, transactionCollection, wallets])

  const addChatMessage = useCallback((message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    }
    setChatMessages((prev) => [...prev, newMessage])
  }, [])

  const { totalBalance, totalIncome, totalExpenses } = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)
    const balance = walletsWithBalances.reduce((sum, wallet) => sum + wallet.balance, 0)

    return {
      totalIncome: income,
      totalExpenses: expenses,
      totalBalance: balance,
    }
  }, [transactions, walletsWithBalances])

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
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addWallet,
        updateWallet,
        deleteWallet,
        transferBetweenWallets,
        addChatMessage,
        totalBalance,
        totalIncome,
        totalExpenses,
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
