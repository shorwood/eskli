/* eslint-disable unicorn/prevent-abbreviations */

/**
 * Try multiple functions and return the first one that does not throw or is not undefined.
 * @param {...Function[]} functions The functions to try.
 * @returns {any | undefined} The first result that does not throw or is not undefined.
 * @example
 * const noop = () => {}
 * const throws = () => { throw new Error }
 * tries(throws, noop, Date.now) // returns 1658682347132
 */
export const tries = <T>(...functions: Array<() => T>): T | undefined => {
  for (const fn of functions) {
    try { const result = fn(); if (result !== undefined) return result }
    catch {}
  }
}
