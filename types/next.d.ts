import { Route, NextConfig as _NextConfig } from 'next'
import { type dependencies } from '../package.json'
import { ExperimentalConfig } from 'next/dist/server/config-shared'

type PackageDependency = keyof typeof dependencies

declare module 'next' {
  interface NextConfig extends _NextConfig {
    serverExternalPackages?: PackageDependency[]
    experimental?: ExperimentalConfig & {
      optimizePackageImports?: PackageDependency[]
    }
  }
}

declare module 'next/navigation' {
  function usePathname(): Route
}
