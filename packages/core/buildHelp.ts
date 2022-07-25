import { MetadataLayer } from './buildMetadata'

const formatCommand = (command: MetadataLayer) => {
  // --- Extract the command name.
  const name = command.name ?? 'default'

  // Convert markdown hyperlinks to Terminal hyperlinks
  const description = command.description
    ? command.description

      // --- Convert markdown hyperlinks to Terminal hyperlinks.
      .replace(/\[(.+?)]\((.+?)\)/g, '\u001B]8;;$2\u001B\\$1\u001B]8;;\u001B\\')

      // --- Clamp the description to 80 characters.
      .replace(/.{1,80}(?:\s|$)/g, '$&')

      // --- Bold and color the description.
      .replace(/`(.+?)`/g, '\u001B[1m\u001B[32m$1\u001B[39m\u001B[22m')

      // --- Remove newlines.
      .replace(/\n+/g, ' ')
      .split(/[,.;] +/g)
      .shift()
    : ''

  // --- Extract the command usage.
  return `  ${name.padEnd(24)} ${description}`
}

/**
 * Build CLI documentation from a `MetadataLayer`.
 * @param metadata The metadata layer.
 * @returns The CLI documentation.
 */
export const buildHelp = (metadata: MetadataLayer) => {
  const name = metadata.name
  const description = metadata.description

  const categoriesAll = metadata.children.map(command => command.category)
  const categories = [...new Set(categoriesAll)]

  const commands = categories.map((category) => {
    const commands = metadata.children.filter(command => command.category === category)
    const commandsFormatted = commands.map(formatCommand).join('\n')
    return `${category ?? 'Commands'}:\n${commandsFormatted}`
  })

  // --- Build the help text
  return [
    `Usage: ${name} [OPTIONS] COMMAND [ARGS]...`,
    description,
    ...commands,
  ]
    .filter(Boolean)
    .join('\n\n')
}
