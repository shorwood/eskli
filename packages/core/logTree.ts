/* eslint-disable unicorn/prevent-abbreviations */

export const logTree = (node: any, depth = 0, maxDepth = 10) => {
  if (!node) return
  if (depth > maxDepth) return
  const isExported = node.isExported?.()
  const isFromExternalLibrary = node.isFromExternalLibrary?.()
  const isInNodeModules = false // node.isInNodeModules?.()
  if (isFromExternalLibrary || isInNodeModules) return
  const indent = ' '.repeat(depth * 2)
  const kindName = node.getKindName()
  const text = node.getText().split('\n')[0]
  console.log(`${indent}[${depth}:${kindName}]: ${isExported ? ' (exported)' : text}`)
  for (const child of node.getChildren()) logTree(child, depth + 1, maxDepth)
}
