import { InlineChatDetector } from '../../src/inline-chat/InlineChatDetector';
import type { Editor } from 'obsidian';

// Mock Editor
const createMockEditor = (
    lines: string[],
    cursorLine: number,
    cursorCh: number
): Editor => {
    return {
        getCursor: () => ({ line: cursorLine, ch: cursorCh }),
        getLine: (line: number) => lines[line] || '',
        lineCount: () => lines.length,
    } as Editor;
};

describe('InlineChatDetector', () => {
    let detector: InlineChatDetector;

    beforeEach(() => {
        detector = new InlineChatDetector();
    });

    describe('detectAgentMention', () => {
        it('should detect agent mention at end of line', () => {
            const editor = createMockEditor(['@alice'], 0, 6);

            const mention = detector.detectAgentMention(editor);

            expect(mention).not.toBeNull();
            expect(mention?.agentName).toBe('alice');
            expect(mention?.line).toBe(0);
            expect(mention?.ch).toBe(0); // ch is where @agent starts, not cursor position
        });

        it('should detect agent mention with cursor after agent name', () => {
            const editor = createMockEditor(['@bob '], 0, 5);

            const mention = detector.detectAgentMention(editor);

            expect(mention).not.toBeNull();
            expect(mention?.agentName).toBe('bob');
        });

        it('should not detect if cursor is not at end of line', () => {
            const editor = createMockEditor(['@alice some text'], 0, 6);

            const mention = detector.detectAgentMention(editor);

            expect(mention).toBeNull();
        });

        it('should not detect if no @ prefix', () => {
            const editor = createMockEditor(['alice'], 0, 5);

            const mention = detector.detectAgentMention(editor);

            expect(mention).toBeNull();
        });

        it('should handle agent names with hyphens', () => {
            const editor = createMockEditor(['@agent-one'], 0, 10);

            const mention = detector.detectAgentMention(editor);

            expect(mention).not.toBeNull();
            expect(mention?.agentName).toBe('agent-one');
        });

        it('should handle agent names with underscores', () => {
            const editor = createMockEditor(['@agent_two'], 0, 10);

            const mention = detector.detectAgentMention(editor);

            expect(mention).not.toBeNull();
            expect(mention?.agentName).toBe('agent_two');
        });

        it('should handle agent names with numbers', () => {
            const editor = createMockEditor(['@agent123'], 0, 9);

            const mention = detector.detectAgentMention(editor);

            expect(mention).not.toBeNull();
            expect(mention?.agentName).toBe('agent123');
        });

        it('should not detect invalid agent names starting with number', () => {
            const editor = createMockEditor(['@123agent'], 0, 9);

            const mention = detector.detectAgentMention(editor);

            expect(mention).toBeNull();
        });

        it('should handle trailing whitespace', () => {
            const editor = createMockEditor(['@alice   '], 0, 9);

            const mention = detector.detectAgentMention(editor);

            expect(mention).not.toBeNull();
            expect(mention?.agentName).toBe('alice');
        });

        it('should not detect @ alone', () => {
            const editor = createMockEditor(['@'], 0, 1);

            const mention = detector.detectAgentMention(editor);

            expect(mention).toBeNull();
        });

        it('should handle multiline documents', () => {
            const editor = createMockEditor(['first line', '@betty', 'third line'], 1, 6);

            const mention = detector.detectAgentMention(editor);

            expect(mention).not.toBeNull();
            expect(mention?.agentName).toBe('betty');
            expect(mention?.line).toBe(1);
        });
    });

    describe('hasExistingMarker', () => {
        it('should detect existing marker BELOW the mention line', () => {
            const editor = createMockEditor(
                ['@alice', '<!-- spark-inline-chat:pending:uuid:agent:message -->', '<!-- /spark-inline-chat -->'],
                0,
                0
            );

            const hasMarker = detector.hasExistingMarker(editor, 0);

            expect(hasMarker).toBe(true);
        });

        it('should return false if no marker below mention line', () => {
            const editor = createMockEditor(['@alice', 'just some text', 'another line'], 0, 0);

            const hasMarker = detector.hasExistingMarker(editor, 0);

            expect(hasMarker).toBe(false);
        });

        it('should detect inline chat markers below mention', () => {
            const editor = createMockEditor(
                ['@bob', '<!-- spark-inline-chat:pending:uuid:agent:message -->', '<!-- /spark-inline-chat -->'],
                0,
                0
            );

            const hasMarker = detector.hasExistingMarker(editor, 0);

            expect(hasMarker).toBe(true);
        });

        it('should stop checking after non-empty, non-comment line', () => {
            const editor = createMockEditor(
                ['@alice', 'some regular text', '<!-- spark-inline-chat:pending:uuid:agent:message -->'],
                0,
                0
            );

            // Should stop at line with "some regular text" and not find the marker
            const hasMarker = detector.hasExistingMarker(editor, 0);

            expect(hasMarker).toBe(false);
        });

        it('should check up to 5 lines below', () => {
            const editor = createMockEditor(
                ['@alice', '', '', '', '', '<!-- spark-inline-chat:pending:uuid:agent:message -->', ''], // marker on line 5 (0-indexed)
                0,
                0
            );

            const hasMarker = detector.hasExistingMarker(editor, 0);

            expect(hasMarker).toBe(true);
        });

        it('should not check beyond 5 lines', () => {
            const editor = createMockEditor(
                ['@alice', '', '', '', '', '', '<!-- spark-inline-chat:pending:uuid:agent:message -->'], // marker on line 6 (0-indexed)
                0,
                0
            );

            const hasMarker = detector.hasExistingMarker(editor, 0);

            expect(hasMarker).toBe(false);
        });
    });

    describe('isValidAgent', () => {
        it('should return true for valid agent name format', () => {
            // Currently validates format, not actual agent existence
            expect(detector.isValidAgent('alice')).toBe(true);
            expect(detector.isValidAgent('bob')).toBe(true);
            expect(detector.isValidAgent('betty')).toBe(true);
            expect(detector.isValidAgent('any-valid-name')).toBe(true);
        });

        it('should return true for agent names with hyphens and underscores', () => {
            expect(detector.isValidAgent('agent-one')).toBe(true);
            expect(detector.isValidAgent('agent_two')).toBe(true);
            expect(detector.isValidAgent('agent123')).toBe(true);
        });

        it('should return false for invalid format starting with number', () => {
            expect(detector.isValidAgent('123agent')).toBe(false);
        });

        it('should return false for invalid characters', () => {
            expect(detector.isValidAgent('agent@name')).toBe(false);
            expect(detector.isValidAgent('agent name')).toBe(false);
            expect(detector.isValidAgent('agent.name')).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(detector.isValidAgent('')).toBe(false);
        });
    });
});

