"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Progress } from "@/components/ui/progress"
import { Wallet, ArrowLeft, Check, Circle, Eye, EyeOff } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { getPasswordStrength, getPasswordValidationChecks, validatePasswordPolicy } from "@/lib/password-policy"

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M21.35 11.1H12v2.92h5.36a4.83 4.83 0 0 1-2.1 3.17v2.63h3.4c1.98-1.82 3.12-4.5 3.12-7.7 0-.69-.06-1.36-.18-2.02Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.97-.9 6.62-2.45l-3.4-2.63c-.94.63-2.15 1-3.22 1-2.48 0-4.58-1.67-5.33-3.91H3.17v2.72A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.67 14.01a5.99 5.99 0 0 1 0-3.82V7.47H3.17a10 10 0 0 0 0 9.26l3.5-2.72Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.08c1.47 0 2.8.5 3.85 1.5l2.88-2.88C16.96 3.05 14.7 2 12 2A10 10 0 0 0 3.17 7.47l3.5 2.72c.75-2.24 2.85-3.91 5.33-3.91Z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function SignupPage() {
  const [nickname, setNickname] = useState("")
  const [googleNickname, setGoogleNickname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false)
  const [isGoogleSignupPendingNickname, setIsGoogleSignupPendingNickname] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signUp, signInWithGoogle, setNickname: saveNickname } = useAuth()
  const router = useRouter()
  const trimmedNickname = nickname.trim()
  const passwordChecks = getPasswordValidationChecks(password, {
    email,
    name: trimmedNickname,
  })
  const isPasswordValid = passwordChecks.every((check) => check.isMet)
  const passwordStrength = getPasswordStrength(password, {
    email,
    name: trimmedNickname,
  })
  const confirmPasswordHasValue = confirmPassword.length > 0
  const passwordsMatch = confirmPasswordHasValue && password === confirmPassword

  const shouldShowPasswordGuidance = isPasswordFieldFocused || (password.length > 0 && !isPasswordValid)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!trimmedNickname) {
      setError("Enter a nickname for your dashboard greeting")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    const passwordValidation = validatePasswordPolicy(password, {
      email,
      name: trimmedNickname,
    })

    if (!passwordValidation.isValid) {
      setError(passwordValidation.error)
      return
    }

    setIsLoading(true)

    try {
      await signUp(email, password, trimmedNickname)
      router.push("/dashboard")
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create account"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError("")
    setIsLoading(true)

    try {
      const { isNewUser } = await signInWithGoogle()

      if (isNewUser) {
        setIsGoogleSignupPendingNickname(true)
        return
      }

      router.push("/dashboard")
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to continue with Google"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleNicknameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const trimmedNickname = googleNickname.trim()

    if (!trimmedNickname) {
      setError("Enter a nickname for your dashboard greeting")
      return
    }

    setIsLoading(true)

    try {
      await saveNickname(trimmedNickname)
      router.push("/dashboard")
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save nickname"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="absolute left-4 top-4 flex items-center gap-2 md:left-8 md:top-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
      <div className="absolute right-4 top-4 md:right-8 md:top-8">
        <ThemeToggle />
      </div>

      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground">
          <Wallet className="h-5 w-5 text-background" />
        </div>
        <span className="text-xl font-semibold">Budgetly</span>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isGoogleSignupPendingNickname ? "One last step" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {isGoogleSignupPendingNickname
              ? "Choose a nickname so we can personalize your dashboard"
              : "Start your journey to financial freedom with the name shown on your dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isGoogleSignupPendingNickname ? handleGoogleNicknameSubmit : handleSubmit}>
            <FieldGroup>
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {isGoogleSignupPendingNickname ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="googleNickname">Nickname</FieldLabel>
                    <Input
                      id="googleNickname"
                      type="text"
                      placeholder="How should we greet you?"
                      value={googleNickname}
                      onChange={(e) => setGoogleNickname(e.target.value)}
                      required
                    />
                  </Field>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Continue to dashboard"}
                  </Button>
                </>
              ) : (
                <>
                  <Field>
                    <FieldLabel htmlFor="nickname">Nickname</FieldLabel>
                    <Input
                      id="nickname"
                      type="text"
                      placeholder="How should we greet you?"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div
                      onFocusCapture={() => setIsPasswordFieldFocused(true)}
                      onBlurCapture={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                          setIsPasswordFieldFocused(false)
                        }
                      }}
                    >
                      <InputGroup>
                      <InputGroupInput
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          aria-pressed={showPassword}
                          onClick={() => setShowPassword((current) => !current)}
                          size="icon-xs"
                          variant="ghost"
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </InputGroupButton>
                      </InputGroupAddon>
                      </InputGroup>
                      {shouldShowPasswordGuidance && (
                        <div className="mt-3 space-y-3 rounded-lg border bg-muted/40 p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                              <span>Password strength</span>
                              <span>{passwordStrength.label}</span>
                            </div>
                            <Progress value={passwordStrength.score} className="h-1.5" />
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {passwordChecks.map((check) => (
                              <div
                                key={check.id}
                                className="flex items-center gap-2 text-xs text-muted-foreground"
                              >
                                {check.isMet ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5" />
                                )}
                                <span className={check.isMet ? "text-foreground" : undefined}>{check.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                          aria-pressed={showConfirmPassword}
                          onClick={() => setShowConfirmPassword((current) => !current)}
                          size="icon-xs"
                          variant="ghost"
                        >
                          {showConfirmPassword ? <EyeOff /> : <Eye />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    {confirmPasswordHasValue && (
                      <p className={`mt-2 text-xs ${passwordsMatch ? "text-emerald-600" : "text-destructive"}`}>
                        {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                      </p>
                    )}
                  </Field>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                  <div className="relative text-center text-xs uppercase text-muted-foreground">
                    <span className="bg-background px-2">Or</span>
                    <div className="absolute left-0 right-0 top-1/2 -z-10 border-t" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full -mt-2"
                    onClick={handleGoogleSignUp}
                    disabled={isLoading}
                  >
                    <GoogleIcon />
                    Sign up with Google
                  </Button>
                </>
              )}
            </FieldGroup>
          </form>
          {!isGoogleSignupPendingNickname && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
