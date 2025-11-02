// biome-ignore-all lint/correctness/useExhaustiveDependencies: manual deps
'use client'

import { memo, useCallback, useEffect, useMemo, useRef } from 'react'

import createGlobe, { type COBEOptions } from 'cobe'
import { useSpring } from 'react-spring'

import { noop } from '@glore/utils/noop'

import { cn } from '@/lib/utils'
import { MARKERS } from './data'

export interface GlobeColorOptions extends Pick<GlobeOptions, 'baseColor' | 'glowColor'> {
  markerColor?: [number, number, number] | [number, number, number][]
}

export interface GlobeOptions extends Omit<COBEOptions, 'markerColor'>, GlobeColorOptions {
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

const MARKER_MIN_SIZE = 0.02
const MARKER_MAX_SIZE = 0.05
const MIN_THETA = -Math.PI / 2 + 0.1
const MAX_THETA = Math.PI / 2 - 0.1
const PHI_SENSITIVITY = 120
const THETA_SENSITIVITY = 120

const GLOBE_OPTIONS = {
  baseColor: [1, 1, 1],
  dark: 0,
  devicePixelRatio: 2,
  diffuse: 0,
  friction: 26,
  glowColor: [1, 1, 1],
  height: 400,
  mapBaseBrightness: 0,
  mapBrightness: 12,
  mapSamples: 15000,
  markerColor: [1, 1, 1],
  markers: (MARKERS as [number, number][]).map(location => ({
    location,
    size: Math.random() * (MARKER_MAX_SIZE - MARKER_MIN_SIZE) + MARKER_MIN_SIZE,
  })),
  mass: 0.1,
  offset: [0, 0],
  onRender: noop,
  opacity: 0.75,
  phi: 0,
  precision: 0.002,
  radius: 0,
  scale: 1,
  tension: 500,
  theta: 0.4,
  transitionDuration: 400,
  width: 400,
} satisfies GlobeOptions

const normalizeRgb = (color: [number, number, number]) =>
  color.map(n => Math.min(Math.max(n, 0), 255) / 255) as [number, number, number]

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const Globe = memo(({ className, ...options }: GlobeProps) => {
  const { friction, mass, precision, tension, ...config } = useMemo(() => {
    const { baseColor, glowColor, markerColor, markers, ...rest } = {
      ...GLOBE_OPTIONS,
      ...options,
    } as Required<GlobeOptions>

    const isMulticolor = Array.isArray(markerColor[0])
    const colors = ((isMulticolor ? markerColor : [markerColor]) as [number, number, number][]).map(normalizeRgb)
    const color = colors[0]

    return {
      ...rest,
      baseColor: normalizeRgb(baseColor),
      glowColor: normalizeRgb(glowColor),
      markerColor: color,
      markers: markers.map(({ color, ...marker }) => ({
        ...marker,
        color: color ?? (isMulticolor ? colors[Math.floor(Math.random() * colors.length)] : color),
      })),
    }
  }, [options])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paramsRef = useRef<COBEOptions>(null)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const baseRotationRef = useRef({
    phi: config.phi ?? 0,
    theta: clamp(config.theta ?? 0, MIN_THETA, MAX_THETA),
  })

  let width = 0

  useEffect(() => {
    baseRotationRef.current.phi = config.phi ?? baseRotationRef.current.phi
    baseRotationRef.current.theta = clamp(config.theta ?? baseRotationRef.current.theta, MIN_THETA, MAX_THETA)
  }, [config.phi, config.theta])

  useEffect(() => {
    const markers =
      paramsRef.current &&
      paramsRef.current?.markerColor.flat().sort().join('') === config.markerColor.flat().sort().join('')
        ? (paramsRef.current?.markers ?? [])
        : config.markers
    paramsRef.current = { ...config, markers }
  }, [config])

  const [{ phiDelta, thetaDelta }, springApi] = useSpring(
    () => ({
      config: { friction, mass, precision, tension },
      phiDelta: 0,
      thetaDelta: 0,
    }),
    [friction, mass, precision, tension]
  )

  const updateDrag = useCallback(
    (x: number, y: number) => {
      if (!pointerRef.current) return
      const deltaX = x - pointerRef.current.x
      const deltaY = y - pointerRef.current.y
      const targetTheta = clamp(baseRotationRef.current.theta + deltaY / THETA_SENSITIVITY, MIN_THETA, MAX_THETA)

      springApi.start({
        phiDelta: deltaX / PHI_SENSITIVITY,
        thetaDelta: targetTheta - baseRotationRef.current.theta,
        immediate: true,
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
    springApi.start({ phiDelta: 0, thetaDelta: 0, immediate: true })

    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab'
    }
  }, [baseRotationRef, canvasRef, phiDelta, springApi, thetaDelta])

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
    if (!canvasRef.current) return
    width = canvasRef.current.offsetWidth
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    window.addEventListener('resize', onResize)
    onResize()

    const globe = createGlobe(canvasRef.current, {
      ...config,
      onRender: cobe => {
        const state = cobe as COBEOptions

        if (!pointerRef.current) {
          baseRotationRef.current.phi += 0.005
        }

        const nextTheta = clamp(baseRotationRef.current.theta + thetaDelta.get(), MIN_THETA, MAX_THETA)

        state.phi = baseRotationRef.current.phi + phiDelta.get()
        state.theta = nextTheta
        state.width = width * 2
        state.height = width * 2

        if (!paramsRef.current) return
        if (!state.markers || state.baseColor?.some((n, i) => n !== paramsRef.current?.baseColor[i])) {
          state.markers = paramsRef.current.markers
        }

        state.baseColor = paramsRef.current.baseColor
        state.dark = paramsRef.current.dark
        state.diffuse = paramsRef.current.diffuse
        state.glowColor = paramsRef.current.glowColor
        state.mapBaseBrightness = paramsRef.current.mapBaseBrightness
        state.mapBrightness = paramsRef.current.mapBrightness
        state.mapSamples = paramsRef.current.mapSamples
        state.markerColor = paramsRef.current.markerColor
        state.offset = paramsRef.current.offset
        state.opacity = paramsRef.current.opacity
        state.scale = paramsRef.current.scale
      },
    })

    setTimeout(() => {
      if (!canvasRef.current) return
      canvasRef.current.style.opacity = '1'
    })

    return () => {
      globe.destroy()
      window.removeEventListener('resize', onResize)
    }
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
