import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * Find path of a file in the context directory or one of its ancestors.
 * @param {string} fileName The file name to find.
 * @param {string} [from] The path to start from.
 * @returns {string} If the file was found, returns the absolute path.
 * @example
 * resolveContext('.npmrc') // '/home/user/.npmrc'
 * resolveContext('package.json') // '/home/user/project/package.json'
 * resolveContext('tsconfig.json') // '/home/user/project/tsconfig.json'
 */
export const resolveContext = (fileName: string, from: string = process.cwd()): string => {
  // --- Try to find the file in the current working directory or parent directories.
  while (from !== '/') {
    const filePath = resolve(from, fileName)
    if (existsSync(filePath)) return filePath
    from = dirname(from)
  }

  // --- If the file was not found, return undefined.
  throw new Error(`[eskli:resolveContext] File "${fileName}" not found in "${from}".`)
}
