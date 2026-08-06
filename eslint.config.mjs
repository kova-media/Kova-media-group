import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

/**
 * Layer boundaries from docs/FOLDER_STRUCTURE.md §10.
 * Dependencies point downward only; a violation is a blocking review comment,
 * and where it can be automated it is automated here.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'src/generated/**',
  ]),

  {
    rules: {
      // Rich text is a structured node tree (ADR-016). Raw HTML never renders.
      'react/no-danger': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Presentational primitives must not reach into features or the data layer.
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/server/*', '@/server', '@/features/*', '@/db/*'],
              message:
                'src/components is presentational. It must not import features or the data layer (FOLDER_STRUCTURE.md §10).',
            },
          ],
        },
      ],
    },
  },

  // Generic utilities sit at the bottom of the stack.
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/server/*', '@/features/*', '@/app/*', '@/db/*'],
              message:
                'src/lib is generic. Domain-aware helpers belong in src/server (FOLDER_STRUCTURE.md §10).',
            },
          ],
        },
      ],
    },
  },

  // The domain layer must not depend on anything above it.
  {
    files: ['src/server/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/app/*', '@/components/*'],
              message:
                'src/server is the bottom of the dependency graph (FOLDER_STRUCTURE.md §10).',
            },
          ],
        },
      ],
    },
  },

  // Prisma is reachable only from the domain and db layers.
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/db/*', '@/generated/*'],
              message:
                'Only src/server may query the database. Call the data access layer instead (ARCHITECTURE.md §3).',
            },
          ],
        },
      ],
    },
  },

  // The two public/admin feature trees stay independent.
  {
    files: [
      'src/features/marketing/**/*.{ts,tsx}',
      'src/features/sections/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/admin/*'],
              message: 'Public features must not import admin code.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/admin/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/marketing/*'],
              message: 'Admin features must not import public marketing code.',
            },
          ],
        },
      ],
    },
  },

  // Config and scripts run outside the app's layering.
  {
    files: ['*.{ts,mjs}', 'prisma/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
])

export default eslintConfig
