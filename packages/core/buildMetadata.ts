import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { FunctionDeclaration, Identifier, Node, Project, ScriptTarget, SyntaxKind } from 'ts-morph'
import { resolveDependencies } from './resolveDependencies'
import { resolveImport } from './resolveImport'

export interface Functions {
  name: string
  description: string
  parameters: Parameter[]
  returns: Parameter
}

export interface Parameter {
  type: string
  name: string
  defaultValue?: string
  description: string
  isOptional: boolean
}

export const logTree = (node: Node, depth = 0) => {
  const isExported = node.isExported?.()
  const isFromExternalLibrary = node.isFromExternalLibrary?.()
  const isInNodeModules = node.isInNodeModules?.()
  if (isFromExternalLibrary || isInNodeModules) return

  const indent = ' '.repeat(depth * 2)
  const kindName = node.getKindName()
  const text = node.getText()

  console.log(`${indent}- ${kindName}: ${isExported ? ' (exported)' : text}`)

  for (const child of node.getChildren()) logTree(child, depth + 1)
}

export const findExportedChildren = (node: Node): Node[] => {
  // @ts-expect-error: ignore - Check if the node is exported.
  if (node.isExported?.()) return [node]
  return node.getChildren()?.flatMap(findExportedChildren) ?? []
}

export const findIdentifier = (node: Node): Identifier | undefined => {
  if (node.getKindName() === 'Identifier') return node as Identifier
  return node.getChildren()
    ?.filter(child => child.getKind() !== SyntaxKind.JSDoc)
    .find(findIdentifier) as Identifier | undefined
}

/**
 * Build metadata of an entrypoint with `@microsoft/tsdoc`
 * @param entryPoint The entry point.
 * @returns The metadata.
 */
export const buildMetadata = async(entryPoint?: string) => {
  entryPoint = resolveImport(entryPoint)

  // --- Create a TSMorph project.
  const project = new Project({
    skipFileDependencyResolution: true,
    skipAddingFilesFromTsConfig: true,
    skipLoadingLibFiles: true,
    compilerOptions: {
      allowJs: true,
      checkJs: false,
      jsx: 0,
      types: [resolve(__dirname, '../node_modules/@types/node')],
      target: ScriptTarget.ESNext,
    },
  })

  // --- Get the entry point and dependencies contents.
  const sourceFilePaths = [entryPoint, ...resolveDependencies(entryPoint)]
  const sourceFileContent = await Promise.all(sourceFilePaths.map(async path => ({
    path: path.replace(/.ts$/g, '.js'),
    content: await readFile(path, 'utf8').catch(() => ''),
  })))

  // --- Add the source files to the TSMorph project.
  for (const { path, content } of sourceFileContent)
    project.createSourceFile(path, content, { overwrite: true })

  // --- Get all exported declarations.
  const sourceFiles = project.getSourceFiles()
  const allExports = sourceFiles.flatMap(findExportedChildren)

  for (const x of allExports) {
    logTree(x)
    const identifier = findIdentifier(x)
    const identifierKindName = identifier?.getKindName()
    console.log(identifierKindName)
  }
}
