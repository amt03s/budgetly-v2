// Session security guard: shows an inactivity warning dialog after 10 min and force-logs the user out after 20 min of no interaction.

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"

const IDLE_TIMEOUT_MS = 10 * 60 * 1000
const AWAY_TIMEOUT_MS = 20 * 60 * 1000

export function IdlePresenceGuard() {
  const { user, logOut } = useAuth()
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hiddenAtRef = useRef<number | null>(null)

  const clearIdleTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startIdleTimer = useCallback(() => {
    clearIdleTimer()

    timerRef.current = setTimeout(() => {
      if (document.visibilityState === "visible") {
        setIsOpen(true)
      }
    }, IDLE_TIMEOUT_MS)
  }, [clearIdleTimer])

  const handleActivity = useCallback(() => {
    if (isOpen) {
      return
    }

    startIdleTimer()
  }, [isOpen, startIdleTimer])

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "hidden") {
      hiddenAtRef.current = Date.now()
      clearIdleTimer()
      return
    }

    const hiddenAt = hiddenAtRef.current
    hiddenAtRef.current = null

    if (hiddenAt && Date.now() - hiddenAt >= AWAY_TIMEOUT_MS) {
      setIsOpen(true)
      return
    }

    if (!isOpen) {
      startIdleTimer()
    }
  }, [clearIdleTimer, isOpen, startIdleTimer])

  const handleContinue = () => {
    setIsOpen(false)
    startIdleTimer()
  }

  const handleSignOut = async () => {
    await logOut()
    setIsOpen(false)
    router.push("/login")
  }

  useEffect(() => {
    if (!user) {
      clearIdleTimer()
      return
    }

    startIdleTimer()

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "focus",
    ]

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true })
    })

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearIdleTimer()

      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity)
      })

      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [user, clearIdleTimer, handleActivity, handleVisibilityChange, startIdleTimer])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5" />
            Are you still there?
          </DialogTitle>
          <DialogDescription>
            We noticed you have been idle for a while or away from this tab for too long.
            Continue to keep your session active.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => void handleSignOut()}>
            Sign out
          </Button>
          <Button onClick={handleContinue}>Yes, continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
