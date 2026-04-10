// Static list of supported currencies with locale/symbol metadata, plus helpers for formatting and parsing currency amounts.

export interface CurrencyConfig {
  code: string
  locale: string
  label: string
  symbol: string
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: "USD", locale: "en-US", label: "US Dollar", symbol: "$" },
  { code: "EUR", locale: "de-DE", label: "Euro", symbol: "€" },
  { code: "GBP", locale: "en-GB", label: "British Pound", symbol: "£" },
  { code: "JPY", locale: "ja-JP", label: "Japanese Yen", symbol: "¥" },
  { code: "PHP", locale: "en-PH", label: "Philippine Peso", symbol: "₱" },
  { code: "INR", locale: "en-IN", label: "Indian Rupee", symbol: "₹" },
  { code: "AUD", locale: "en-AU", label: "Australian Dollar", symbol: "A$" },
  { code: "CAD", locale: "en-CA", label: "Canadian Dollar", symbol: "CA$" },
  { code: "SGD", locale: "en-SG", label: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", locale: "zh-HK", label: "Hong Kong Dollar", symbol: "HK$" },
  { code: "KRW", locale: "ko-KR", label: "South Korean Won", symbol: "₩" },
  { code: "CNY", locale: "zh-CN", label: "Chinese Yuan", symbol: "¥" },
  { code: "MXN", locale: "es-MX", label: "Mexican Peso", symbol: "MX$" },
  { code: "BRL", locale: "pt-BR", label: "Brazilian Real", symbol: "R$" },
  { code: "IDR", locale: "id-ID", label: "Indonesian Rupiah", symbol: "Rp" },
  { code: "THB", locale: "th-TH", label: "Thai Baht", symbol: "฿" },
  { code: "MYR", locale: "ms-MY", label: "Malaysian Ringgit", symbol: "RM" },
  { code: "VND", locale: "vi-VN", label: "Vietnamese Dong", symbol: "₫" },
  { code: "NGN", locale: "en-NG", label: "Nigerian Naira", symbol: "₦" },
  { code: "ZAR", locale: "en-ZA", label: "South African Rand", symbol: "R" },
]

export function getCurrencyConfig(code: string): CurrencyConfig {
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === code) ??
    SUPPORTED_CURRENCIES.find((c) => c.code === "PHP")!
  )
}

export function formatCurrencyWithCode(
  amount: number,
  currencyCode: string,
  options?: Intl.NumberFormatOptions
): string {
  const config = getCurrencyConfig(currencyCode)
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount)
}

// Legacy default export kept for compatibility
export function formatCurrency(
  amount: number,
  options?: Intl.NumberFormatOptions
): string {
  return formatCurrencyWithCode(amount, "PHP", options)
}