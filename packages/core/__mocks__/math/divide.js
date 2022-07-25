/**
 * Divide two numbers.
 * @param a The first number.
 * @param b The second number.
 * @returns The quotient of a and b.
 */
function divide(a, b) {
  return +a / +b
}

/**
 * Multiply two numbers.
 * @param {*} a The first number.
 * @param {*} b The second number
 * @returns The product of a and b.
 */
exports.multiply = (a, b) => +a * +b

exports.default = divide
