export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {},
  setupFilesAfterEnv: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
