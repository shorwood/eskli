type CustomNumber = number

/**
 * ES Module exported named function.
 * @category Category
 * @param foo The foo parameter
 * @returns The return value
 */
export function esmExportNamed(foo = 42) { return foo }

/**
 * ES Module exported anonymous function.
 * @category Category
 * @param foo The foo parameter
 * @returns The return value
 */
export const esmExportConst = function(foo = 42) { return foo }

/**
 * ES Module exported named function.
 * @category Category
 * @param foo The foo parameter
 * @returns The return value
 */
export const esmExportConstArrowed = (foo = 42): string | CustomNumber => foo

/**
 * ES Module default export function.
 * @category Commands
 * @param foo The foo parameter
 * @returns The return value
 */
export default function(foo = 42) { return foo }
