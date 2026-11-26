import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Module boundary: a module may import another module only through its public index.js.
 * no-restricted-imports matches raw import strings, so the pattern depends on how deep the
 * importing file sits inside src/modules/<module>/.
 */
const boundary = (regex) => ({
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        { regex, message: 'Import other modules only via their public index.js (e.g. ../catalogue/index.js).' },
      ],
    },
  ],
});

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Files at the module root, e.g. modules/enquiry/enquiry.service.ts -> ../catalogue/ports.js
  { files: ['src/modules/*/*.ts'], rules: boundary('^\\.\\./[^./][^/]*/(?!index\\.js$)') },
  // Files one level down, e.g. modules/enquiry/adapters/x.ts -> ../../catalogue/ports.js
  { files: ['src/modules/*/*/*.ts'], rules: boundary('^\\.\\./\\.\\./[^./][^/]*/(?!index\\.js$)') },
);
