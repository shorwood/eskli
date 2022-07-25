/**
 * ESModule assignment exported named function.
 * @category Category
 * @param {number} [foo=42] The foo parameter
 * @returns {number} The return value
 */
exports.mjsExportNamed = function esmExportNamed(foo = 42) { return foo }

/**
 * ESModule assignment exported anonymous function.
 * @category Category
 * @param {number} [foo=42] The foo parameter
 * @returns {number} The return value
 */
exports.mjsExportConst = function(foo = 42) { return foo }

/**
 * ESModule assignment exported named function.
 * @category Category
 * @param {number} [foo=42] The foo parameter
 * @returns {number} The return value
 */
exports.mjsExportConstArrowed = (foo = 42) => foo

/**
 * ESModule assignment default export function.
 * @category Commands
 * @param foo The foo parameter
 * @returns The return value
 */
exports.default = function(foo = 42) { return foo }
