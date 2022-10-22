/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unicorn/no-process-exit */
/* eslint-disable unicorn/prevent-abbreviations */

// --- Magic Esbuild thingy
import '@esbuild-kit/cjs-loader'
import '@esbuild-kit/esm-loader'

// --- Import dependencies
import { argv, stdout } from 'node:process'
import { parseArgv } from '@hsjm/shared'
import { commandResolve } from './commandResolve'
import { commandRun } from './commandRun'

// --- Parse the command line parameters.
const { args, options, scriptPath } = parseArgv(argv)
const isEskli = scriptPath.includes('eskli/dist/cli.js')
const isHelp = options.help || options.h

const main = async() => {
  const { command, parameters } = commandResolve(args)

  // --- Show help if no command was found or if the help option was passed.
  if (isHelp) {
    // const helpObjects = await buildHelp(modulePath)
    // const helpObject = helpObjects.find(helpObject => helpObject.name === command.name)
    // if (!helpObject) throw new Error(`[eskli] No help found for command "${command.name}".`)
    // const helpMessage = [
    //   `Usage: ${isEskli ? 'eskli ' : ' '}${moduleId} ${helpObject.name} ${helpObject.params.map(param => `[${param.name}]`).join(' ')}`,
    // ].join('\n')
    // stdout.write(helpMessage)
  }

  // --- Run command.
  else {
    const output = await commandRun(command, parameters, options)
    stdout.write(output)
  }

  // --- Exit with success.
  process.exitCode = 0
}

// --- Run the main function and catch any errors.
main().catch((error: Error) => {
  if (options.trace) stdout.write(`${error.stack}\n`)
  else stdout.write(`${error.name}: ${error.message}\n`)

  // --- Exit with error.
  process.exitCode = 1
})
