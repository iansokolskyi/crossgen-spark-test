/** @type {import('jest').Config} */
export default {
	testEnvironment: 'jsdom',
	extensionsToTreatAsEsm: ['.ts'],
	transform: {
		'^.+\\.ts$': [
			'ts-jest',
			{
				useESM: true,
				tsconfig: {
					isolatedModules: true,
					esModuleInterop: true,
				},
			},
		],
	},
	testMatch: ['**/__tests__/**/*.test.ts'],
	moduleNameMapper: {
		'^obsidian$': '<rootDir>/__mocks__/obsidian.ts',
		'^@codemirror/(.*)$': '<rootDir>/__mocks__/codemirror.ts',
	},
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/main.ts',
		'!src/settings.ts',
		'!src/types/**',
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
	coverageThreshold: {
		global: {
			branches: 3,
			functions: 3,
			lines: 3,
			statements: 3,
		},
	},
	testTimeout: 10000,
	setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
};
