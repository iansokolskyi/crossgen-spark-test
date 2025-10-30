# Plugin Tests

This directory contains Jest tests for the Spark Obsidian plugin.

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Full check (lint + format + type-check + tests)
npm run check
```

## Test Structure

```
__tests__/
├── README.md                    # This file
├── setup.ts                     # Test setup (runs before each suite)
├── command-palette/             # Command palette tests
│   └── FuzzyMatcher.test.ts    # Fuzzy matching logic
├── chat/                        # Chat functionality tests (TODO)
└── ...                          # Other test directories
```

## Writing Tests

### Example Test

```typescript
import { FuzzyMatcher } from '../../src/command-palette/FuzzyMatcher';
import { PaletteItem } from '../../src/types/command-palette';

describe('FuzzyMatcher', () => {
	let matcher: FuzzyMatcher;

	beforeEach(() => {
		matcher = new FuzzyMatcher();
	});

	it('should match exact strings', () => {
		const items: PaletteItem[] = [
			{ id: '/test', name: 'test', description: 'Test command', type: 'command' }
		];
		const results = matcher.match('test', items);

		expect(results).toHaveLength(1);
		expect(results[0].name).toBe('test');
	});
});
```

### Testing Guidelines

1. **Unit Tests for Logic**
   - Test pure functions and business logic
   - Focus on: `FuzzyMatcher`, `CoordinateDetector`, `TriggerDetector`, `ChatQueue`
   - Mock Obsidian APIs (already configured)

2. **Integration Tests via MCP**
   - Use Playwright MCP for UI validation
   - Test actual plugin behavior in Obsidian
   - See `specs/DEVELOPER_EXPERIENCE.md` for MCP setup

3. **What to Test**
   - ✅ Business logic (fuzzy matching, parsing, state management)
   - ✅ Data transformations
   - ✅ Edge cases and error handling
   - ❌ Obsidian API calls (hard to test, use MCP instead)
   - ❌ UI components (use MCP for visual validation)

## Mocks

### Obsidian API Mock

Located in `__mocks__/obsidian.ts`, provides stubs for:
- `Plugin`, `Modal`, `Notice`
- `ItemView`, `MarkdownView`
- `TFile`, `TFolder`
- `Workspace`, `Vault`, `MetadataCache`

### CodeMirror Mock

Located in `__mocks__/codemirror.ts`, provides stubs for:
- `EditorView`, `EditorState`
- `StateField`, `Decoration`
- `ViewPlugin`

## Coverage

Current coverage: ~4% (just getting started!)

**Coverage threshold:** 3% (will increase as tests are added)

**Target coverage:** 60%+ for business logic

Run `npm run test:coverage` to see detailed coverage report in `coverage/index.html`.

## Test Coverage Status

### ✅ Tested
- `FuzzyMatcher` - 89% coverage

### 🔜 To Test
- `CoordinateDetector` - Detects cursor position in editor
- `TriggerDetector` - Detects `/` and `@` triggers
- `ChatQueue` - Message queue management
- `ConversationStorage` - Conversation persistence
- `ItemLoader` - Loads commands, agents, files

### ⚠️ Hard to Test (Use MCP Instead)
- `PaletteView` - UI component (uses Obsidian Modal API)
- `ChatWindow` - UI component (uses Obsidian ItemView API)
- `CommandPaletteManager` - Integration (combines many components)

## CI/CD Integration

Tests run in `npm run check`, which is used in:
- Pre-commit hooks (if configured)
- CI/CD pipelines
- Manual validation

## Troubleshooting

### TypeScript Errors in Tests

Make sure `tsconfig.json` includes test files:
```json
{
  "include": [
    "src/**/*.ts",
    "__tests__/**/*.ts",
    "__mocks__/**/*.ts"
  ]
}
```

### Mock Not Working

Check `jest.config.mjs` has correct moduleNameMapper:
```javascript
moduleNameMapper: {
  '^obsidian$': '<rootDir>/__mocks__/obsidian.ts',
  '^@codemirror/(.*)$': '<rootDir>/__mocks__/codemirror.ts',
}
```

### Coverage Too Low

Lower threshold in `jest.config.mjs` temporarily:
```javascript
coverageThreshold: {
  global: {
    statements: 3,
    branches: 3,
    functions: 3,
    lines: 3,
  },
}
```

## Next Steps

1. Add tests for `TriggerDetector`
2. Add tests for `CoordinateDetector`
3. Add tests for `ChatQueue`
4. Add tests for `ConversationStorage`
5. Increase coverage threshold gradually
6. Set up pre-commit hooks to run tests

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Playwright MCP Setup](../specs/DEVELOPER_EXPERIENCE.md#plugin-validation-with-playwright-mcp)
