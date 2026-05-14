import { useEffect, useRef, useCallback } from 'react'

const IDLE_MS    = 28 * 60 * 1000  // warn after 28 min
const WARNING_MS =  2 * 60 * 1000  // auto-logout 2 min after warning

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

export function useIdleTimer({ onWarn, onLogout }) {
  const warnTimer   = useRef(null)
  const logoutTimer = useRef(null)

  const reset = useCallback(() => {
    clearTimeout(warnTimer.current)
    clearTimeout(logoutTimer.current)
    warnTimer.current   = setTimeout(onWarn,   IDLE_MS)
    logoutTimer.current = setTimeout(onLogout, IDLE_MS + WARNING_MS)
  }, [onWarn, onLogout])

  useEffect(() => {
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, reset))
      clearTimeout(warnTimer.current)
      clearTimeout(logoutTimer.current)
    }
  }, [reset])

  return reset
}
