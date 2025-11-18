/**
 * Floating input widget for inline chat
 */

import type { App } from 'obsidian';
import type { WidgetMode } from './types';

export interface InlineChatWidgetOptions {
	/** Agent name to display */
	agentName: string;
	/** Initial message (pre-populated in textarea) */
	initialMessage?: string;
	/** Callback when user clicks send */
	onSend: (message: string) => void;
	/** Callback when user clicks cancel or dismisses */
	onCancel: () => void;
	/** Top position in pixels */
	top: number;
	/** Left position in pixels */
	left: number;
	/** Parent element to attach widget to (for proper scrolling) */
	parentElement?: HTMLElement;
}

/**
 * Pool of friendly status messages for processing state
 */
const STATUS_MESSAGES = [
	'thinking',
	'analyzing your question',
	'gathering context',
	'formulating response',
	'consulting knowledge base',
	'processing request',
	'working on it',
	'almost there',
	'putting thoughts together',
	'brewing response',
] as const;

export class InlineChatWidget {
	private app: App;
	private containerEl: HTMLElement | null = null;
	private textareaEl: HTMLTextAreaElement | null = null;
	private sendButtonEl: HTMLButtonElement | null = null;
	private options: InlineChatWidgetOptions;
	private mode: WidgetMode = 'input';
	private statusMessageEl: HTMLElement | null = null;
	private statusIntervalId: number | null = null;
	private currentStatusIndex: number = 0;

	constructor(app: App, options: InlineChatWidgetOptions) {
		this.app = app;
		this.options = options;
	}

	/**
	 * Get a random status message from the pool
	 */
	private getRandomStatusMessage(): string {
		return STATUS_MESSAGES[Math.floor(Math.random() * STATUS_MESSAGES.length)];
	}

	/**
	 * Rotate through status messages to keep it engaging
	 */
	private startStatusRotation(): void {
		// Clear any existing rotation
		this.stopStatusRotation();

		// Pick initial random message
		this.currentStatusIndex = Math.floor(Math.random() * STATUS_MESSAGES.length);

		// Capitalize agent name for display
		const capitalizedAgentName =
			this.options.agentName.charAt(0).toUpperCase() + this.options.agentName.slice(1);

		// Update every 3 seconds
		this.statusIntervalId = window.setInterval(() => {
			this.currentStatusIndex = (this.currentStatusIndex + 1) % STATUS_MESSAGES.length;
			if (this.statusMessageEl) {
				this.statusMessageEl.setText(
					`${capitalizedAgentName} is ${STATUS_MESSAGES[this.currentStatusIndex]}`
				);
			}
		}, 3000);
	}

	/**
	 * Stop status message rotation
	 */
	private stopStatusRotation(): void {
		if (this.statusIntervalId !== null) {
			window.clearInterval(this.statusIntervalId);
			this.statusIntervalId = null;
		}
	}

	/**
	 * Show the widget
	 */
	show(): void {
		if (this.containerEl) {
			return; // Already showing
		}

		this.containerEl = this.createWidget();

		// Append to parent element (editor container) instead of document.body
		// This makes it scroll with the document
		const parent = this.options.parentElement || document.body;
		parent.appendChild(this.containerEl);

		// Set initial message if provided
		if (this.textareaEl && this.options.initialMessage) {
			this.textareaEl.value = this.options.initialMessage;
			// Move cursor to end
			this.textareaEl.selectionStart = this.textareaEl.value.length;
			this.textareaEl.selectionEnd = this.textareaEl.value.length;
		}

		// Focus textarea after a brief delay to ensure DOM is ready
		window.setTimeout(() => {
			this.textareaEl?.focus();
			this.autoResizeTextarea();
		}, 10);
	}

	/**
	 * Hide the widget
	 */
	hide(): void {
		this.stopStatusRotation();
		if (this.containerEl) {
			this.containerEl.remove();
			this.containerEl = null;
			this.textareaEl = null;
			this.sendButtonEl = null;
			this.statusMessageEl = null;
		}
	}

	/**
	 * Transform widget to processing state
	 * Shows user message and simple loading indicator
	 */
	transformToProcessing(userMessage: string): void {
		if (!this.containerEl) {
			return;
		}

		this.mode = 'processing';

		// Clear current content
		this.containerEl.empty();

		// Recreate with processing UI
		const mainContent = this.containerEl.createDiv('spark-inline-chat-content processing');

		// Show user message (simple, no label)
		const userMessageEl = mainContent.createDiv('spark-inline-chat-user-message');
		userMessageEl.setText(userMessage);

		// Show simple status (matching main chat loading state)
		const statusRow = mainContent.createDiv('spark-inline-chat-status');

		// Capitalize agent name
		const capitalizedAgentName =
			this.options.agentName.charAt(0).toUpperCase() + this.options.agentName.slice(1);

		this.statusMessageEl = statusRow.createEl('span', { cls: 'spark-inline-chat-status-message' });
		this.statusMessageEl.setText(`${capitalizedAgentName} is typing`);

		// Add jumping dots (matching main chat animation)
		statusRow.createEl('span', { cls: 'spark-jumping-dots' });

		// Start rotating status messages
		this.startStatusRotation();
	}

