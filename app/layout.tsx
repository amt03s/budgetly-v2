import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { BudgetProvider } from '@/lib/budget-context'
import { CurrencyProvider } from '@/lib/currency-context'

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" })

export const metadata: Metadata = {
  title: 'Budgetly - Personal Finance Tracker',
  description: 'Track your income, expenses, and budgets with ease',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} font-sans antialiased`}>
        <AuthProvider>
          <CurrencyProvider>
            <BudgetProvider>
              {children}
            </BudgetProvider>
          </CurrencyProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
