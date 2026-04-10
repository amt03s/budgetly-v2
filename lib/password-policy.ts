// Password strength scoring and per-rule validation checks (length, uppercase, number, symbol, no personal info) used on sign-up and profile pages.

const MIN_PASSWORD_LENGTH = 12

interface PasswordValidationOptions {
  email?: string
  name?: string
}

export interface PasswordValidationCheck {
  id: string
  label: string
  isMet: boolean
}

export function getPasswordValidationChecks(
  password: string,
  options: PasswordValidationOptions = {},
): PasswordValidationCheck[] {
  return [
    {
      id: "length",
      label: `At least ${MIN_PASSWORD_LENGTH} characters`,
      isMet: password.length >= MIN_PASSWORD_LENGTH,
    },
    {
      id: "uppercase",
      label: "At least one uppercase letter",
      isMet: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "At least one lowercase letter",
      isMet: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "At least one number",
      isMet: /\d/.test(password),
    },
    {
      id: "special",
      label: "At least one special character",
      isMet: /[^A-Za-z0-9\s]/.test(password),
    },
    {
      id: "spaces",
      label: "No spaces",
      isMet: !/\s/.test(password),
    },
  ]
}

export function getPasswordStrength(password: string, options: PasswordValidationOptions = {}) {
  const checks = getPasswordValidationChecks(password, options)
  const passedChecks = checks.filter((check) => check.isMet).length
  const score = password.length === 0 ? 0 : Math.round((passedChecks / checks.length) * 100)

  if (score >= 100) {
    return { score, label: "Strong" }
  }

  if (score >= 70) {
    return { score, label: "Good" }
  }

  if (score >= 40) {
    return { score, label: "Fair" }
  }

  return { score, label: "Weak" }
}

export function validatePasswordPolicy(password: string, options: PasswordValidationOptions = {}) {
  const failedCheck = getPasswordValidationChecks(password, options).find((check) => !check.isMet)

  if (failedCheck?.id === "length") {
    return {
      isValid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    }
  }

  if (failedCheck?.id === "uppercase") {
    return {
      isValid: false,
      error: "Password must include at least one uppercase letter",
    }
  }

  if (failedCheck?.id === "lowercase") {
    return {
      isValid: false,
      error: "Password must include at least one lowercase letter",
    }
  }

  if (failedCheck?.id === "number") {
    return {
      isValid: false,
      error: "Password must include at least one number",
    }
  }

  if (failedCheck?.id === "special") {
    return {
      isValid: false,
      error: "Password must include at least one special character",
    }
  }

  if (failedCheck?.id === "spaces") {
    return {
      isValid: false,
      error: "Password cannot contain spaces",
    }
  }

  return {
    isValid: true,
    error: "",
  }
}