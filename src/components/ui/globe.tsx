'use client'

import { useEffect, useRef } from 'react'

import { type COBEOptions, type Marker } from 'cobe'

import { type Rgb } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface GlobeColorOptions {
  baseColor?: Rgb | Rgb[]
  glowColor?: Rgb
  markerColor?: Rgb | Rgb[]
}

interface GlobeOptions
  extends
    Omit<
      COBEOptions,
      'arcColor' | 'arcHeight' | 'arcWidth' | 'arcs' | 'baseColor' | 'glowColor' | 'markerColor' | 'markers'
    >,
    GlobeColorOptions {
  radius: number
  transitionDuration: number
}

export interface GlobeProps extends Partial<GlobeOptions> {
  className?: string
}

const MIN_THETA = -Math.PI / 2 + 0.1
const MAX_THETA = Math.PI / 2 - 0.1
const PHI_SENSITIVITY = 120
const THETA_SENSITIVITY = 120
const AUTO_ROTATE_SPEED = 0.005
const PALETTE_CYCLE_MS = 2800

const NO_MARKERS: Marker[] = []
const SMALL_SCREEN_QUERY = '(max-width: 767px)'
const SMALL_SCREEN_RATIO = 1.5

const GLOBE_OPTIONS = {
  baseColor: [1, 1, 1] as Rgb,
  dark: 0,
  devicePixelRatio: 2,
  diffuse: 0,
  glowColor: [1, 1, 1] as Rgb,
  height: 400,
  mapBaseBrightness: 0,
  mapBrightness: 12,
  mapSamples: 15000,
  markerColor: [1, 1, 1] as Rgb,
  markerElevation: 0,
  offset: [0, 0] as [number, number],
  opacity: 0.75,
  phi: 0,
  radius: 0,
  scale: 1,
  theta: 0.4,
  transitionDuration: 400,
  width: 400,
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const normalizeRgb = (color: Rgb) => color.map(n => Math.min(Math.max(n, 0), 255) / 255) as Rgb

const toPalette = (color: Rgb | Rgb[]) => {
  const palette = (Array.isArray(color[0]) ? color : [color]) as Rgb[]
  return palette.map(normalizeRgb)
}

const mix = (from: Rgb, to: Rgb, amount: number) => from.map((value, i) => value + (to[i]! - value) * amount) as Rgb

const smoothstep = (t: number) => t * t * (3 - 2 * t)

const paletteColorAt = (palette: Rgb[], time: number) => {
  if (palette.length === 1) return palette[0]!
  const position = (time / PALETTE_CYCLE_MS) % palette.length
  const index = Math.floor(position)
  return mix(palette[index]!, palette[(index + 1) % palette.length]!, smoothstep(position - index))
}

export const Globe = ({ className, ...options }: GlobeProps) => {
  const merged = { ...GLOBE_OPTIONS, ...options }

  const baseColor = toPalette(merged.baseColor)
  const glowColor = normalizeRgb(merged.glowColor)
  const markerColor = toPalette(merged.markerColor)[0]!

  const propsRef = useRef({
    baseColor,
    dark: merged.dark,
    devicePixelRatio: merged.devicePixelRatio,
    diffuse: merged.diffuse,
    glowColor,
    mapBaseBrightness: merged.mapBaseBrightness,
    mapBrightness: merged.mapBrightness,
    mapSamples: merged.mapSamples,
    markerColor,
    markerElevation: merged.markerElevation,
    markers: NO_MARKERS,
    offset: merged.offset,
    opacity: merged.opacity,
    scale: merged.scale,
    transitionDuration: merged.transitionDuration,
    width: merged.width,
  })

  propsRef.current = {
    baseColor,
    dark: merged.dark,
    devicePixelRatio: merged.devicePixelRatio,
    diffuse: merged.diffuse,
    glowColor,
    mapBaseBrightness: merged.mapBaseBrightness,
    mapBrightness: merged.mapBrightness,
    mapSamples: merged.mapSamples,
    markerColor,
    markerElevation: merged.markerElevation,
    markers: NO_MARKERS,
    offset: merged.offset,
    opacity: merged.opacity,
    scale: merged.scale,
    transitionDuration: merged.transitionDuration,
    width: merged.width,
  }

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const widthRef = useRef(0)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const baseRotationRef = useRef({
    phi: merged.phi,
    theta: clamp(merged.theta, MIN_THETA, MAX_THETA),
  })
  const sentMarkersRef = useRef<Marker[] | null>(null)
  const wakeRef = useRef<() => void>(() => {})

  useEffect(() => {
    baseRotationRef.current.phi = merged.phi
    baseRotationRef.current.theta = clamp(merged.theta, MIN_THETA, MAX_THETA)
  }, [merged.phi, merged.theta])

  const deltaRef = useRef({ phi: 0, theta: 0 })

  useEffect(() => {
    wakeRef.current()
  })

  const updateDrag = (x: number, y: number) => {
    if (!pointerRef.current) return
    const deltaX = x - pointerRef.current.x
    const deltaY = y - pointerRef.current.y
    const targetTheta = clamp(baseRotationRef.current.theta + deltaY / THETA_SENSITIVITY, MIN_THETA, MAX_THETA)

    deltaRef.current = { phi: deltaX / PHI_SENSITIVITY, theta: targetTheta - baseRotationRef.current.theta }
  }

  const endDrag = () => {
    if (!pointerRef.current) return

    baseRotationRef.current.phi += deltaRef.current.phi
    baseRotationRef.current.theta = clamp(baseRotationRef.current.theta + deltaRef.current.theta, MIN_THETA, MAX_THETA)

    pointerRef.current = null
    deltaRef.current = { phi: 0, theta: 0 }

    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab'
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerRef.current = { x: e.clientX, y: e.clientY }
    wakeRef.current()
    if (!canvasRef.current) return

    canvasRef.current.style.cursor = 'grabbing'
    if (!canvasRef.current.hasPointerCapture?.(e.pointerId)) {
      canvasRef.current.setPointerCapture?.(e.pointerId)
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointerRef.current) return
    updateDrag(e.clientX, e.clientY)
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (canvasRef.current?.hasPointerCapture?.(e.pointerId)) {
      canvasRef.current.releasePointerCapture(e.pointerId)
    }
    endDrag()
  }

  const onPointerLeave = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (canvasRef.current?.hasPointerCapture?.(e.pointerId)) {
      canvasRef.current.releasePointerCapture(e.pointerId)
    }
    endDrag()
  }

  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0]
    if (!touch) return

    pointerRef.current = { x: touch.clientX, y: touch.clientY }
    wakeRef.current()
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing'
    }
  }

  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0]
    if (!touch) return

    updateDrag(touch.clientX, touch.clientY)
  }

  const onTouchEnd = () => {
    endDrag()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = motion.matches
    const onMotionChange = () => {
      reduced = motion.matches
      wakeRef.current()
    }
    motion.addEventListener('change', onMotionChange)

    widthRef.current = canvas.offsetWidth
    let appliedWidth = widthRef.current
    const resizeObserver = new ResizeObserver(() => {
      widthRef.current = canvas.offsetWidth
      wakeRef.current()
    })
    resizeObserver.observe(canvas)

    let cancelled = false
    let frame = 0
    let onscreen = true
    let teardown = () => {}

    const timeout = setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.style.opacity = '1'
      }
    })

    const init = async () => {
      const { default: createGlobe } = await import('cobe')
      if (cancelled) return

      const initialWidth = (widthRef.current || propsRef.current.width) * 2

      let color = propsRef.current.baseColor[0]!
      let lastTime = performance.now()
      let paletteTime = 0

      const globe = createGlobe(canvas, {
        arcs: [],
        baseColor: color,
        dark: propsRef.current.dark,
        devicePixelRatio: window.matchMedia(SMALL_SCREEN_QUERY).matches
          ? Math.min(propsRef.current.devicePixelRatio, SMALL_SCREEN_RATIO)
          : propsRef.current.devicePixelRatio,
        diffuse: propsRef.current.diffuse,
        glowColor: propsRef.current.glowColor,
        height: initialWidth,
        mapBaseBrightness: propsRef.current.mapBaseBrightness,
        mapBrightness: propsRef.current.mapBrightness,
        mapSamples: propsRef.current.mapSamples,
        markerColor: propsRef.current.markerColor,
        markerElevation: propsRef.current.markerElevation,
        markers: propsRef.current.markers,
        offset: propsRef.current.offset,
        opacity: propsRef.current.opacity,
        phi: baseRotationRef.current.phi,
        scale: propsRef.current.scale,
        theta: baseRotationRef.current.theta,
        width: initialWidth,
      })

      sentMarkersRef.current = propsRef.current.markers
      appliedWidth = widthRef.current

      const hasContext = !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))

      const tick = (time: number) => {
        const elapsed = Math.max(time - lastTime, 0)
        lastTime = time

        if (!pointerRef.current) {
          if (!reduced) {
            baseRotationRef.current.phi += AUTO_ROTATE_SPEED
            paletteTime += elapsed
          }
          const easing = reduced ? 1 : 1 - Math.exp(-elapsed / Math.max(propsRef.current.transitionDuration / 4, 1))
          color = mix(color, paletteColorAt(propsRef.current.baseColor, paletteTime), easing)
        }

        const nextTheta = clamp(baseRotationRef.current.theta + deltaRef.current.theta, MIN_THETA, MAX_THETA)

        const state: Partial<COBEOptions> = {
          baseColor: color,
          dark: propsRef.current.dark,
          diffuse: propsRef.current.diffuse,
          glowColor: propsRef.current.glowColor,
          mapBaseBrightness: propsRef.current.mapBaseBrightness,
          mapBrightness: propsRef.current.mapBrightness,
          markerColor: propsRef.current.markerColor,
          markerElevation: propsRef.current.markerElevation,
          offset: propsRef.current.offset,
          opacity: propsRef.current.opacity,
          phi: baseRotationRef.current.phi + deltaRef.current.phi,
          scale: propsRef.current.scale,
          theta: nextTheta,
        }

        if (widthRef.current !== appliedWidth) {
          appliedWidth = widthRef.current
          state.width = appliedWidth * 2
          state.height = appliedWidth * 2
        }

        if (sentMarkersRef.current !== propsRef.current.markers) {
          state.markers = propsRef.current.markers
          sentMarkersRef.current = propsRef.current.markers
        }

        globe.update(state as COBEOptions)
        const idle = reduced && !pointerRef.current
        frame = onscreen && !document.hidden && !idle ? requestAnimationFrame(tick) : 0
      }

      const start = () => {
        if (frame || !onscreen || document.hidden || !hasContext) return
        lastTime = performance.now()
        frame = requestAnimationFrame(tick)
      }

      const onVisibilityChange = () => {
        if (document.hidden) return
        start()
      }

      const intersectionObserver = new IntersectionObserver(([entry]) => {
        onscreen = entry?.isIntersecting ?? true
        if (!onscreen) return
        start()
      })
      intersectionObserver.observe(canvas)
      document.addEventListener('visibilitychange', onVisibilityChange)

      wakeRef.current = start
      start()

      teardown = () => {
        wakeRef.current = () => {}
        cancelAnimationFrame(frame)
        intersectionObserver.disconnect()
        document.removeEventListener('visibilitychange', onVisibilityChange)
        globe.destroy()
      }
    }

    init()

    return () => {
      cancelled = true
      clearTimeout(timeout)
      resizeObserver.disconnect()
      motion.removeEventListener('change', onMotionChange)
      teardown()
    }
  }, [])

  return (
    <canvas
      aria-hidden
      className={cn(
        'cursor-grab touch-none bg-transparent opacity-0 transition-opacity duration-300 motion-reduce:transition-none',
        className
      )}
      onPointerCancel={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onTouchCancel={onTouchEnd}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
      onTouchStart={onTouchStart}
      ref={canvasRef}
    />
  )
}
