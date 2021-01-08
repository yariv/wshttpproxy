import type { Config } from "@jest/types";

// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  // transform: { "^.+\\.(ts|tsx)$": "ts-jest" },
  testEnvironment: "node",
  // testRegex: "/tests/.*\\.(test|spec)?\\.(ts|tsx)$",
  // moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testTimeout: 50000,
  preset: "ts-jest",
};
export default config;
