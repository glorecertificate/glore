import eslintConfig from '@repo/eslint-config'

const TAILWIND_ENTRY = './src/styles.css'

const restrictedImports = [
  {
    group: ['@radix-ui'],
    ignoreFiles: ['src/blocks/**', 'src/components/**'],
    message: 'Import from @/components or create a new one instead.',
  },
  {
    group: ['@udecode/cn'],
    importNamePattern: '^cn$',
    message: 'Import from @/lib/utils instead.',
  },
  {
    group: ['react-hook-form'],
    ignoreFiles: ['src/components/form.tsx'],
    importNamePattern: '^Form([A-Z].*)?$',
    message: 'Import from @/components/form instead.',
  },
]

export default eslintConfig(
  {
    react: true,
    maxLines: -1,
    namedImports: ['react'],
    restrictedImports,
    sortObjectKeys: false,
    tailwind: {
      allowedClasses: [
        'font-heading',
        'ignore-click-outside/*',
        'lucide',
        'lucide-*',
        'markdown',
        'slate-*',
        'toaster',
      ],
      entryPoint: TAILWIND_ENTRY,
    },
  },
  {
    files: ['src/types.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': [
        'error',
        {
          allowObjectTypes: 'always',
        },
      ],
    },
  },
  {
    files: ['src/blocks/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            ...restrictedImports.map(({ ignoreFiles, ...rest }) => rest),
            {
              group: ['@repo/ui/blocks/**'],
              message: 'Use relative imports instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/blocks/rich-text-editor/**'],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
  {
    files: ['src/components/*/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            ...restrictedImports.map(({ ignoreFiles, ...rest }) => rest),
            {
              group: ['@repo/ui/components/*/**'],
              message: 'Use relative imports instead.',
            },
          ],
        },
      ],
    },
  },
)
