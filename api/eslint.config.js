import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/modules/**/*.ts'],
    rules: {
      // Module boundary: a module may import another module only through its public index.ts.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^\\.\\./(?!\\.\\.)[^/]+/(?!index\\.js$).+',
              message: 'Import other modules only via their public index.js (e.g. ../catalogue/index.js).',
            },
          ],
        },
      ],
    },
  },
);
