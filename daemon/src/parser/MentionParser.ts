/**
 * Mention Parser
 * Parses Spark syntax: @agent, @file.md, @folder/, /command, $service
 */

import type { IMentionParser, ParsedMention, MentionType } from '../types/parser.js';

interface MentionPattern {
    type: MentionType;
    regex: RegExp;
    priority: number; // Higher priority patterns checked first
}

export class MentionParser implements IMentionParser {
    private patterns: MentionPattern[];

    constructor() {
        // Define patterns in priority order
        this.patterns = [
            // Command: /command-name (must be on own line or at start)
            {
                type: 'command',
                regex: /\/([a-z][a-z0-9-]*)/gi,
                priority: 5,
            },
            // Service: $service-name
            {
                type: 'service',
                regex: /\$([a-z][a-z0-9-]*)/gi,
                priority: 4,
            },
            // Folder: @path/to/folder/ (ends with /)
            {
                type: 'folder',
                regex: /@([\w-]+(?:\/[\w-]*)*\/)/g,
                priority: 3,
            },
            // File: @filename.md (ends with .md)
            {
                type: 'file',
                regex: /@([\w-]+\.md)/g,
                priority: 2,
            },
            // Agent: @agent-name (no extension, no trailing slash)
            {
                type: 'agent',
                regex: /@([a-z][a-z0-9-]*)(?![\/\w.])/gi,
                priority: 1,
            },
        ];
    }

    public parse(content: string): ParsedMention[] {
        const mentions: ParsedMention[] = [];
        const seenPositions = new Set<number>();

        // Process each pattern
        for (const pattern of this.patterns) {
            const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
            let match;

            while ((match = regex.exec(content)) !== null) {
                const position = match.index;

                // Skip if we already found a mention at this position
                if (seenPositions.has(position)) {
                    continue;
                }

                mentions.push({
                    type: pattern.type,
                    raw: match[0],
                    value: match[1] || '',
                    position,
                });

                seenPositions.add(position);
            }
        }

        // Sort by position
        mentions.sort((a, b) => a.position - b.position);

        return mentions;
    }

    public hasSparkSyntax(line: string): boolean {
        // Quick check for any Spark syntax
        return /[@\/\$][a-z0-9-]/i.test(line);
    }

    /**
     * Parse a single line and return mentions found
     */
    public parseLine(line: string): ParsedMention[] {
        return this.parse(line);
    }

    /**
     * Check if a line is a command line (starts with / or has @agent)
     */
    public isCommandLine(line: string): boolean {
        const trimmed = line.trim();

        // Starts with /command
        if (/^\/[a-z][a-z0-9-]*/i.test(trimmed)) {
            return true;
        }

        // Contains @agent mention
        if (/@[a-z][a-z0-9-]*(?![\/\w.])/i.test(trimmed)) {
            return true;
        }

        return false;
    }
}

