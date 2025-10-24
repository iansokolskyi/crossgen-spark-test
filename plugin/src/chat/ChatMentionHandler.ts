import { App } from 'obsidian';
import { MentionDecorator } from '../command-palette/MentionDecorator';
import { handleMentionClick } from '../command-palette/MentionDecorator';

/**
 * Manages mentions and commands in the chat input
 * Adapts the command palette's mention system for chat use
 */
export class ChatMentionHandler {
	private app: App;
	private mentionDecorator: MentionDecorator;
	private inputElement: HTMLTextAreaElement | null = null;

	constructor(app: App) {
		this.app = app;
		this.mentionDecorator = new MentionDecorator(app);
	}

	/**
	 * Initialize the mention handler
	 */
	async initialize(): Promise<void> {
		await this.mentionDecorator.initialize();
	}

	/**
	 * Attach to chat input element
	 */
	attachToInput(inputElement: HTMLTextAreaElement): void {
		this.inputElement = inputElement;
		this.setupInputEventListeners();
	}

	/**
	 * Setup event listeners for the input
	 */
	private setupInputEventListeners(): void {
		if (!this.inputElement) return;

		// Handle input changes for mention decoration
		this.inputElement.addEventListener('input', this.handleInput.bind(this));

		// Handle clicks on mentions
		this.inputElement.addEventListener('click', this.handleClick.bind(this));

		// Handle keyboard navigation
		this.inputElement.addEventListener('keydown', this.handleKeydown.bind(this));
	}

	/**
	 * Handle input changes and update mention decoration
	 */
	private handleInput(event: Event): void {
		const target = event.target as HTMLTextAreaElement;
		if (!target) return;

		// TODO: Add mention decoration for the input
		// This would involve parsing the input and adding styling
		console.log('ChatMentionHandler: Input changed:', target.value);
	}

	/**
	 * Handle clicks on mentions
	 */
	private handleClick(event: MouseEvent): void {
		// Use the existing mention click handler from command palette
		handleMentionClick(this.app, event);
	}

	/**
	 * Handle keyboard shortcuts
	 */
	private handleKeydown(event: KeyboardEvent): void {
		// Could add keyboard shortcuts for mention completion
		// For now, let the existing handlers take care of it
		console.log('ChatMentionHandler: Key pressed:', event.key);
	}

	/**
	 * Refresh mentions (call when agents/commands change)
	 */
	async refresh(): Promise<void> {
		await this.mentionDecorator.refresh();
	}

	/**
	 * Clean up event listeners
	 */
	destroy(): void {
		if (this.inputElement) {
			this.inputElement.removeEventListener('input', this.handleInput);
			this.inputElement.removeEventListener('click', this.handleClick);
			this.inputElement.removeEventListener('keydown', this.handleKeydown);
		}
	}
}
