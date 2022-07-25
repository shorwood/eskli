import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { tries } from './tries'

/**
 * Resolve the absolute path of an import.
 * @param {string} importPath The import path.
 * @param {string} [from] The base path.
 * @returns {string} If the import was found, returns it's absolute path.
 * @throws {Error} If the import was not found.
 */
export const resolveImport = (importPath?: string, from: string = cwd()): string => {
  if (!importPath) throw new Error('[eskli:resolveImport] Missing import path.')

  // --- Try to resolve import's absolute path.
  // --- If the importPath is a package import.
  // --- If the importPath is a relative import.
  const resolvedPath = tries(
    () => require.resolve(<string>importPath, { paths: [from] }),
    () => require.resolve(resolve(from, <string>importPath)),
  )

  // --- Throw if the import was not found.
  if (!resolvedPath) throw new Error(`[eskli:resolveImport] Import "${importPath}" not found.`)

  // --- Return the absolute path.
  return resolvedPath
}
