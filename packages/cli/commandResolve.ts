import { cwd } from 'node:process'
import { createRequire } from 'node:module'
import { getFileName, resolveImport, tries } from '@eskli/core'
import { commandNames } from './commandNames'

/**
 * Get the commanded module command of the `eskli` command.
 * @param cliArguments The CLI parameters.
 * @throws If the command is not found or is not a function.
 */
export const commandResolve = (cliArguments: string[] = []) => {
  if (cliArguments.some(x => typeof x !== 'string')) throw new Error('[eskli] Parameters must be strings.')

  // --- Initialize variables.
  const parameters = [...cliArguments]
  const commandModuleId = parameters.shift() ?? 'index'
  const commandModuleFileName = getFileName(commandModuleId)
  const commandName = parameters[0]
  let commandModulePath: string | undefined

  // --- Create the `require` function.
  const currentPath = cwd()
  const require = createRequire(currentPath)

  // --- Resolve the targeted script's module:
  // --- 1. In the globalThis namespace.
  // --- 2. In the relative or package modules.
  // --- 3. In the `index` module of the current directory.
  const commandModule = tries(
    () => (<any>globalThis)[commandModuleId],
    () => require(commandModulePath = resolveImport(commandModuleId)),
    () => require(commandModulePath = resolveImport('index')),
  )

  // --- Make sure a module was found.
  if (!commandModule) throw new Error(`[eskli] Module "${commandModuleId}" was not found`)

  // --- Search for the targeted function:
  // --- 1. In the named exports of the module.
  // --- 2. In the export named like the file.
  // --- 3. Fall back to the default export of the module.
  // --- 4. Fall back to the module itself.
  const command = tries(
    () => commandModule[commandName],
    () => commandModule[commandModuleFileName],
    () => commandModule.default,
    () => commandModule,
  )

  // --- Throws if the target is not a function.
  if (typeof command !== 'function') {
    const commandNamesString = commandNames(commandModule).join(', ')
    const availablecommandString = commandNamesString.length > 0 ? `\nAvailable commands: ${commandNamesString}` : ''
    throw new TypeError(`[eskli:resolvecommand] Invalid command "${commandName}" for module "${commandModuleId}".${availablecommandString}`)
  }

  // --- Remove or add parameters.
  if (command.name === commandModuleFileName) parameters.shift()
  if (command === commandModule.default) parameters.unshift(commandModuleId)

  // --- Return the command.
  return {
    command,
    commandName,
    commandModule,
    commandModuleId,
    commandModulePath,
    commandModuleFileName,
    parameters,
  }
}
