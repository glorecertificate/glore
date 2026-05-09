'use client'

import { memo, useCallback, useEffect, useMemo, useRef } from 'react'

import createGlobe, { type Arc, type COBEOptions, type Marker } from 'cobe'
import { useSpring } from 'react-spring'

import { cn } from '@/lib/utils'
import markersData from '~/config/markers.json'

export interface GlobeColorOptions {
  arcColor?: [number, number, number] | [number, number, number][]
  baseColor?: [number, number, number]
  glowColor?: [number, number, number]
  markerColor?: [number, number, number] | [number, number, number][]
}

export interface GlobeOptions
  extends
    Omit<COBEOptions, 'arcColor' | 'arcs' | 'baseColor' | 'glowColor' | 'markerColor' | 'markers'>,
    GlobeColorOptions {
  arcCount: number
  friction: number
  mass: number
  precision: number
  radius: number
  tension: number
  transitionDuration: number
}

export interface GlobeProps extends Partial<GlobeOptions> {
  className?: string
}

const MARKER_LOCATIONS = markersData as [number, number][]
const MARKER_MIN_SIZE = 0.02
const MARKER_MAX_SIZE = 0.05
const MIN_THETA = -Math.PI / 2 + 0.1
const MAX_THETA = Math.PI / 2 - 0.1
const PHI_SENSITIVITY = 120
const THETA_SENSITIVITY = 120
const ARC_POOL_SIZE = 24
const AUTO_ROTATE_SPEED = 0.005

const BASE_MARKERS = MARKER_LOCATIONS.map(location => ({
  colorIndex: Math.random(),
  location,
  size: Math.random() * (MARKER_MAX_SIZE - MARKER_MIN_SIZE) + MARKER_MIN_SIZE,
}))

const ARC_POOL = Array.from({ length: ARC_POOL_SIZE }, () => {
  const fromIndex = Math.floor(Math.random() * MARKER_LOCATIONS.length)
  let toIndex = Math.floor(Math.random() * MARKER_LOCATIONS.length)
  while (toIndex === fromIndex) {
    toIndex = Math.floor(Math.random() * MARKER_LOCATIONS.length)
  }
  return { from: MARKER_LOCATIONS[fromIndex]!, to: MARKER_LOCATIONS[toIndex]! }
})

