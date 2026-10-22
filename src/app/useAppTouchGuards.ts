import { useEffect } from 'react'

export function useAppTouchGuards() {
  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)')
    if (!coarse.matches) {
      return
    }
    const stopGesture = (event: Event) => {
      event.preventDefault()
    }
    document.addEventListener('gesturestart', stopGesture, { passive: false })
    document.addEventListener('gesturechange', stopGesture, { passive: false })
    document.addEventListener('gestureend', stopGesture, { passive: false })
    let lastTouchEnd = 0
    const onTouchEnd = (event: TouchEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("button,input,select,a,[role='button']")
      ) {
        return
      }
      const now = Date.now()
      if (now - lastTouchEnd < 320) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }
    document.addEventListener('touchend', onTouchEnd, { passive: false })
    return () => {
      document.removeEventListener('gesturestart', stopGesture)
      document.removeEventListener('gesturechange', stopGesture)
      document.removeEventListener('gestureend', stopGesture)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [])
}
