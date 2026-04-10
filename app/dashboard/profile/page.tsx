// Route page for user profile settings: update display name and change password with live strength validation.

"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, Check, Circle } from "lucide-react"
import { getPasswordStrength, getPasswordValidationChecks } from "@/lib/password-policy"

export default function ProfilePage() {
  const { user, changePassword } = useAuth()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isNewFocused, setIsNewFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const hasPasswordProvider = user?.providerData.some((p) => p.providerId === "password")

  const passwordChecks = getPasswordValidationChecks(newPassword, {
    email: user?.email ?? undefined,
    name: user?.displayName ?? undefined,
  })
  const isNewPasswordValid = passwordChecks.every((c) => c.isMet)
  const passwordStrength = getPasswordStrength(newPassword, {
    email: user?.email ?? undefined,
    name: user?.displayName ?? undefined,
  })
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword
  const showPasswordGuidance = isNewFocused || (newPassword.length > 0 && !isNewPasswordValid)

  const strengthColor =
    passwordStrength.score >= 100
      ? "bg-green-500"
      : passwordStrength.score >= 60
        ? "bg-yellow-500"
        : "bg-red-500"

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!passwordsMatch) {
      setError("New passwords do not match")
      return
    }

    if (!isNewPasswordValid) {
      setError("New password does not meet the requirements")
      return
    }

    setIsLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setSuccess("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password"
      if (msg.includes("invalid-credential") || msg.includes("wrong-password")) {
        setError("Current password is incorrect")
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0] ?? "?").toUpperCase()

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Profile</h1>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background text-lg font-semibold select-none">
              {initials}
            </div>
            <div>
              <p className="font-medium">{user?.displayName || "—"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Sign-in method</p>
            <div className="flex flex-wrap gap-2">
              {user?.providerData.map((p) => (
                <span
                  key={p.providerId}
                  className="rounded-full border px-3 py-1 text-xs font-medium"
                >
                  {p.providerId === "google.com" ? "Google" : "Email & Password"}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            {hasPasswordProvider
              ? "Update your password. You'll need to enter your current password to confirm."
              : "Password changes are not available for accounts using Google sign-in."}
          </CardDescription>
        </CardHeader>
        {hasPasswordProvider && (
          <CardContent>
            <form onSubmit={handleChangePassword}>
              <FieldGroup>
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                    {success}
                  </div>
                )}

                <Field>
                  <FieldLabel htmlFor="current-password">Current Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrent ? "text" : "password"}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showCurrent ? "Hide password" : "Show password"}
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNew ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={() => setIsNewFocused(true)}
                      onBlur={() => setIsNewFocused(false)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showNew ? "Hide password" : "Show password"}
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Strength</span>
                        <span>{passwordStrength.label}</span>
                      </div>
                      <Progress value={passwordStrength.score} className={`h-1.5 ${strengthColor}`} />
                    </div>
                  )}
                  {showPasswordGuidance && (
                    <ul className="mt-2 space-y-1">
                      {passwordChecks.map((check) => (
                        <li key={check.id} className="flex items-center gap-2 text-xs">
                          {check.isMet ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Circle className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={check.isMet ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                            {check.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirm-password">Confirm New Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <p className={`mt-1 text-xs ${passwordsMatch ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                      {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                    </p>
                  )}
                </Field>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !isNewPasswordValid || !passwordsMatch || !currentPassword}
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
