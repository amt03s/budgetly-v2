// React context that manages the user's chosen display currency, fetches and caches exchange rates, and provides a formatted amount helper.

"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "./firebase"
import { useAuth } from "./auth-context"
import { formatCurrencyWithCode } from "./currency"

interface CurrencyContextType {
  currency: string
  baseCurrency: string
  setCurrency: (code: string) => Promise<void>
  formatAmount: (amount: number, options?: Intl.NumberFormatOptions) => string
  exchangeRate: number
  isFetchingRate: boolean
  isFirstTime: boolean
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

// In-memory cache: "FROM_TO" -> rate
const rateCache = new Map<string, number>()

async function fetchRate(from: string, to: string): Promise<number> {
  if (from === to) return 1
  const key = `${from}_${to}`
  if (rateCache.has(key)) return rateCache.get(key)!

  const params = new URLSearchParams({ from, to })
  const res = await fetch(`/api/exchange-rate?${params.toString()}`)
  if (!res.ok) throw new Error("Failed to fetch exchange rate")
  const data = (await res.json()) as { rate?: number }
  const rate = data.rate
  if (!rate) throw new Error(`Rate not found for ${to}`)
  rateCache.set(key, rate)
  return rate
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [currency, setCurrencyState] = useState("PHP")
  const [baseCurrency, setBaseCurrencyState] = useState("PHP")
  const [exchangeRate, setExchangeRate] = useState(1)
  const [isFetchingRate, setIsFetchingRate] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Track the latest fetch to avoid stale updates
  const fetchIdRef = useRef(0)

  // Load user prefs from Firestore
  useEffect(() => {
    if (isAuthLoading) return

    if (!user) {
      setIsLoading(false)
      setIsFirstTime(false)
      return
    }

    const userDocRef = doc(db, "users", user.uid)
    getDoc(userDocRef)
      .then((snap) => {
        if (snap.exists() && snap.data().currency) {
          const saved = snap.data().currency as string
          const savedBase = (snap.data().baseCurrency as string) || saved
          setCurrencyState(saved)
          setBaseCurrencyState(savedBase)
          setIsFirstTime(false)
        } else {
          setIsFirstTime(true)
        }
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })
  }, [user, isAuthLoading])

  // Fetch live rate whenever currency or baseCurrency changes
  useEffect(() => {
    if (isLoading || isFirstTime) return

    const id = ++fetchIdRef.current
    if (currency === baseCurrency) {
      setExchangeRate(1)
      return
    }

    setIsFetchingRate(true)
    fetchRate(baseCurrency, currency)
      .then((rate) => {
        if (fetchIdRef.current === id) {
          setExchangeRate(rate)
        }
      })
      .catch(() => {
        if (fetchIdRef.current === id) {
          setExchangeRate(1)
        }
      })
      .finally(() => {
        if (fetchIdRef.current === id) {
          setIsFetchingRate(false)
        }
      })
  }, [currency, baseCurrency, isLoading, isFirstTime])

  const setCurrency = useCallback(
    async (code: string) => {
      if (!user) return
      const userDocRef = doc(db, "users", user.uid)

      if (isFirstTime) {
        // First time: this code becomes both the display and base currency
        await setDoc(
          userDocRef,
          { currency: code, baseCurrency: code },
          { merge: true }
        )
        setCurrencyState(code)
        setBaseCurrencyState(code)
        setExchangeRate(1)
        setIsFirstTime(false)
      } else {
        // Changing display currency only; baseCurrency stays
        await setDoc(userDocRef, { currency: code }, { merge: true })
        setCurrencyState(code)
      }
    },
    [user, isFirstTime]
  )

  const formatAmount = useCallback(
    (amount: number, options?: Intl.NumberFormatOptions) => {
      return formatCurrencyWithCode(amount * exchangeRate, currency, options)
    },
    [currency, exchangeRate]
  )

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        baseCurrency,
        setCurrency,
        formatAmount,
        exchangeRate,
        isFetchingRate,
        isFirstTime,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider")
  return context
}
