module.exports = {
  extends: ['../../.eslintrc.base.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  root: true,
  env: {
    jest: true,
  },
};
