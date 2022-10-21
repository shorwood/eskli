/* eslint-disable unicorn/prevent-abbreviations */
import { createRequire } from 'node:module'
import { cwd } from 'node:process'
import { resolve } from 'node:path'
import { getFileName, resolveImport, tries } from '@eskli/core'
import { commandNames } from './commandNames'

/**
 * Get the commanded module command of the `eskli` command.
 * @param {string[]} parameters The CLI parameters.
 * @throws If the command is not found or is not a function.
 */
export const commandResolve = (args: string[]) => {
  if (args.length === 0) throw new Error('[eskli] Please specify a command.')
  if (args.some(x => typeof x !== 'string')) throw new Error('[eskli] Parameters must be strings.')

  // --- Initialize variables.
  const parameters = [...args]
  const commandModuleName = parameters.shift() as string
  const commandModuleFileName = getFileName(commandModuleName)
  const commandName = parameters[0] || 'default'
  let commandModulePath: string | undefined

  // --- Create the `require` function.
  const currentPath = cwd()
  const require = createRequire(currentPath)

  // --- Try to resolve the targeted script path.
  const commandModule = tries(
    () => require(commandModulePath = resolveImport(commandModuleName)),
    () => (<any>globalThis)[commandModuleName],
  )

  // --- Make sure the script was found.
  if (!commandModule) throw new Error(`[eskli] Module "${commandModuleName}" was not found`)

  // --- Find the command function.
  // --- If the command is a named export.
  // --- If the commandModule exports a function named like it's commandModule id.
  // --- If the command is a default export.
  const command = tries(
    () => commandModule[commandName],
    () => commandModule[commandModuleFileName],
    () => commandModule,
  )

  // --- Throws if the command is not found.
  if (typeof command !== 'function') {
    const commandNamesString = commandNames(commandModule).join(', ')
    const availablecommandString = commandNamesString.length > 0 ? `\nAvailable commands: ${commandNamesString}` : ''
    throw new TypeError(`[eskli:resolvecommand] Invalid command "${commandName}" for module "${commandModuleName}".${availablecommandString}`)
  }

  // --- Remove the command name from the parameters.
  if (command.name !== commandModuleFileName) parameters.shift()

  // --- Return the command.
  return {
    command,
    commandName,
    commandModule,
    commandModuleName,
    commandModulePath,
    commandModuleFileName,
    parameters,
  }
}
