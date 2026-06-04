export default {
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/testSetup.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.test.tsx'],
  coverageThreshold: {
    './src/markdown-sync/**/*.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
      },
    ],
    '^.+\\.m?js$': [
      'babel-jest',
      {
        plugins: ['@babel/plugin-transform-modules-commonjs'],
      },
    ],
  },
  transformIgnorePatterns: ['/node_modules/(?!markdown-it-github-alerts/)'],
};
