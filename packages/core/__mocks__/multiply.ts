/**
 * Multiply two numbers together.
 * @param a The first number.
 * @param {number | string} b The second number.
 * @returns The product of a and b.
 */
export const multiply = (a: number, b: number): number => +a * +b

export const arithmetic = {
  multiply,
}

export default multiply
exports.default = multiply
export { multiply as Multiply }
