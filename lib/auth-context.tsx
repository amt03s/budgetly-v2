// React context and provider for Firebase authentication: sign up, email/Google sign-in, sign out, profile updates, and password changes.

"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import {
  User,
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  fetchSignInMethodsForEmail,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  updateProfile,
} from "firebase/auth"
import { auth } from "./firebase"
import { validatePasswordPolicy } from "./password-policy"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: (options?: { allowCreate?: boolean }) => Promise<{ isNewUser: boolean }>
  setNickname: (nickname: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    const passwordValidation = validatePasswordPolicy(password, {
      email: normalizedEmail,
      name,
    })

    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.error)
    }

    const result = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
    await updateProfile(result.user, { displayName: name })
  }

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    const signInMethods = await fetchSignInMethodsForEmail(auth, normalizedEmail)

    if (signInMethods.includes("google.com") && !signInMethods.includes("password")) {
      throw new Error("This account was created with Google. Please click Log in with Google instead.")
    }

    try {
      const result = await signInWithEmailAndPassword(auth, normalizedEmail, password)
      setUser(result.user)
    } catch (error: unknown) {
      throw error
    }
  }

  const signInWithGoogle = async (options?: { allowCreate?: boolean }) => {
    const allowCreate = options?.allowCreate ?? true
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const additionalUserInfo = getAdditionalUserInfo(result)
    const isNewUser = Boolean(additionalUserInfo?.isNewUser)

    if (isNewUser && !allowCreate) {
      await deleteUser(result.user)
      await signOut(auth)
      setUser(null)
      throw new Error("No account found for this Google login. Please sign up first.")
    }

    return {
      isNewUser,
    }
  }

  const setNickname = async (nickname: string) => {
    const trimmedNickname = nickname.trim()

    if (!trimmedNickname) {
      throw new Error("Enter a nickname")
    }

    if (!auth.currentUser) {
      throw new Error("You must be signed in to set a nickname")
    }

    await updateProfile(auth.currentUser, { displayName: trimmedNickname })
    await auth.currentUser.reload()
    setUser(auth.currentUser)
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error("You must be signed in to change your password")
    }

    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
    await reauthenticateWithCredential(auth.currentUser, credential)

    const passwordValidation = validatePasswordPolicy(newPassword, {
      email: auth.currentUser.email,
      name: auth.currentUser.displayName || undefined,
    })

    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.error)
    }

    await updatePassword(auth.currentUser, newPassword)
  }

  const logOut = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signUp, signIn, signInWithGoogle, setNickname, changePassword, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
