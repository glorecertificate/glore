/**
 * Dynamically imports a module and returns its default export.
 *
 * @param path - The path to the module to import.
 * @returns A promise that resolves to the default export of the module.
 */
export const importAsync = async <T>(path: string) => (await import(path)).default as T
