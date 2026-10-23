export interface Tree {
  [key: string]: Tree | string
}

const SEPARATOR = '.'

const isTree = (value: unknown): value is Tree => typeof value === 'object' && value !== null && !Array.isArray(value)

const split = (key: string) => key.split(SEPARATOR)

const parentOf = (tree: Tree, parts: string[]) => {
  let node: Tree | string | undefined = tree
  for (const part of parts.slice(0, -1)) {
    if (!isTree(node)) return null
    node = node[part]
  }
  return isTree(node) ? node : null
}

export const hasLeaf = (tree: Tree, key: string) => {
  const parts = split(key)
  const value = parentOf(tree, parts)?.[parts.at(-1) ?? '']
  return typeof value === 'string'
}

export const hasNode = (tree: Tree, key: string) => {
  const parts = split(key)
  return parentOf(tree, parts)?.[parts.at(-1) ?? ''] !== undefined
}

export const setLeaf = (tree: Tree, key: string, value: string) => {
  const parts = split(key)
  let node = tree
  for (const part of parts.slice(0, -1)) {
    const child = node[part]
    if (isTree(child)) {
      node = child
      continue
    }
    const created: Tree = {}
    node[part] = created
    node = created
  }
  node[parts.at(-1) ?? ''] = value
}

const removeLeaf = (tree: Tree, key: string) => {
  const parts = split(key)
  const trail: Tree[] = [tree]
  for (const part of parts.slice(0, -1)) {
    const child = trail.at(-1)?.[part]
    if (!isTree(child)) return false
    trail.push(child)
  }
  const last = parts.at(-1) ?? ''
  const holder = trail.at(-1)
  if (!holder || typeof holder[last] !== 'string') return false
  delete holder[last]
  for (let depth = trail.length - 1; depth > 0; depth -= 1) {
    const node = trail[depth]
    if (!node || Object.keys(node).length > 0) break
    delete trail[depth - 1]?.[parts[depth - 1] ?? '']
  }
  return true
}

export const renameLeaf = (tree: Tree, oldKey: string, newKey: string) => {
  if (!hasLeaf(tree, oldKey)) return false
  const oldParts = split(oldKey)
  const newParts = split(newKey)
  const oldParent = oldParts.slice(0, -1).join(SEPARATOR)
  const newParent = newParts.slice(0, -1).join(SEPARATOR)
  const parent = parentOf(tree, oldParts)
  const last = oldParts.at(-1) ?? ''
  const renamed = newParts.at(-1) ?? ''
  if (parent && oldParent === newParent) {
    const entries = Object.entries(parent).map(([name, value]) => [name === last ? renamed : name, value] as const)
    for (const name of Object.keys(parent)) delete parent[name]
    Object.assign(parent, Object.fromEntries(entries))
    return true
  }
  const value = parent?.[last]
  if (typeof value !== 'string') return false
  removeLeaf(tree, oldKey)
  setLeaf(tree, newKey, value)
  return true
}

export const serializeCatalog = (tree: Tree) => `${JSON.stringify(tree, null, 2)}\n`
