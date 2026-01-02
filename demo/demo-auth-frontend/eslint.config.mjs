import nextConfig from 'eslint-config-next/core-web-vitals';

export default [
  ...nextConfig,
  {
    ignores: ['node_modules/**', '.next/**', 'out/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
