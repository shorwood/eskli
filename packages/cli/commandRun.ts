/* eslint-disable new-cap */
import { stringify } from 'yaml'

/**
 * Run the command and write the output to stdout.
 * @param {Function} command The command to run.
 * @param {any[]} parameters The parameters to pass to the command.
 * @param {any} options The options to pass to the command.
 * @returns {Promise<string>} The output of the command.
 */
export const commandRun = async(command: Function, parameters: string[], options: Record<string, any>): Promise<string> => {
  // Check if the command is a constructor.
  const commandArguments = Object.keys(options).length > 0
    ? [...parameters, options]
    : [...parameters]

  // --- Call the command.
  let output = command.toString().startsWith('class')
    // @ts-expect-error: ignore
    ? new command(...commandArguments)
    : command(...commandArguments)

  // --- If promise, wait for it to resolve.
  if (output instanceof Promise) output = await output

  // --- Print nothing if the command returned nothing.
  if (output === undefined || output === null) return ''

  // --- Stringify the buffer.
  if (output?.buffer) output = output.buffer
  if (output instanceof ArrayBuffer) {
    output = Buffer
      .from(output)
      .toString(options.outputEncoding ?? 'utf8')
  }

  // --- If the output is an array of strings, join them with a new line.
  if (Array.isArray(output) && output.every(x => typeof x !== 'object'))
    output = output.join('\n')

  // --- Convert the output to JSON/YAML if it's an object.
  if (typeof output === 'object') {
    output = options.yaml
      ? stringify(output)
      : JSON.stringify(output, undefined, 2)
  }

  // --- If the output is still not a string, stringify it.
  if (typeof output !== 'string') output = output.toString()

  // ---  Trim the output.
  output = output.trim()

  // --- Return the output.
  return output ? `${output}\n` : ''
}
