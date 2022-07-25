import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { resolveContext } from './resolveContext'
import { resolveImport } from './resolveImport'

/**
 * Resolve the absolute path of the type definition of a module.
 * @param {string} moduleId The module id to analyze.
 * @returns {string} The path of the type definition.
 */
export const resolveTypes = (moduleId: string) => {
  const entryPoint = resolveImport(moduleId)

  // --- Find the related `package.json` file.
  const packageJsonPath = resolveContext('package.json', entryPoint)
  const packageJsonRaw = readFileSync(packageJsonPath, 'utf8')
  const packageJson = JSON.parse(packageJsonRaw)

  // --- Find the path of the type definition.
  const typesRelativePath = packageJson.types || packageJson.typings
  const moduleRootDirectory = dirname(packageJsonPath)
  const resolvedPath = resolve(moduleRootDirectory, typesRelativePath)

  // --- Throw if the type definition was not found.
  if (!resolvedPath) throw new Error(`[eskli:resolveTypes] Type definition for "${moduleId}" not found.`)

  // --- Return the absolute path.
  return resolvedPath
}
