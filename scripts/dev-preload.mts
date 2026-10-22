import asyncHooks, { type AsyncHook, type HookCallbacks } from 'node:async_hooks'

const createHook = asyncHooks.createHook.bind(asyncHooks)

export const isReactAsyncDebugHook = (callbacks: HookCallbacks) => String(callbacks.init).includes('pendingOperations')

asyncHooks.createHook = callbacks => {
  if (!isReactAsyncDebugHook(callbacks)) return createHook(callbacks)
  const hook: AsyncHook = { disable: () => hook, enable: () => hook }
  return hook
}
