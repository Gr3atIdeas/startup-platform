import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../utils/gsapSetup'

interface UseScrollTriggerOptions {
  animation: (el: HTMLElement, tl: gsap.core.Timeline) => void
  trigger?: string
  start?: string
  end?: string
  once?: boolean
}

export function useScrollTrigger<T extends HTMLElement>({
  animation,
  start = 'top 80%',
  once = true,
}: UseScrollTriggerOptions) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start,
        toggleActions: once ? 'play none none none' : 'play reverse play reverse',
      },
    })

    animation(el, tl)

    return () => {
      tl.kill()
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === el) st.kill()
      })
    }
  }, [animation, start, once])

  return ref
}
