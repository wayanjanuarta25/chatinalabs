'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  alpha: number
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // 1. Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // 2. Check if device is touch / no-hover (mobile)
    const isTouch = window.matchMedia('(hover: none)').matches || 'ontouchstart' in window

    let width = (canvas.width = canvas.offsetWidth)
    let height = (canvas.height = canvas.offsetHeight)

    // Particle count limit for high Lighthouse performance
    const isMobile = width < 768
    const particleCount = prefersReducedMotion ? 20 : isMobile ? 24 : 46

    const particles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.2 + 0.8,
        alpha: Math.random() * 0.25 + 0.12,
      })
    }

    let mouseX = -1000
    let mouseY = -1000

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }

    const handleMouseLeave = () => {
      mouseX = -1000
      mouseY = -1000
    }

    // Only attach mouse tracking if NOT mobile and NOT reduced motion
    if (!isTouch && !prefersReducedMotion) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseleave', handleMouseLeave)
    }

    let isVisible = true
    let isTabActive = !document.hidden

    const handleVisibilityChange = () => {
      isTabActive = !document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
      },
      { threshold: 0.05 }
    )
    observer.observe(canvas)

    let animationFrameId: number

    // Render static frame if prefers-reduced-motion is enabled
    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'rgba(160, 160, 160, 0.2)'
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      }
      return () => {
        observer.disconnect()
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }

    // 60FPS animation loop with low visual complexity & high performance
    const render = () => {
      if (isVisible && isTabActive) {
        ctx.clearRect(0, 0, width, height)

        const isDark = document.documentElement.classList.contains('dark')
        const baseR = isDark ? 255 : 20
        const baseG = isDark ? 255 : 20
        const baseB = isDark ? 255 : 20

        // Draw connecting lines with strict distance limit to keep O(N^2) minimal
        const maxDist = isMobile ? 65 : 95
        const maxDistSq = maxDist * maxDist

        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i]

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j]
            const dx = p1.x - p2.x
            const dy = p1.y - p2.y
            const distSq = dx * dx + dy * dy

            if (distSq < maxDistSq) {
              const alpha = (1 - Math.sqrt(distSq) / maxDist) * 0.12
              ctx.strokeStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${alpha})`
              ctx.lineWidth = 0.7
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.stroke()
            }
          }

          // Subtle desktop mouse connecting line
          if (!isTouch && mouseX > 0 && mouseY > 0) {
            const mdx = p1.x - mouseX
            const mdy = p1.y - mouseY
            const mDistSq = mdx * mdx + mdy * mdy
            const mouseMaxDistSq = 110 * 110

            if (mDistSq < mouseMaxDistSq) {
              const mAlpha = (1 - Math.sqrt(mDistSq) / 110) * 0.22
              ctx.strokeStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${mAlpha})`
              ctx.lineWidth = 0.8
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(mouseX, mouseY)
              ctx.stroke()
            }
          }

          // Update position
          p1.x += p1.vx
          p1.y += p1.vy

          // Wrap edges
          if (p1.x < 0) p1.x = width
          else if (p1.x > width) p1.x = 0
          if (p1.y < 0) p1.y = height
          else if (p1.y > height) p1.y = 0

          // Draw particle
          ctx.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${p1.alpha})`
          ctx.beginPath()
          ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
    }

    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      cancelAnimationFrame(animationFrameId)
      observer.disconnect()
      if (!isTouch && !prefersReducedMotion) {
        window.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseleave', handleMouseLeave)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div 
      aria-hidden="true" 
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full opacity-60 dark:opacity-75 transition-opacity duration-300"
      />
    </div>
  )
}
