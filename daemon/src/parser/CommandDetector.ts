/**
 * Command Detector
 * Detects Spark commands in markdown files
 */

import type { ICommandDetector, ParsedCommand, ParsedMention } from '../types/parser.js';
import { MentionParser } from './MentionParser.js';

export class CommandDetector implements ICommandDetector {
    private mentionParser: MentionParser;

    constructor() {
        this.mentionParser = new MentionParser();
    }

    public detectInFile(_filePath: string, content: string): ParsedCommand[] {
        const lines = content.split('\n');
        const commands: ParsedCommand[] = [];

        lines.forEach((line, index) => {
            // Skip empty lines
            if (!line.trim()) {
                return;
            }

            // Check if line has Spark syntax
            if (!this.mentionParser.hasSparkSyntax(line)) {
                return;
            }

            // Parse mentions in this line
            const mentions = this.mentionParser.parseLine(line);

            if (mentions.length === 0) {
                return;
            }

            // Determine command type
            const commandMention = mentions.find((m) => m.type === 'command');
            const agentMention = mentions.find((m) => m.type === 'agent');

            // Must have either a command or an agent to be executable
            if (!commandMention && !agentMention) {
                return;
            }

            // Check if line is already processed (has status emoji)
            const trimmed = line.trim();
            const alreadyProcessed = /^[✅❌⏳⚠️]/.test(trimmed);

            if (alreadyProcessed) {
                // Extract the actual command by removing the emoji
                const cleanLine = trimmed.replace(/^[✅❌⏳⚠️]\s*/, '');
                const status = this.getStatusFromEmoji(trimmed[0] || '');

                commands.push(this.createCommand(index, cleanLine, mentions, status));
            } else {
                commands.push(this.createCommand(index, line, mentions, 'pending'));
            }
        });

        return commands;
    }

    private createCommand(
        lineNumber: number,
        raw: string,
        mentions: ParsedMention[],
        status: ParsedCommand['status']
    ): ParsedCommand {
        const commandMention = mentions.find((m) => m.type === 'command');

        if (commandMention) {
            // Slash command
            return {
                line: lineNumber,
                raw,
                type: 'slash',
                command: commandMention.value,
                args: this.extractArgs(raw, commandMention.raw),
                mentions,
                status,
            };
        } else {
            // Mention chain (contains agent and other mentions)
            return {
                line: lineNumber,
                raw,
                type: 'mention-chain',
                mentions,
                finalCommand: this.extractFinalCommand(mentions),
                status,
            };
        }
    }

    private extractArgs(line: string, commandText: string): string | undefined {
        const commandIndex = line.indexOf(commandText);
        if (commandIndex === -1) return undefined;

        const afterCommand = line.substring(commandIndex + commandText.length).trim();
        return afterCommand || undefined;
    }

    private extractFinalCommand(mentions: ParsedMention[]): string | undefined {
        // Last command mention in the chain is the final action
        const commandMentions = mentions.filter((m) => m.type === 'command');
        if (commandMentions.length > 0) {
            return commandMentions[commandMentions.length - 1]?.value;
        }
        return undefined;
    }

    private getStatusFromEmoji(emoji: string): ParsedCommand['status'] {
        switch (emoji) {
            case '✅':
                return 'completed';
            case '❌':
                return 'error';
            case '⏳':
                return 'processing';
            default:
                return 'pending';
        }
    }
}

