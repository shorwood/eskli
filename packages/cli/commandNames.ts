/**
 * Get all functions names in the given object.
 * @param module The module.
 * @returns The function names
 */
export const commandNames = (module: any): string[] => {
  const names: string[] = []

  // --- Get enumerable properties.
  for (const [name, value] of Object.entries(module))
    if (typeof value === 'function') names.push(name)

  // --- Get own properties.
  for (const name of Object.getOwnPropertyNames(module))
    if (typeof module[name] === 'function') names.push(name)

  // --- Return the names.
  return [...new Set(names)]
}
