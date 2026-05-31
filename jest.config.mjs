export default {
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/testSetup.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.test.tsx'],
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
