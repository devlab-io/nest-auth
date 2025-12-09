module.exports = {
  extends: ['../../.eslintrc.base.js'],
  parserOptions: {
    project: './tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
  },
  root: true,
  env: {
    jest: true,
  },
};
