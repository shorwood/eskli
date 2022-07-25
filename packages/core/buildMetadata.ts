import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Node, Project, ts } from 'ts-morph'
import { buildHelp } from './buildHelp'
import { logTree } from './logTree'
import { resolveImport } from './resolveImport'
import { resolveTypes } from './resolveTypes'

export interface MetadataLayer {
  /**
   * The type the node:
   * - `function`: a function, method, arrow function, or constructor
   * - `constant`: a primitive value, or an object that does not contain any functions
   * - `module`: an object that contains at least one function, or the root of a module
   */
  type: 'function' | 'namespace' | 'module'
  /** Is the node exported */
  exported: boolean
  /** The name of the node */
  name?: string
  /** The absolute path to the file */
  path: string
  /** The description of the node, extracted from the JSDoc comment. */
  description?: string
  /** If the node is a module, this is the list of its children. */
  children: MetadataLayer[]
  /** If the node is a function, this is the list of its parameters. */
  parameters?: {
    /** Name of the parameter */
    name: string
    /** Description of the parameter */
    description?: string
    /** Type of the parameter */
    type: string[]
    /** Is the parameter optional */
    optional: boolean
    /** The default value of the parameter */
    defaultValue?: string
  }[]
  /** Category of the node */
  category?: string
  /** The return type of the function */
  returnType?: string
  /** The return description of the function */
  returnDescription?: string
}

/**
 * Bootstrap the `ts-morph` project by resolving the root path,
 * and creating a new project instance with the correct configuration.
 *
 * It will also
 * @param {string} moduleId The module id to analyze.
 * @returns {Project} The `ts-morph` project.
 */
const createProject = async(moduleId: string) => {
  const entryPoint = resolveImport(moduleId)

  // --- Create a TSMorph project.
  const project = new Project({
    useInMemoryFileSystem: true,
    // skipFileDependencyResolution: true,
    // skipAddingFilesFromTsConfig: true,
    // skipLoadingLibFiles: true,
    compilerOptions: {
      allowJs: true,
      checkJs: true,
      resolveJsonModule: true,
      // typeRoots: [resolveContext(entryPoint, 'node_modules/@types')],
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
    },
  })

  // --- Add the source files.
  const entryPointContent = await readFile(entryPoint, 'utf8')
  project.createSourceFile(entryPoint, entryPointContent, { overwrite: true })

  // --- Add the TypeScript definitions files.
  try {
    const typesPath = resolveTypes(entryPoint)
    const typesContent = await readFile(typesPath, 'utf8')
    project.createSourceFile(typesPath, typesContent)
  }
  catch {}

  // --- Add the dependencies.
  const dependenciesDeclarations = project
    .getSourceFiles()
    .flatMap(file => file.getExportDeclarations())
  for (const node of dependenciesDeclarations) {
    const moduleSpecifier = node.getModuleSpecifierValue()
    if (!moduleSpecifier) continue
    const sourceFilePath = node.getSourceFile().getFilePath()
    const sourceFileDirectory = dirname(sourceFilePath)
    const modulePath = resolveImport(moduleSpecifier, sourceFileDirectory)
    const moduleFile = await readFile(modulePath, 'utf8')
    node.getProject().createSourceFile(modulePath, moduleFile, { overwrite: true })
  }

  // --- Return the TSMorph project.
  return project
}

const extractExports = (node: Node) => {
  if (!Node.isSourceFile(node)
  && !Node.isModuleDeclaration(node)) return []

  const results = []
  const exportSymbols = node.getExportSymbols()
  const moduleSymbols = node.getSymbolsInScope(ts.SymbolFlags.ModuleMember)
  const exportedDeclarations = node.getExportedDeclarations()

  // --- Extract `export ...` declarations
  for (const [name, declarations] of exportedDeclarations)
    results.push({ name, declaration: declarations[0] })

  // // --- Extract `export.[name] = [value]` declarations.
  // for (const symbol of exportSymbols) {
  //   const declaration = symbol.getValueDeclaration()
  //   if (!declaration) continue
  //   const name = symbol.getName()
  //   results.push({ name, declaration })
  // }

  // // --- Extract `module.exports` exports
  // for (const symbol of moduleSymbols) {
  //   const declarations = symbol.getDeclarations()

  //   for (const declaration of declarations) {
  //     const name = symbol.getName()
  //     const kind = declaration.getKindName()
  //     console.log(`[module.exports] ${name} (${kind})`)
  //   }

  //   const declaration = symbol.getDeclarations().find(declaration => declaration.getKindName() === 'VariableDeclaration')
  //   const name = symbol.getAliasedSymbol()?.getName() ?? 'default'
  //   if (declaration) results.push({ name, declaration })
  // }

  // --- Return the metadata.
  return results
}

