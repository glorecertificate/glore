export const PLAYWRIGHT_IMAGE =
  'mcr.microsoft.com/playwright:v1.65.0-noble@sha256:9beb546099e11f52d62e505537914870e01a67e0e6b00ae41da4775324e73dbe'

export const PLAYWRIGHT_CONTAINER = 'glore-playwright'

export const PLAYWRIGHT_PORT = 3200

export const PLAYWRIGHT_ENDPOINT = `ws://127.0.0.1:${PLAYWRIGHT_PORT}/`

export const imageVersion = (image: string) => /:v(?<version>\d+\.\d+\.\d+)-/u.exec(image)?.groups?.version
