import { buildBundle } from './buildBundle'
import { resolveImport } from './resolveImport'

/**
 * Build CLI commentumentation for a given entry point.
 * @param {string} entryPoint The entry point.
 */
export const buildHelp = async(entryPoint?: string) => {
  entryPoint = resolveImport(entryPoint)

  // --- Get the declaration file.
  const dtsContent = await buildBundle(entryPoint)
  const comments = [...dtsContent.matchAll(/\/\*\*\s*(.+?)\s*\*\/\s*(.+?)\s*\n/gs)]

  // --- Parse the commentumentation.
  const helpObjects = comments.map(([, comment, declaration]) => {
    comment = comment.replace(/^ *\* */gm, '')

    // --- Extract the description.
    const description = comment
      .slice(0, comment.indexOf('@'))
      .replace(/\n+/g, ' ')
      .trim()

    // --- Extract the name from the declaration.
    const name = declaration.match(/(var +|const +|function +|exports.|module.exports.)(\w+)/)?.[2]
    const category = comment.match(/@category (\w+)/)?.[1] ?? 'Commands'

    // --- Parse the parameters.
    const parameters = comment
      .split('\n')
      .filter(line => line.startsWith('@param'))
      .map((line) => {
        // --- Extract the parameters
        const [, type, name, defaultName, defaultValue, description]
        = line.match(/@param\s+(?:{(\w+)}\s+)?(?:(\w+)|\[(\w+?)(?:=(\w+?))?])\s+(.+)/) ?? []

        // --- Return the parameter
        return {
          type,
          category,
          name: name ?? defaultName,
          defaultValue,
          description,
          isOptional: !!defaultName || !!defaultValue,
        }
      })

    const usageParameters = parameters.map((parameter) => {
      const name = parameter.name?.toUpperCase()
      const type = parameter.type?.toUpperCase()
      const defaultValue = parameter.defaultValue

      let parameterUsage = name

      if (type) parameterUsage = `${type}:${parameterUsage}`
      if (defaultValue) parameterUsage = `[${parameterUsage}=${defaultValue}]`

      return parameterUsage
    }).join(' ')

    // --- Return the help object
    return { name, description, parameters, usageParameters }
  })

  // --- Return the help objects
  return helpObjects
}
