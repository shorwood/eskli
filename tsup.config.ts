import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['index.ts', './*/index.ts'],
    format: ['cjs', 'esm'],
    outDir: 'dist',
    splitting: false,
    shims: true,
    clean: true,
    dts: true,
  },
  {
    entry: ['./cli.ts'],
    target: ['node12'],
    format: ['cjs'],
    outDir: 'bin',
    // external: ['esbuild'],
    // noExternal: [/.+/],
    minify: true,
    splitting: false,
    shims: true,
    clean: true,
  },
])