const extractFunction = (node: Node) => {
  if (!Node.isFunctionLikeDeclaration(node)
  && !Node.isFunctionExpression(node)
  && !Node.isArrowFunction(node)) return {}

  const signature = node.getSignature()
  const tags = signature.getJsDocTags()

  const findTags = (tagName: string) => tags
    .filter(tag => tag.getName() === tagName)
    .map(tag => tag.compilerObject.text?.map(t => t.text).join('\n'))

  const type = 'function'

  // --- Extract the description.
  const description = signature.getDocumentationComments().map(c => c.getText()).join('\r') || undefined
  const returnDescription = findTags('returns').join('\n') || undefined
  const category = findTags('category').pop()

  // --- Extract parameters and return types.
  const returnType = signature.getReturnType().getText() || undefined
  const parameters = node.getParameters().map((parameter) => {
    const name = parameter.getNameNode().getText()
    const type = parameter.getType().getText().split(' | ')
    const structure = parameter.getStructure()
    const optional = !!structure.hasQuestionToken
    const defaultValue = structure.initializer?.toString()
    return { name, type, optional, defaultValue }
  })

  return {
    type,
    description,
    returnType,
    returnDescription,
    category,
    parameters,
  }
}

const buildNodeMetadata = (node: Node) => {
  // if (Node.isCallExpression(node)) {
  //   node = node.getExpression()
  // }

  if (Node.isModuleDeclaration(node)) { node = node.getFirstChildByKindOrThrow(ts.SyntaxKind.TypeAliasDeclaration) }

  // --- Resolve variable value.
  else if (Node.isVariableDeclaration(node)) { node = node.getInitializer() ?? node }

  // --- Resolve binary assignment.
  else if (Node.isPropertyAccessExpression(node)) {
    console.log('PropertyAccessExpression', node.getParent()?.getParent()?.getParent()?.getKindName())
    logTree(node.getParent()?.getParent()?.getParent()?.getParent())
    node = node.getFirstAncestorByKindOrThrow(ts.SyntaxKind.BinaryExpression)?.getRight()
  }

  return {
    kind: node.getKindName(),
    ...extractFunction(node),
  }
}

/**
 * Prepare the `ts-morph` project and return the source file.
 * @param {string} entryPoint The entry point of the project.
 * @returns {Promise<SourceFile>} A promise that resolves to th `ts-morph` entry point's source file.
 */
export const buildMetadata = async(moduleId: string) => {
  const entryPoint = resolveImport(moduleId)
  const project = await createProject(entryPoint)
  const sourceFile = project.getSourceFileOrThrow(entryPoint)
  const ambientModuleDeclarations
  = project.getAmbientModule(moduleId)?.getDeclarations()
    ?? project.getAmbientModules().flatMap(m => m.getDeclarations())

  // --- Extract the exported declarations from the source file.
  const allSourceFiles = [sourceFile, ...ambientModuleDeclarations]
  const children = []

  for (const sourceFile of allSourceFiles) {
    const exports = extractExports(sourceFile)
    const path = sourceFile.getFilePath()

    for (const { name, declaration } of exports) {
      const metadata = buildNodeMetadata(declaration)
      if (!metadata.type) continue
      children.push({ name, ...metadata })
      console.log(name, metadata)
    }
  }

  const metadata = {
    name: moduleId,
    path: entryPoint,
    children,
  }

  const help = buildHelp(metadata)

  console.log(help)
}
