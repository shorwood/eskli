import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { BuildOptions, build } from 'esbuild'
import { RollupOptions, rollup } from 'rollup'
import rollupDts from 'rollup-plugin-dts'
import rollupTypescript from '@rollup/plugin-typescript'
import { resolveDependencies } from './resolveDependencies'
import { resolveFrom } from './resolveFrom'
import { resolveImport } from './resolveImport'

export type BuildBundleOptions =
  | { bundler: 'rollup'; dts?: boolean } & RollupOptions
  | { bundler: 'esbuild' } & BuildOptions
  | Record<string, any>

/**
 * Builds a bundle from a module.
 * @param entryPoint The entry point.
 * @returns The bundle content.
 */
export const buildBundle = async(entryPoint?: string, options: BuildBundleOptions = {}): Promise<string> => {
  entryPoint = resolveImport(entryPoint)

  // --- Build the bundle using ESBuild.
  if (options.bundler === 'esbuild') {
    delete options.bundler
    const bundle = await build({
      ...(<BuildOptions>options),
      entryPoints: [entryPoint],
      target: `node${process.versions.node}`,
      bundle: true,
      write: false,
      tsconfig: resolveFrom('tsconfig.json', entryPoint),
    })

    // --- Return the bundle content.s
    return bundle.outputFiles?.[0].text
  }

  // --- Build the bundle using Rollup.
  else if (options.bundler === 'rollup') {
    const compilerOptions = {
      allowJs: true,
      checkJs: false,
      noImplicitAny: false,
      allowUnreachableCode: true,
      tsconfig: resolveFrom('tsconfig.json', entryPoint),
    }

    // @ts-expect-error: ignore
    const plugin = options.dts
      ? rollupDts({ compilerOptions })
      : rollupTypescript(compilerOptions)

    // @ts-expect-error: ignore
    delete options.dts
    delete options.bundler

    const bundle = await rollup({
      ...(<RollupOptions>options),
      input: entryPoint,
      output: { dir: 'dist', format: 'esm' },
      external: [],
      plugins: [plugin],
    })

    const { output } = await bundle.generate({})
    return output[0].code
  }

  // --- Concat the entry point and all dependencies.
  else {
    // --- Try to find a declaration file.
    try {
      const packageJsonPath = resolveFrom('package.json', entryPoint) as string
      const packageJsonContent = await readFile(packageJsonPath, 'utf8')
      const packageJson = JSON.parse(packageJsonContent)
      const packagePath = dirname(packageJsonPath)
      const typesPath = packageJson.types || packageJson.typings
      const typesPathAbsolute = resolve(packagePath, typesPath)
      if (existsSync(typesPathAbsolute)) entryPoint = typesPathAbsolute
    }
    catch {}

    // --- Explore the dependencies.
    const dependencies = [entryPoint, ...resolveDependencies(entryPoint)]

    // --- Get the file contents
    const contents = await Promise.all(dependencies.map(async(dependency) => {
      if (!existsSync(dependency)) return
      const content = await readFile(dependency, 'utf8')
      return `// ${dependency}\n${content}`
    }))

    // --- Return the bundle content.
    return contents.filter(Boolean).join('\n')
  }
}
