/**
 * ESModule keyword exported named function.
 * @category Category
 * @param {number} [foo=42] The foo parameter
 * @returns {number} The return value
 */
const cjsExportNamed = function esmExportNamed(foo = 42) { return foo }

/**
 * ESModule keyword exported anonymous function.
 * @category Category
 * @param {number} [foo=42] The foo parameter
 * @returns {number} The return value
 */
const cjsExportConst = function(foo = 42) { return foo }

/**
 * ESModule keyword exported named function.
 * @category Category
 * @param {number} [foo=42] The foo parameter
 * @returns {number} The return value
 */
const cjsExportConstArrowed = (foo = 42) => foo

/**
 * ESModule keyword default export function.
 * @category Commands
 * @param foo The foo parameter
 * @returns The return value
 */
const defaults = function(foo = 42) { return foo }

module.exports = {
  cjsExportNamed,
  cjsExportConst,
  cjsExportConstArrowed,
  default: defaults,
}
