import { readFileSync } from "node:fs"

/**
 * Resolve alias of an import using the TS config.
 * @param {string} importPath The import path.
 * @param {string} from The context directory.
 */
export const resolveAlias = (importPath: string, from: string): string => {
  
    // --- Replace with the TS config path.
    const tsConfig = tsConfigPath && JSON.parse(readFileSync(tsConfigPath, 'utf8'))
    const tsConfigPaths = tsConfig?.compilerOptions?.paths ?? {}
    for (const [alias, path] of Object.entries(tsConfigPaths)) {
      if (importPath.startsWith(alias))
        importPath = importPath.replace(alias, (<any>path)[0])
    }