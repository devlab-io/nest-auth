module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/*.test.ts'],
  coverageDirectory: '../coverage',
  moduleNameMapper: {
    '^@devlab-io/nest-auth-types$': '<rootDir>/../src',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: false,
        },
      },
    ],
  },
  modulePathIgnorePatterns: ['<rootDir>/../dist'],
};
