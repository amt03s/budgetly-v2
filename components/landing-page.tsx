// Marketing landing page with hero, feature highlights, onboarding steps, and auth call-to-actions.

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, PieChart, Wallet, TrendingUp, MessageSquare, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <Wallet className="h-4 w-4 text-background" />
            </div>
            <span className="text-lg font-semibold">Budgetly</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </Link>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="md:hidden">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  Access account actions and appearance settings on mobile.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
                <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Appearance</p>
                    <p className="text-xs text-muted-foreground">Switch light or dark mode</p>
                  </div>
                  <ThemeToggle />
                </div>
                <div className="grid gap-3">
                  <Link href="/login">
                    <Button variant="outline" className="w-full justify-center">Log in</Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="w-full justify-center">Sign up</Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-balance md:text-6xl">
              Take Control of Your Financial Future
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
              Track your income, manage expenses, and achieve your financial goals with ease. 
              Get personalized insights powered by AI to make smarter money decisions.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  I already have an account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border/40 bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to manage your money
            </h2>
            <p className="mt-4 text-muted-foreground">
              Simple yet powerful tools to help you stay on top of your finances.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Wallet className="h-6 w-6" />}
              title="Multiple Wallets"
              description="Organize your money across different accounts - cash, bank, e-wallets, and more."
            />
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6" />}
              title="Track Transactions"
              description="Log income and expenses with categories, dates, and descriptions for full visibility."
            />
            <FeatureCard
              icon={<PieChart className="h-6 w-6" />}
              title="Visual Insights"
              description="Understand your spending patterns with intuitive charts and analytics."
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="Budge"
              description="Get personalized financial advice and insights from Budge, your AI budgeting guide."
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Get started in minutes
            </h2>
            <p className="mt-4 text-muted-foreground">
              Three simple steps to financial clarity.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <StepCard
              number="01"
              title="Create your account"
              description="Sign up for free and set up your profile in seconds."
            />
            <StepCard
              number="02"
              title="Add your wallets"
              description="Create wallets for each of your accounts and payment methods."
            />
            <StepCard
              number="03"
              title="Track everything"
              description="Log your transactions and watch your financial picture become clear."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/40 bg-foreground py-20 text-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to take control?
            </h2>
            <p className="mt-4 text-background/70">
              Join thousands of users who have transformed their relationship with money.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="mt-8 gap-2">
                Start for free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground">
                <Wallet className="h-3 w-3 text-background" />
              </div>
              <span className="text-sm font-medium">Budgetly</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for better financial habits.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-xl font-bold">
        {number}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
