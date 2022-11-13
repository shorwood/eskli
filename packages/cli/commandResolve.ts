import { cwd } from 'node:process'
import { createRequire } from 'node:module'
import { getFileName, noop, resolveImport, tries } from '@hsjm/shared'
import { commandNames } from './commandNames'

/**
 * Resolve the target function of the `eskli` command.
 * @param argvParameters The CLI parameters.
 * @throws If the command is not found or is not a function.
 */
export const commandResolve = (argvParameters: string[] = []) => {
  if (argvParameters.some(x => typeof x !== 'string'))
    throw new Error('Parameters must be strings.')

  // --- Initialize variables.
  const parameters = [...argvParameters]
  const commandModuleId = parameters[0] ?? 'index'
  const commandModuleFileName = getFileName(commandModuleId)
  const commandName = parameters[1]
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
  if (!commandModule) throw new Error(`Module "${commandModuleId}" was not found`)

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
    throw new TypeError(`Invalid command "${commandName}" for module "${commandModuleId}".${availablecommandString}`)
  }

  // --- Shift parameters if the first parameter is a module or file name.
  if (parameters[0] === commandModuleId) parameters.shift()
  else if (parameters[0] === commandModuleFileName) parameters.shift()

  // --- Shift parameters if the second parameter is a command name.
  if (command === commandModule.default) noop()
  else if (parameters[0] in commandModule) parameters.shift()
  else if (parameters[0] in globalThis) parameters.shift()
  else if (parameters[0] === commandName) parameters.shift()

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