	/**
	 * Check if widget is visible
	 */
	isVisible(): boolean {
		return this.containerEl !== null;
	}

	/**
	 * Get the current height of the widget in pixels
	 */
	getHeight(): number {
		if (!this.containerEl) {
			return 0;
		}
		return this.containerEl.offsetHeight;
	}

	/**
	 * Create the widget DOM structure (Cursor-style)
	 */
	private createWidget(): HTMLElement {
		const container = document.createElement('div');
		container.addClass('spark-inline-chat-widget');
		container.style.position = 'absolute';
		container.style.top = `${this.options.top}px`;
		container.style.left = `${this.options.left}px`;

		// Main content area with textarea and buttons in one container
		const mainContent = container.createDiv('spark-inline-chat-content');

		// Close button at top right
		const closeButton = mainContent.createEl('button', {
			cls: 'spark-inline-chat-close-btn',
			attr: {
				'aria-label': 'Close',
			},
		});
		closeButton.innerHTML = '×';
		closeButton.addEventListener('click', (e: MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			console.log('[InlineChatWidget] Close button clicked');
			this.options.onCancel();
		});

		// Textarea with agent mention pre-populated
		this.textareaEl = document.createElement('textarea');
		this.textareaEl.addClass('spark-inline-chat-textarea');
		this.textareaEl.setAttribute('placeholder', `Ask @${this.options.agentName}...`);
		this.textareaEl.setAttribute('rows', '1');

		// Handle Enter key (Enter to send, Shift+Enter for newline)
		this.textareaEl.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				e.stopPropagation();
				console.log('[InlineChatWidget] Enter pressed, sending...');
				this.handleSend();
			} else if (e.key === 'Escape') {
				e.preventDefault();
				e.stopPropagation();
				console.log('[InlineChatWidget] Escape pressed, cancelling...');
				this.options.onCancel();
			}
			// Shift+Enter is allowed through for newlines (default textarea behavior)
		});

		// Auto-resize textarea as user types
		this.textareaEl.addEventListener('input', () => {
			this.autoResizeTextarea();
			this.updateSendButtonState();
		});

		// Input wrapper with textarea only
		const inputWrapper = mainContent.createDiv('spark-inline-chat-input-wrapper');
		inputWrapper.appendChild(this.textareaEl);

		// Helper text below input
		const helperText = mainContent.createDiv('spark-inline-chat-helper');
		helperText.setText('↵ to send, ⇧↵ for newline, Esc to cancel');

		// Send button at bottom right corner of widget
		this.sendButtonEl = mainContent.createEl('button', {
			cls: 'spark-inline-chat-send-btn',
			attr: {
				'aria-label': 'Send message',
			},
		});
		this.sendButtonEl.innerHTML = '↑';
		this.sendButtonEl.addEventListener('click', (e: MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			console.log('[InlineChatWidget] Send button clicked');
			this.handleSend();
		});

		// Set initial button state
		this.updateSendButtonState();

		// Click outside to close
		window.setTimeout(() => {
			const handleClickOutside = (e: MouseEvent) => {
				if (this.containerEl && !this.containerEl.contains(e.target as Node)) {
					console.log('[InlineChatWidget] Clicked outside, cancelling...');
					this.options.onCancel();
					document.removeEventListener('mousedown', handleClickOutside);
				}
			};
			document.addEventListener('mousedown', handleClickOutside);
		}, 100);

		return container;
	}

	/**
	 * Handle send action
	 */
	private handleSend(): void {
		console.log('[InlineChatWidget] handleSend called');
		if (!this.textareaEl) {
			console.log('[InlineChatWidget] No textarea element');
			return;
		}

		const message = this.textareaEl.value.trim();
		console.log('[InlineChatWidget] Message:', message);

		if (message.length === 0) {
			console.log('[InlineChatWidget] Empty message, not sending');
			return; // Don't send empty messages
		}

		console.log('[InlineChatWidget] Calling onSend callback');
		this.options.onSend(message);
	}

	/**
	 * Auto-resize textarea based on content
	 */
	private autoResizeTextarea(): void {
		if (!this.textareaEl) return;

		// Reset height to recalculate
		this.textareaEl.style.height = 'auto';

		// Set to scroll height (content height)
		const newHeight = Math.min(this.textareaEl.scrollHeight, 200); // Max 200px
		this.textareaEl.style.height = `${newHeight}px`;
	}

	/**
	 * Update send button disabled state based on input
	 */
	private updateSendButtonState(): void {
		if (!this.sendButtonEl || !this.textareaEl) {
			return;
		}

		const isEmpty = this.textareaEl.value.trim().length === 0;
		this.sendButtonEl.disabled = isEmpty;
	}

	/**
	 * Update widget position (useful if editor scrolls)
	 */
	updatePosition(top: number, left: number): void {
		if (this.containerEl) {
			this.containerEl.style.top = `${top}px`;
			this.containerEl.style.left = `${left}px`;
		}
	}
}
