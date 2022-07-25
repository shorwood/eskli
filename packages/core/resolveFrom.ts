import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * Find path of a file in the context directory or one of its ancestors.
 * @param {string} fileName The file name to find.
 * @param {string} [from] The path to start from.
 * @returns {string | undefined} If the file was found, returns the absolute path.
 * @example
 * resolveContext('package.json') // returns the absolute path of `package.json`
 * resolveContext('tsconfig.json') // returns the absolute path of `tsconfig.ts`
 */
export const resolveFrom = (fileName: string, from: string = process.cwd()): string | undefined => {
  // --- Try to find the file in the current working directory or parent directories.
  while (true) {
    const filePath = resolve(from, fileName)
    if (existsSync(filePath)) return filePath
    from = dirname(from)
    if (from === '/') break
  }

  // --- If the file was not found, return undefined.
  return undefined
}
