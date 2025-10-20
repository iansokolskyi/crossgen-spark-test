/**
 * Command Executor
 * Orchestrates command execution: context loading, prompt building, AI calls, result writing
 */

import type { ParsedCommand } from '../types/parser.js';
import type { SparkConfig } from '../types/config.js';
import type { ClaudeClient } from '../ai/ClaudeClient.js';
import type { PromptBuilder } from '../ai/PromptBuilder.js';
import type { ContextLoader } from '../context/ContextLoader.js';
import type { ResultWriter } from '../results/ResultWriter.js';
import { Logger } from '../logger/Logger.js';
import { ErrorWriter } from '../results/ErrorWriter.js';

export class CommandExecutor {
  private logger: Logger;
  private errorWriter: ErrorWriter;

  constructor(
    private claudeClient: ClaudeClient,
    private promptBuilder: PromptBuilder,
    private contextLoader: ContextLoader,
    private resultWriter: ResultWriter,
    private config: SparkConfig,
    vaultPath: string
  ) {
    this.logger = Logger.getInstance();
    this.errorWriter = new ErrorWriter(vaultPath);
  }

  /**
   * Execute a command using AI
   */
  async execute(command: ParsedCommand, filePath: string): Promise<void> {
    this.logger.info('Executing command', {
      command: command.raw.substring(0, 100),
      file: filePath,
    });

    let context = null;

    try {
      // Update status to processing
      await this.resultWriter.updateStatus({
        filePath,
        commandLine: command.line,
        commandText: command.raw,
        status: '⏳',
      });

      // Load context including mentioned files and nearby files ranked by proximity
      context = await this.contextLoader.load(filePath, command.mentions || []);

      this.logger.debug('Context loaded', {
        mentionedFiles: context.mentionedFiles.length,
        nearbyFiles: context.nearbyFiles.length, // Ranked by proximity!
        hasAgent: !!context.agent,
      });

      // Build structured prompt with agent persona, instructions, and context
      const prompt = this.promptBuilder.build(command, context);

      this.logger.debug('Prompt built', {
        length: prompt.length,
        estimatedTokens: this.promptBuilder.estimateTokens(prompt),
      });

      this.logger.debug('Full prompt to AI', { prompt });

      // Call AI provider
      const result = await this.claudeClient.complete(prompt);

      this.logger.info('Command executed', {
        outputTokens: result.usage.outputTokens,
        inputTokens: result.usage.inputTokens,
      });

      this.logger.debug('AI response', { response: result.content });

      // Write result back to file
      await this.resultWriter.writeInline({
        filePath,
        commandLine: command.line,
        commandText: command.raw,
        result: result.content,
        addBlankLines: this.config.daemon.results.add_blank_lines,
      });

      this.logger.info('Result written to file', { filePath });
    } catch (error) {
      this.logger.error('Command execution failed', error);

      // Write error status
      await this.resultWriter.updateStatus({
        filePath,
        commandLine: command.line,
        commandText: command.raw,
        status: '❌',
      });

      // Write detailed error log and notification
      await this.errorWriter.writeError({
        error,
        filePath,
        commandLine: command.line,
        commandText: command.raw,
        context: {
          hasAgent: context?.agent ? true : false,
          mentionedFilesCount: context?.mentionedFiles?.length || 0,
          nearbyFilesCount: context?.nearbyFiles?.length || 0,
        },
      });

      throw error;
    }
  }

  /**
   * Check if a command should be executed (not incomplete)
   */
  shouldExecute(command: ParsedCommand): boolean {
    if (!command.isComplete) {
      this.logger.debug('Skipping incomplete command', {
        command: command.raw.substring(0, 50),
        reason: 'missing sentence-ending punctuation',
      });
      return false;
    }
    return true;
  }
}
