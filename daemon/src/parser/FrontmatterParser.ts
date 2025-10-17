/**
 * Frontmatter Parser
 * Parses and tracks changes in YAML frontmatter
 */

import matter from 'gray-matter';
import type { IFrontmatterParser, FrontmatterChange } from '../types/parser.js';

export class FrontmatterParser implements IFrontmatterParser {
    private cache: Map<string, Record<string, unknown>>;

    constructor() {
        this.cache = new Map();
    }

    public detectChanges(filePath: string, content: string): FrontmatterChange[] {
        const frontmatter = this.extractFrontmatter(content);
        const oldFrontmatter = this.cache.get(filePath) || {};
        const changes: FrontmatterChange[] = [];

        // Check for changed or added fields
        for (const [field, newValue] of Object.entries(frontmatter)) {
            const oldValue = oldFrontmatter[field];
            if (!this.valuesEqual(oldValue, newValue)) {
                changes.push({
                    field,
                    oldValue,
                    newValue,
                });
            }
        }

        // Check for removed fields
        for (const field of Object.keys(oldFrontmatter)) {
            if (!(field in frontmatter)) {
                changes.push({
                    field,
                    oldValue: oldFrontmatter[field],
                    newValue: undefined,
                });
            }
        }

        // Update cache
        this.cache.set(filePath, frontmatter);

        return changes;
    }

    public extractFrontmatter(content: string): Record<string, unknown> {
        try {
            const result = matter(content);
            return result.data as Record<string, unknown>;
        } catch (error) {
            // Invalid frontmatter, return empty object
            return {};
        }
    }

    /**
     * Get the content without frontmatter
     */
    public getContent(content: string): string {
        try {
            const result = matter(content);
            return result.content;
        } catch (error) {
            return content;
        }
    }

    /**
     * Clear cached frontmatter for a file
     */
    public clearCache(filePath: string): void {
        this.cache.delete(filePath);
    }

    /**
     * Clear all cached frontmatter
     */
    public clearAllCache(): void {
        this.cache.clear();
    }

    private valuesEqual(a: unknown, b: unknown): boolean {
        // Simple equality check
        if (a === b) return true;

        // Both null/undefined
        if (a == null && b == null) return true;

        // Different types
        if (typeof a !== typeof b) return false;

        // Arrays
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            return a.every((val, idx) => this.valuesEqual(val, b[idx]));
        }

        // Objects
        if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
            const aKeys = Object.keys(a);
            const bKeys = Object.keys(b);
            if (aKeys.length !== bKeys.length) return false;
            return aKeys.every((key) =>
                this.valuesEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
            );
        }

        return false;
    }
}

