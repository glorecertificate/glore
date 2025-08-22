'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'

import { cn } from '@udecode/cn'
import createGlobe, { type COBEOptions, type Marker } from 'cobe'
import { useSpring } from 'react-spring'

import { noop } from '@repo/utils/noop'
import { rgb } from '@repo/utils/rgb'
import { type Rgb } from '@repo/utils/types'

import { useTheme } from '@/hooks/use-theme'

export interface GlobeOptions extends Omit<COBEOptions, 'baseColor' | 'dark' | 'glowColor' | 'markerColor'> {
  // Spring
  friction: number
  mass: number
  precision: number
  radius: number
  tension: number
  // Colors
  baseColor: [Rgb, Rgb]
  dark: number
  glowColor: [Rgb, Rgb]
  markerColor: [Rgb, Rgb]
}

const GLOBE_MARKERS: Marker[] = [
  {
    // London
    location: [51.5074, -0.1278],
    size: 0.017732,
  },
  {
    // New York
    location: [40.7128, -74.006],
    size: 0.017246,
  },
  {
    // San Francisco
    location: [37.7749, -122.4194],
    size: 0.009454,
  },
  {
    // Paris
    location: [48.8566, 2.3522],
    size: 0.004282,
  },
  {
    // Tokyo
    location: [35.6895, 139.6917],
    size: 0.02703,
  },
  {
    // Sydney
    location: [-33.8688, 151.2093],
    size: 0.008058,
  },
  {
    // Moscow
    location: [55.7558, 37.6176],
    size: 0.02384,
  },
  {
    // Cape Town
    location: [-33.9249, 18.4241],
    size: 0.00748,
  },
  {
    // Buenos Aires
    location: [-34.6037, -58.3816],
    size: 0.006108,
  },
  {
    // Rio de Janeiro
    location: [-22.9068, -43.1729],
    size: 0.01264,
  },
  {
    // Mexico City
    location: [19.4326, -99.1332],
    size: 0.042678,
  },
  {
    // Beijing
    location: [39.9042, 116.4074],
    size: 0.043032,
  },
  {
    // Mumbai
    location: [19.076, 72.8777],
    size: 0.024956,
  },
  {
    // Istanbul
    location: [41.0082, 28.9784],
    size: 0.030058,
  },
  {
    // Cairo
    location: [30.0244, 31.2357],
    size: 0.019,
  },
  {
    // Dubai
    location: [25.276987, 55.296249],
    size: 0.006274,
  },
  {
    // Seoul
    location: [37.5665, 126.978],
    size: 0.019926,
  },
  {
    // Bangkok
    location: [13.7563, 100.5018],
    size: 0.016562,
  },
  {
    // Singapore
    location: [1.3521, 103.8198],
    size: 0.011214,
  },
  {
    // Hong Kong
    location: [22.3193, 114.1694],
    size: 0.014784,
  },
  {
    // Shanghai
    location: [31.2304, 121.4737],
    size: 0.048366,
  },
  {
    // Taipei
    location: [25.033, 121.5654],
    size: 0.005408,
  },
  {
    // Jakarta
    location: [-6.2088, 106.8456],
    size: 0.02027,
  },
  {
    // Manila
    location: [14.5995, 120.9842],
    size: 0.027846,
  },
  {
    // Kuala Lumpur
    location: [3.139, 101.6869],
    size: 0.0145,
  },
  {
    // Hanoi
    location: [21.0278, 105.8342],
    size: 0.014758,
  },
  {
    // Delhi
    location: [28.6139, 77.209],
    size: 0.03796,
  },
  {
    // Karachi
    location: [24.8607, 67.0011],
    size: 0.02982,
  },
  {
    // Tehran
    location: [35.6892, 51.389],
    size: 0.017388,
  },
  {
    // Lagos
    location: [6.5244, 3.3792],
    size: 0.026246,
  },
]

export const GLOBE_OPTIONS: GlobeOptions = {
  devicePixelRatio: 2,
  diffuse: 0,
  height: 400,
  mapBaseBrightness: 0,
  mapBrightness: 6,
  mapSamples: 14000,
  opacity: 1,
  phi: 0,
  scale: 1,
  theta: 0.4,
  width: 400,
  friction: 40,
  mass: 1,
  precision: 0.001,
  tension: 280,
  radius: 0,
  onRender: noop,
  dark: 0,
  baseColor: [rgb(20, 71, 230), rgb(25, 60, 184)],
  glowColor: [rgb(236, 238, 220), rgb(30, 41, 56)],
  markerColor: [rgb(2, 167, 61), rgb(255, 215, 104)],
  markers: GLOBE_MARKERS,
} as const

export interface GlobeProps extends Partial<GlobeOptions> {
  className?: string
}

export const Globe = ({ className, ...options }: GlobeProps) => {
  const { resolvedTheme: theme } = useTheme()

  let phi = 0
  let width = 0

  const ref = useRef<HTMLCanvasElement>(null)
  const pointer = useRef<number>(null)
  const pointerInteractionMovement = useRef(0)

  const { baseColor, friction, glowColor, markerColor, mass, precision, radius, tension, ...config } = useMemo(
    () =>
      ({
        ...GLOBE_OPTIONS,
        ...options,
      }) as Required<GlobeOptions>,
    [options],
  )

  const colors = useMemo(() => {
    const themeIndex = theme === 'dark' ? 1 : 0

    return {
      baseColor: baseColor[themeIndex],
      dark: 0,
      glowColor: glowColor[themeIndex],
      markerColor: markerColor[themeIndex],
    }
  }, [baseColor, glowColor, markerColor, theme])

  const [{ r }, api] = useSpring(() => ({ config: { friction, mass, precision, tension }, r: radius }))

  const onResize = useCallback(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (ref.current) width = ref.current.offsetWidth
  }, [])

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!pointer.current) return
      const delta = e.clientX - pointer.current
      pointerInteractionMovement.current = delta
      void api.start({ r: delta / 200 })
    },
    [api],
  )

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointer.current = e.clientX - pointerInteractionMovement.current
    if (!ref.current) return
    ref.current.style.cursor = 'grabbing'
  }, [])

  const onPointerOut = useCallback(() => {
    pointer.current = null
    if (!ref.current) return
    ref.current.style.cursor = 'grab'
  }, [])

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pointer.current) return
      const delta = e.touches[0].clientX - pointer.current
      pointerInteractionMovement.current = delta
      void api.start({ r: delta / 100 })
    },
    [api],
  )

  useEffect(() => {
    if (!ref.current) return

    window.addEventListener('resize', onResize)
    onResize()

    const globeVariants = createGlobe(ref.current, {
      ...config,
      ...colors,
      onRender: state => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (!pointer.current) phi += 0.005
        state.phi = phi + (r?.get() ?? 0)
        state.width = width * 2
        state.height = width * 2
      },
    })

    setTimeout(() => {
      if (!ref.current) return
      ref.current.style.opacity = '1'
    })

    return () => {
      globeVariants.destroy()
      window.removeEventListener('resize', onResize)
    }
  }, [colors, config, onResize, phi, r, width])

  return (
    <canvas
      className={cn('opacity-0 transition-opacity duration-300', className)}
      onMouseMove={onMouseMove}
      onPointerDown={onPointerDown}
      onPointerOut={onPointerOut}
      onPointerUp={onPointerOut}
      onTouchMove={onTouchMove}
      ref={ref}
    />
  )
}
