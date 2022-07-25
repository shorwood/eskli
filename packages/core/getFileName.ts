/**
 * Get the file name of an absolute path without the extension.
 * @param {string} path The absolute path.
 * @returns {string} The file name.
 * @example
 * getFileName('/path/to/file.js') // returns 'file'
 */
export const getFileName = (path: string): string => {
  const fileName = path.split('/').pop()
  if (!fileName) throw new Error('[eskli:getFileName] Missing file name.')
  return fileName.split('.')[0]
}
