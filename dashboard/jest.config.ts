import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config = {
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@quotecraft/formula-engine$': '<rootDir>/../packages/formula-engine/src/index.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default createJestConfig(config);
