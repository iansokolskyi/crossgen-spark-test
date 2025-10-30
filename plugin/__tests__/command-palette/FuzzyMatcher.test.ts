import { FuzzyMatcher } from '../../src/command-palette/FuzzyMatcher';
import { PaletteItem } from '../../src/types/command-palette';

describe('FuzzyMatcher', () => {
	let matcher: FuzzyMatcher;

	beforeEach(() => {
		matcher = new FuzzyMatcher();
	});

	describe('match', () => {
		const createItem = (id: string, name: string, description?: string): PaletteItem => ({
			id,
			name,
			description,
			type: 'command' as const,
		});

		it('should match exact strings', () => {
			const items = [createItem('/test', 'test', 'Test command')];
			const results = matcher.match('test', items);

			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('test');
		});

		it('should match case-insensitively', () => {
			const items = [createItem('/test', 'test', 'Test command')];
			const results = matcher.match('TEST', items);

			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('test');
		});

		it('should match substring', () => {
			const items = [createItem('/testing', 'testing', 'Testing command')];
			const results = matcher.match('test', items);

			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('testing');
		});

		it('should match with gaps (fuzzy)', () => {
			const items = [createItem('/test', 'test', 'Test command')];
			const results = matcher.match('tst', items);

			expect(results).toHaveLength(1);
		});

		it('should return empty array for non-matching strings', () => {
			const items = [createItem('/test', 'test', 'Test command')];
			const results = matcher.match('xyz', items);

			expect(results).toHaveLength(0);
		});

		it('should prefer exact matches over prefix matches', () => {
			const items = [
				createItem('/test', 'test', 'Test command'),
				createItem('/testing', 'testing', 'Testing command'),
			];
			const results = matcher.match('test', items);

			// Exact match should come first
			expect(results[0].name).toBe('test');
		});

		it('should return all items for empty query', () => {
			const items = [
				createItem('/test1', 'test1'),
				createItem('/test2', 'test2'),
			];
			const results = matcher.match('', items);

			expect(results).toHaveLength(2);
		});

		it('should match against description', () => {
			const items = [createItem('/cmd', 'command', 'Generate a report')];
			const results = matcher.match('report', items);

			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('command');
		});

		it('should filter out low-score matches', () => {
			const items = [
				createItem('/summarize', 'summarize', 'Create summary'),
				createItem('/analyze', 'analyze', 'Analyze content'),
			];
			const results = matcher.match('sum', items);

			// Should only return 'summarize', not 'analyze'
			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('summarize');
		});

		it('should sort by match type priority', () => {
			const items = [
				createItem('/test-exact', 'test', 'Description with test'),
				createItem('/testing', 'testing', 'Another command'),
				createItem('/my-test', 'my-test', 'My test'),
			];
			const results = matcher.match('test', items);

			// Order: exact > prefix > contains
			expect(results[0].name).toBe('test'); // Exact
			expect(results[1].name).toBe('testing'); // Prefix
			expect(results[2].name).toBe('my-test'); // Contains
		});
	});
});
