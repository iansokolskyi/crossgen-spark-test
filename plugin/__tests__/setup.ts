// Test setup file
// Runs before each test suite

// Mock global window objects
global.window = global.window || ({} as any);
global.document = global.document || ({} as any);

// Suppress console logs during tests (optional)
// Uncomment to silence console output
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
