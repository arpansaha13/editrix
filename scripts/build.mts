import { builtinModules } from 'module'
import { join, resolve } from 'node:path'
import { build } from 'vite'
import tscOut from '@arpansaha13/tsc-out'

const LOG_PREFIX = '[BUILD:INFO]:'

const viteBuild = (entry: string, name: string) =>
  build({
    build: {
      outDir: 'core/dist',
      emptyOutDir: true,
      lib: {
        entry,
        formats: ['es', 'cjs'],
        fileName: format => {
          switch (format) {
            case 'es':
              return `${name}.mjs`
            case 'cjs':
              return `${name}.cjs`
            default:
              return `${name}.${format}.js`
          }
        },
      },
      sourcemap: false,
    },
  })

console.log(LOG_PREFIX, 'Bundling "core" package...\n')

const corePackageDir = join('core', 'src', 'index.ts')
await viteBuild(corePackageDir, 'index')

console.log(LOG_PREFIX, 'Building types...\n')

await tscOut('core/dist/types.d.ts', {
  include: ['core/src/index.ts'],
  fixDtsOptions: {
    replace: [
      ['declare module "index"', 'declare module "@editrix/core"'],
    ],
  },
})
