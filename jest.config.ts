export default {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^(\\..*)\\.js$": "$1"
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {}]
  },
  testMatch: [
    "<rootDir>/src/tests/**/*.test.ts",
    "<rootDir>/src/tests/**/*.spec.ts"
  ],
  testTimeout: 30000
};