const GLOBE_OPTIONS = {
  arcColor: [1, 1, 1] as [number, number, number],
  arcCount: 6,
  arcHeight: 0.45,
  arcWidth: 1,
  baseColor: [1, 1, 1] as [number, number, number],
  dark: 0,
  devicePixelRatio: 2,
  diffuse: 0,
  friction: 26,
  glowColor: [1, 1, 1] as [number, number, number],
  height: 400,
  mapBaseBrightness: 0,
  mapBrightness: 12,
  mapSamples: 15000,
  markerColor: [1, 1, 1] as [number, number, number],
  markerElevation: 0,
  mass: 0.1,
  offset: [0, 0] as [number, number],
  opacity: 0.75,
  phi: 0,
  precision: 0.002,
  radius: 0,
  scale: 1,
  tension: 500,
  theta: 0.4,
  transitionDuration: 400,
  width: 400,
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const normalizeRgb = (color: [number, number, number]) =>
  color.map(n => Math.min(Math.max(n, 0), 255) / 255) as [number, number, number]

const toPalette = (color: [number, number, number] | [number, number, number][]) => {
  const palette = (Array.isArray(color[0]) ? color : [color]) as [number, number, number][]
  return palette.map(normalizeRgb)
}

const paletteKey = (color: [number, number, number] | [number, number, number][]) => {
  const palette = (Array.isArray(color[0]) ? color : [color]) as [number, number, number][]
  return palette.map(c => c.join(',')).join('|')
}

export const Globe = memo(({ className, ...options }: GlobeProps) => {
  const merged = { ...GLOBE_OPTIONS, ...options }

  const arcColorSource = options.arcColor ?? options.markerColor ?? GLOBE_OPTIONS.arcColor
  const markerColorKey = paletteKey(merged.markerColor)
  const arcColorKey = paletteKey(arcColorSource)

  const markers = useMemo<Marker[]>(() => {
    const palette = toPalette(merged.markerColor)
    return BASE_MARKERS.map(({ colorIndex, ...marker }) => ({
      ...marker,
      color: palette.length > 1 ? palette[Math.floor(colorIndex * palette.length)] : undefined,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerColorKey])

  const arcs = useMemo<Arc[]>(() => {
    const palette = toPalette(arcColorSource)
    const count = clamp(merged.arcCount, 0, ARC_POOL_SIZE)
    return ARC_POOL.slice(0, count).map((pair, i) => ({
      ...pair,
      color: palette[i % palette.length],
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arcColorKey, merged.arcCount])

  const baseColor = normalizeRgb(merged.baseColor)
  const glowColor = normalizeRgb(merged.glowColor)
  const markerColor = toPalette(merged.markerColor)[0]!
  const arcColor = toPalette(arcColorSource)[0]!

  const propsRef = useRef({
    arcColor,
    arcHeight: merged.arcHeight,
    arcWidth: merged.arcWidth,
    arcs,
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
    markers,
    offset: merged.offset,
    opacity: merged.opacity,
    scale: merged.scale,
  })

  propsRef.current = {
    arcColor,
    arcHeight: merged.arcHeight,
    arcWidth: merged.arcWidth,
    arcs,
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
    markers,
    offset: merged.offset,
    opacity: merged.opacity,
    scale: merged.scale,
  }

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const widthRef = useRef(0)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const baseRotationRef = useRef({
    phi: merged.phi,
    theta: clamp(merged.theta, MIN_THETA, MAX_THETA),
  })
  const sentMarkersRef = useRef<Marker[] | null>(null)
  const sentArcsRef = useRef<Arc[] | null>(null)

  useEffect(() => {
    baseRotationRef.current.phi = merged.phi
    baseRotationRef.current.theta = clamp(merged.theta, MIN_THETA, MAX_THETA)
  }, [merged.phi, merged.theta])

  const [{ phiDelta, thetaDelta }, springApi] = useSpring(
    () => ({
      config: {
        friction: merged.friction,
        mass: merged.mass,
        precision: merged.precision,
        tension: merged.tension,
      },
      phiDelta: 0,
      thetaDelta: 0,
    }),
    [merged.friction, merged.mass, merged.precision, merged.tension]
  )

  const updateDrag = useCallback(
    (x: number, y: number) => {
      if (!pointerRef.current) return
      const deltaX = x - pointerRef.current.x
      const deltaY = y - pointerRef.current.y
      const targetTheta = clamp(baseRotationRef.current.theta + deltaY / THETA_SENSITIVITY, MIN_THETA, MAX_THETA)

      springApi.start({
        immediate: true,
        phiDelta: deltaX / PHI_SENSITIVITY,
        thetaDelta: targetTheta - baseRotationRef.current.theta,
      })
    },
    [springApi]
  )

  const endDrag = useCallback(() => {
    if (!pointerRef.current) return

    baseRotationRef.current.phi += phiDelta.get()
    baseRotationRef.current.theta = clamp(baseRotationRef.current.theta + thetaDelta.get(), MIN_THETA, MAX_THETA)

    pointerRef.current = null
    springApi.stop()
    springApi.start({ immediate: true, phiDelta: 0, thetaDelta: 0 })

    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab'
    }
  }, [phiDelta, springApi, thetaDelta])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerRef.current = { x: e.clientX, y: e.clientY }
    if (!canvasRef.current) return

    canvasRef.current.style.cursor = 'grabbing'
    if (!canvasRef.current.hasPointerCapture?.(e.pointerId)) {
      canvasRef.current.setPointerCapture?.(e.pointerId)
    }
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!pointerRef.current) return
      updateDrag(e.clientX, e.clientY)
    },
    [updateDrag]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (canvasRef.current?.hasPointerCapture?.(e.pointerId)) {
        canvasRef.current.releasePointerCapture(e.pointerId)
      }
      endDrag()
    },
    [endDrag]
  )

  const onPointerLeave = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (canvasRef.current?.hasPointerCapture?.(e.pointerId)) {
        canvasRef.current.releasePointerCapture(e.pointerId)
      }
      endDrag()
    },
    [endDrag]
  )

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0]
    if (!touch) return

    pointerRef.current = { x: touch.clientX, y: touch.clientY }
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing'
    }
  }, [])

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      const touch = e.touches[0]
      if (!touch) return

      e.preventDefault()
      updateDrag(touch.clientX, touch.clientY)
    },
    [updateDrag]
  )

  const onTouchEnd = useCallback(() => {
    endDrag()
  }, [endDrag])

  const onResize = useCallback(() => {
    if (canvasRef.current) {
      widthRef.current = canvasRef.current.offsetWidth
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    onResize()
    window.addEventListener('resize', onResize)

    const initialWidth = (widthRef.current || merged.width) * 2

    const globe = createGlobe(canvas, {
      arcColor: propsRef.current.arcColor,
      arcHeight: propsRef.current.arcHeight,
      arcWidth: propsRef.current.arcWidth,
      arcs: propsRef.current.arcs,
      baseColor: propsRef.current.baseColor,
      dark: propsRef.current.dark,
      devicePixelRatio: propsRef.current.devicePixelRatio,
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
    sentArcsRef.current = propsRef.current.arcs

    let frame = 0
    const tick = () => {
      if (!pointerRef.current) {
        baseRotationRef.current.phi += AUTO_ROTATE_SPEED
      }

      const w = widthRef.current * 2
      const nextTheta = clamp(baseRotationRef.current.theta + thetaDelta.get(), MIN_THETA, MAX_THETA)

      const state: Partial<COBEOptions> = {
        arcColor: propsRef.current.arcColor,
        arcHeight: propsRef.current.arcHeight,
        arcWidth: propsRef.current.arcWidth,
        baseColor: propsRef.current.baseColor,
        dark: propsRef.current.dark,
        diffuse: propsRef.current.diffuse,
        glowColor: propsRef.current.glowColor,
        height: w,
        mapBaseBrightness: propsRef.current.mapBaseBrightness,
        mapBrightness: propsRef.current.mapBrightness,
        markerColor: propsRef.current.markerColor,
        markerElevation: propsRef.current.markerElevation,
        offset: propsRef.current.offset,
        opacity: propsRef.current.opacity,
        phi: baseRotationRef.current.phi + phiDelta.get(),
        scale: propsRef.current.scale,
        theta: nextTheta,
        width: w,
      }

      if (sentMarkersRef.current !== propsRef.current.markers) {
        state.markers = propsRef.current.markers
        sentMarkersRef.current = propsRef.current.markers
      }
      if (sentArcsRef.current !== propsRef.current.arcs) {
        state.arcs = propsRef.current.arcs
        sentArcsRef.current = propsRef.current.arcs
      }

      globe.update(state as COBEOptions)
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)

    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.style.opacity = '1'
      }
    })

    return () => {
      cancelAnimationFrame(frame)
      globe.destroy()
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <canvas
      className={cn('cursor-grab bg-transparent opacity-0 transition-opacity duration-300', className)}
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
})
