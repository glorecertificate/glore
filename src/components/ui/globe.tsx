'use client'

import { useEffect, useRef } from 'react'

import createGlobe, { type COBEOptions, type Marker } from 'cobe'
import { useSpring } from 'react-spring'

import { cn } from '@/lib/utils'
export interface GlobeColorOptions {
  baseColor?: [number, number, number]
  glowColor?: [number, number, number]
  markerColor?: [number, number, number] | [number, number, number][]
}

export interface GlobeOptions
  extends
    Omit<
      COBEOptions,
      'arcColor' | 'arcHeight' | 'arcWidth' | 'arcs' | 'baseColor' | 'glowColor' | 'markerColor' | 'markers'
    >,
    GlobeColorOptions {
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

const MIN_THETA = -Math.PI / 2 + 0.1
const MAX_THETA = Math.PI / 2 - 0.1
const PHI_SENSITIVITY = 120
const THETA_SENSITIVITY = 120
const AUTO_ROTATE_SPEED = 0.005

const NO_MARKERS: Marker[] = []

const GLOBE_OPTIONS = {
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

export const Globe = ({ className, ...options }: GlobeProps) => {
  const merged = { ...GLOBE_OPTIONS, ...options }

  const baseColor = normalizeRgb(merged.baseColor)
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
  }

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const widthRef = useRef(0)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const baseRotationRef = useRef({
    phi: merged.phi,
    theta: clamp(merged.theta, MIN_THETA, MAX_THETA),
  })
  const sentMarkersRef = useRef<Marker[] | null>(null)

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

  const updateDrag = (x: number, y: number) => {
    if (!pointerRef.current) return
    const deltaX = x - pointerRef.current.x
    const deltaY = y - pointerRef.current.y
    const targetTheta = clamp(baseRotationRef.current.theta + deltaY / THETA_SENSITIVITY, MIN_THETA, MAX_THETA)

    springApi.start({
      immediate: true,
      phiDelta: deltaX / PHI_SENSITIVITY,
      thetaDelta: targetTheta - baseRotationRef.current.theta,
    })
  }

  const endDrag = () => {
    if (!pointerRef.current) return

    baseRotationRef.current.phi += phiDelta.get()
    baseRotationRef.current.theta = clamp(baseRotationRef.current.theta + thetaDelta.get(), MIN_THETA, MAX_THETA)

    pointerRef.current = null
    springApi.stop()
    springApi.start({ immediate: true, phiDelta: 0, thetaDelta: 0 })

    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab'
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerRef.current = { x: e.clientX, y: e.clientY }
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
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing'
    }
  }

  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0]
    if (!touch) return

    e.preventDefault()
    updateDrag(touch.clientX, touch.clientY)
  }

  const onTouchEnd = () => {
    endDrag()
  }

  const onResize = () => {
    if (canvasRef.current) {
      widthRef.current = canvasRef.current.offsetWidth
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    onResize()
    window.addEventListener('resize', onResize)

    const initialWidth = (widthRef.current || merged.width) * 2

    const globe = createGlobe(canvas, {
      arcs: [],
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

    let frame = 0
    const tick = () => {
      if (!pointerRef.current) {
        baseRotationRef.current.phi += AUTO_ROTATE_SPEED
      }

      const w = widthRef.current * 2
      const nextTheta = clamp(baseRotationRef.current.theta + thetaDelta.get(), MIN_THETA, MAX_THETA)

      const state: Partial<COBEOptions> = {
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
}
