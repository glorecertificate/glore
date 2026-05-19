import { Route } from 'next'

declare module 'next/navigation' {
  function usePathname(): Route
}
