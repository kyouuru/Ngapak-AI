'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '-80px', threshold: 0.08 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}s` }}
      className={cn('motion-reveal', visible && 'is-visible', className)}
    >
      {children}
    </div>
  )
}

export function StaggerGroup({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <AnimatedSection className={cn('stagger-group', className)} delay={delay}>
      {children}
    </AnimatedSection>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('stagger-item', className)}>{children}</div>
}

export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [current, setCurrent] = useState(value.match(/\d/) ? '0' : value)

  useEffect(() => {
    const element = ref.current
    const numeric = Number.parseInt(value.replace(/\D/g, ''), 10)
    const suffix = value.replace(/[0-9]/g, '')
    if (!element || Number.isNaN(numeric)) {
      setCurrent(value)
      return
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setCurrent(value)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      const duration = 850
      const start = performance.now()
      let frame = 0

      const tick = (time: number) => {
        const progress = Math.min(1, (time - start) / duration)
        const eased = 1 - Math.pow(1 - progress, 3)
        setCurrent(`${Math.round(numeric * eased)}${suffix}`)
        if (progress < 1) frame = requestAnimationFrame(tick)
      }

      frame = requestAnimationFrame(tick)
      observer.disconnect()
      return () => cancelAnimationFrame(frame)
    }, { rootMargin: '-80px' })

    observer.observe(element)
    return () => observer.disconnect()
  }, [value])

  return <span ref={ref}>{current}</span>
}
