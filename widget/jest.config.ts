import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'CommonJS' } }],
  },
};

export default config;
