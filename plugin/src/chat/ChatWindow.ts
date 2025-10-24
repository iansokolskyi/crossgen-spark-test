import { App, Component } from 'obsidian';
import { ChatMessage, ChatState } from './types';
import SparkPlugin from '../main';
import { ConversationStorage } from './ConversationStorage';
import { ChatMentionHandler } from './ChatMentionHandler';
import { ChatSelector } from './ChatSelector';

export class ChatWindow extends Component {
	private app: App;
	private plugin: SparkPlugin;
	private containerEl: HTMLElement;
	private messagesEl: HTMLElement;
	private inputEl: HTMLTextAreaElement;
	private titleEl: HTMLElement;
	private conversationStorage: ConversationStorage;
	private mentionHandler: ChatMentionHandler;
	private chatSelector: ChatSelector;
	private state: ChatState = {
		isVisible: false,
		conversationId: null,
		messages: [],
		isProcessing: false,
		mentionedAgents: new Set(),
	};

	constructor(app: App, plugin: SparkPlugin) {
		super();
		this.app = app;
		this.plugin = plugin;
		this.conversationStorage = new ConversationStorage(app);
		this.mentionHandler = new ChatMentionHandler(app);
		this.chatSelector = new ChatSelector(
			app,
			this.conversationStorage,
			() => this.createNewChat(),
			(conversationId: string) => this.switchToConversation(conversationId)
		);
	}

	async onload() {
		await this.mentionHandler.initialize();
		this.createChatWindow();
		this.setupEventListeners();
	}

	private createChatWindow() {
		// Create main container
		this.containerEl = document.createElement('div');
		this.containerEl.className = 'spark-chat-window';

		// Create header
		const headerEl = document.createElement('div');
		headerEl.className = 'spark-chat-header';

		// Create left side with title and dropdown
		const headerLeftEl = document.createElement('div');
		headerLeftEl.className = 'spark-chat-header-left';

		this.titleEl = document.createElement('div');
		this.titleEl.textContent = 'Spark Chat';
		this.titleEl.style.fontWeight = '600';
		this.titleEl.className = 'spark-chat-title';

		// Add dropdown button next to title
		this.chatSelector.createTitleSide(headerLeftEl);
		headerLeftEl.appendChild(this.titleEl);

		// Create right side with controls
		const headerRightEl = document.createElement('div');
		headerRightEl.className = 'spark-chat-header-right';

		// Add new chat button
		this.chatSelector.createRightSide(headerRightEl);

		const closeBtn = document.createElement('button');
		closeBtn.innerHTML = '×';
		closeBtn.className = 'spark-chat-close-btn';
		closeBtn.onclick = () => this.hide();

		headerRightEl.appendChild(closeBtn);

		headerEl.appendChild(headerLeftEl);
		headerEl.appendChild(headerRightEl);

		// Create messages container
		this.messagesEl = document.createElement('div');
		this.messagesEl.className = 'spark-chat-messages';

		// Create input container
		const inputContainerEl = document.createElement('div');
		inputContainerEl.className = 'spark-chat-input-container';

		this.inputEl = document.createElement('textarea');
		this.inputEl.className = 'spark-chat-input';
		this.inputEl.placeholder = 'Type your message... (use @ to mention agents/files)';

		inputContainerEl.appendChild(this.inputEl);

		// Assemble window
		this.containerEl.appendChild(headerEl);
		this.containerEl.appendChild(this.messagesEl);
		this.containerEl.appendChild(inputContainerEl);

		// Add to document
		document.body.appendChild(this.containerEl);
		this.register(() => {
			document.body.removeChild(this.containerEl);
		});
	}

	private setupEventListeners() {
		// Attach mention handler to input
		this.mentionHandler.attachToInput(this.inputEl);

		// Handle input changes
		this.inputEl.addEventListener('input', e => {
			const target = e.target as HTMLTextAreaElement;
			target.style.height = 'auto';
			target.style.height = Math.min(target.scrollHeight, 120) + 'px';
		});

		// Handle keyboard shortcuts
		this.inputEl.addEventListener('keydown', e => {
			if (e.key === 'Enter' && !e.shiftKey) {
				// Enter sends message, Shift+Enter adds new line
				e.preventDefault();
				this.sendMessage();
			}
		});

		// Make window draggable
		this.makeDraggable();
	}

	private makeDraggable() {
		const headerEl = this.containerEl.querySelector('.spark-chat-header') as HTMLElement;
		let isDragging = false;
		let startX = 0;
		let startY = 0;
		let initialLeft = 0;
		let initialTop = 0;

		headerEl.addEventListener('mousedown', e => {
			if (e.target === headerEl || headerEl.contains(e.target as Node)) {
				isDragging = true;
				startX = e.clientX;
				startY = e.clientY;
				initialLeft = this.containerEl.offsetLeft;
				initialTop = this.containerEl.offsetTop;
				headerEl.style.cursor = 'grabbing';
			}
		});

		document.addEventListener('mousemove', e => {
			if (isDragging) {
				const deltaX = e.clientX - startX;
				const deltaY = e.clientY - startY;
				const newLeft = initialLeft + deltaX;
				const newTop = initialTop + deltaY;

				this.containerEl.style.left = newLeft + 'px';
				this.containerEl.style.top = newTop + 'px';
				this.containerEl.style.right = 'auto';
				this.containerEl.style.bottom = 'auto';
			}
		});

		document.addEventListener('mouseup', () => {
			if (isDragging) {
				isDragging = false;
				headerEl.style.cursor = 'move';
			}
		});
	}

	show() {
		this.containerEl.style.display = 'flex';
		this.state.isVisible = true;
		this.inputEl.focus();
		// Initialize conversation if needed
		void this.initializeConversation();
		// Preload conversations for instant dropdown response
		void this.chatSelector.loadConversations();
	}

	hide() {
		this.containerEl.style.display = 'none';
		this.state.isVisible = false;
	}

	toggle() {
		if (this.state.isVisible) {
			this.hide();
		} else {
			this.show();
		}
	}

	private async initializeConversation() {
		// Try to find most recent conversation
		const recentConversation = await this.findMostRecentConversation();
		if (recentConversation) {
			console.log('Spark Chat: Found recent conversation:', recentConversation);
			this.state.conversationId = recentConversation;
		} else {
			console.log('Spark Chat: No recent conversation found, creating new one');
			this.state.conversationId = this.generateConversationId();
		}

		// Load the conversation (whether it's existing or new)
		await this.loadConversation();
	}

	private generateConversationId(): string {
		return `chat-${Date.now()}`;
	}

	private async findMostRecentConversation(): Promise<string | null> {
		try {
			// Use ConversationStorage to find most recent conversation
			const recentConversation = await this.conversationStorage.getMostRecentConversation();
			console.log('Spark Chat: Most recent conversation from storage:', recentConversation);
			return recentConversation;
		} catch (error) {
			console.error('Spark Chat: Error finding recent conversation:', error);
			return null;
		}
	}

	private async loadConversation() {
		if (!this.state.conversationId) {
			console.log('Spark Chat: No conversation ID to load');
			return;
		}

		console.log('Spark Chat: Loading conversation:', this.state.conversationId);

		// Clear current messages
		this.messagesEl.innerHTML = '';
		this.state.messages = [];
		this.state.mentionedAgents.clear();

		// Try to load existing conversation using ConversationStorage
		try {
			const conversation = await this.conversationStorage.loadConversation(
				this.state.conversationId
			);
			if (conversation) {
				console.log('Spark Chat: Successfully loaded conversation data');
				this.state.messages = conversation.messages || [];
				this.state.mentionedAgents = new Set(conversation.mentionedAgents || []);
				this.renderAllMessages();
				this.updateChatTitle(Array.from(this.state.mentionedAgents));
				console.log(
					'Spark Chat: Loaded',
					this.state.messages.length,
					'messages and',
					this.state.mentionedAgents.size,
					'agents'
				);
			} else {
				console.log('Spark Chat: No conversation data found for ID:', this.state.conversationId);
			}
		} catch (error) {
			console.error('Spark Chat: Failed to load conversation:', error);
		}
	}

	private async saveConversation() {
		if (!this.state.conversationId) return;

		// Check if conversation is empty (no real messages, only loading messages)
		const hasRealMessages = this.state.messages.some(msg => msg.type !== 'loading');

		if (!hasRealMessages) {
			// Delete the empty conversation
			try {
				await this.conversationStorage.deleteConversation(this.state.conversationId);
				console.log('Spark Chat: Deleted empty conversation:', this.state.conversationId);
			} catch (error) {
				console.error('Spark Chat: Failed to delete empty conversation:', error);
			}
			return;
		}

		const conversationData = {
			id: this.state.conversationId,
			created: new Date().toISOString(),
			updated: new Date().toISOString(),
			messages: this.state.messages,
			mentionedAgents: Array.from(this.state.mentionedAgents),
		};

		try {
			await this.conversationStorage.saveConversation(conversationData);
			console.log('Spark Chat: Successfully saved conversation:', this.state.conversationId);
		} catch (error) {
			console.error('Spark Chat: Failed to save conversation:', error);
		}
	}

	private renderAllMessages() {
		this.messagesEl.innerHTML = '';
		this.state.messages.forEach(message => this.renderMessage(message));
		this.scrollToBottom();
	}

	private sendMessage() {
		const content = this.inputEl.value.trim();
		if (!content) return;

		const message: ChatMessage = {
			id: this.generateId(),
			timestamp: new Date().toISOString(),
			type: 'user',
			content,
		};

		this.addMessage(message);
		this.inputEl.value = '';
		this.inputEl.style.height = 'auto';

		// Process message through command executor
		void this.processMessage(message);
	}

	addMessage(message: ChatMessage) {
		this.state.messages.push(message);
		this.renderMessage(message);
		this.scrollToBottom();
		// Save conversation after adding message
		void this.saveConversation();
	}

	private renderMessage(message: ChatMessage) {
		const messageEl = document.createElement('div');
		messageEl.className = `spark-chat-message spark-chat-${message.type}`;

		// Add agent name if present
		if (message.agent) {
			const agentEl = document.createElement('div');
			agentEl.className = 'spark-chat-agent-name';
			agentEl.textContent = message.agent;
			messageEl.appendChild(agentEl);
		}

		// Add message content
		const contentEl = document.createElement('div');
		contentEl.className = 'spark-chat-message-content';

		if (message.type === 'loading') {
			// Create jumping dots loader
			contentEl.innerHTML =
				'<span class="spark-chat-loading-dots">Thinking</span><span class="spark-jumping-dots"></span>';
		} else {
			contentEl.textContent = message.content;
		}

		messageEl.appendChild(contentEl);

		// Store message reference for removal
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(messageEl as any)._sparkMessage = message;

		this.messagesEl.appendChild(messageEl);
	}

	private scrollToBottom() {
		this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
	}

	private generateId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	}

	private removeMessage(messageId: string) {
		// Remove from state
		this.state.messages = this.state.messages.filter(msg => msg.id !== messageId);

		// Remove from DOM
		const messageElements = this.messagesEl.querySelectorAll('.spark-chat-message');
		messageElements.forEach(el => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const message = (el as any)._sparkMessage;
			if (message && message.id === messageId) {
				this.messagesEl.removeChild(el);
			}
		});
	}

	// Chat selector methods
	createNewChat(): void {
		console.log('Spark Chat: Creating new chat');
		// Save current conversation if it has messages
		if (this.state.messages.length > 0) {
			void this.saveConversation();
		}

		// Reset state for new conversation
		this.state.messages = [];
		this.state.mentionedAgents.clear();
		this.state.conversationId = this.generateConversationId();
		this.messagesEl.innerHTML = '';
		this.updateChatTitle();
		this.chatSelector.update(this.state.conversationId);

		// Save the new empty conversation
		void this.saveConversation();

		// Invalidate cache so next dropdown shows updated list
		this.chatSelector.invalidateCache();
	}

	async switchToConversation(conversationId: string): Promise<void> {
		console.log('Spark Chat: Switching to conversation:', conversationId);

		// Save current conversation if it has messages and is different
		if (this.state.messages.length > 0 && this.state.conversationId !== conversationId) {
			await this.saveConversation();
		}

		// Load the selected conversation
		this.state.conversationId = conversationId;
		await this.loadConversation();
		this.chatSelector.update(conversationId);

		// Invalidate cache so next dropdown shows updated list
		this.chatSelector.invalidateCache();
	}

	// Public methods for ChatManager access
	getMessages(): ChatMessage[] {
		return [...this.state.messages]; // Return copy
	}

	getConversationId(): string | null {
		return this.state.conversationId;
	}

	isProcessing(): boolean {
		return this.state.isProcessing;
	}

	clearConversation() {
		this.state.messages = [];
		this.state.mentionedAgents.clear();
		this.state.conversationId = this.generateConversationId();
		this.messagesEl.innerHTML = '';
		this.updateChatTitle();
		this.chatSelector.update(this.state.conversationId);
		// Save the cleared conversation state
		void this.saveConversation();
	}

	private updateChatTitle(agentNames?: string[]) {
		if (!agentNames || agentNames.length === 0) {
			this.titleEl.textContent = 'Spark Chat';
			return;
		}

		// Filter out "Spark Assistant" and get unique real agents
		const realAgents = [...new Set(agentNames.filter(name => name !== 'Spark Assistant'))];

		if (realAgents.length === 0) {
			// No real agents, show default title
			this.titleEl.textContent = 'Spark Chat';
		} else if (realAgents.length === 1) {
			this.titleEl.textContent = `Chat with ${realAgents[0]}`;
		} else if (realAgents.length === 2) {
			this.titleEl.textContent = `Chat with ${realAgents[0]} and ${realAgents[1]}`;
		} else if (realAgents.length === 3) {
			this.titleEl.textContent = `Chat with ${realAgents[0]}, ${realAgents[1]} and ${realAgents[2]}`;
		} else {
			this.titleEl.textContent = `Chat with ${realAgents[0]}, ${realAgents[1]} and ${realAgents.length - 2} others`;
		}
	}

	private async processMessage(message: ChatMessage) {
		// Extract all agent names from message if mentioned and update title
		const agentMatches = message.content.match(/@(\w+)/g) || [];
		const agentNames = agentMatches.map(match => match.substring(1)); // Remove @ symbol

		// Check if this is the first message with no agents in the conversation
		const hasAgentsInConversation = this.state.mentionedAgents.size > 0;
		const hasAgentsInMessage = agentNames.length > 0;

		// If no agents mentioned at all and no agents in conversation, show suggestion
		if (!hasAgentsInConversation && !hasAgentsInMessage) {
			// Show suggestion to mention an agent
			const suggestionMessage: ChatMessage = {
				id: this.generateId(),
				timestamp: new Date().toISOString(),
				type: 'agent',
				content:
					'💡 Tip: Mention an agent using @agent_name to get better responses. For example: @betty help me with this task.',
				agent: 'Spark Assistant',
			};
			this.addMessage(suggestionMessage);
			return; // Don't process the message further
		}

		// If no agents mentioned in this message but conversation has agents, use existing agents
		if (!hasAgentsInMessage && hasAgentsInConversation) {
			// Use existing agents from the conversation state
			agentNames.push(...Array.from(this.state.mentionedAgents));
		}

		// Track mentioned agents in state
		agentNames.forEach(agentName => {
			this.state.mentionedAgents.add(agentName);
		});

		// Update chat title (excluding Spark Assistant if real agents are mentioned)
		this.updateChatTitle(Array.from(this.state.mentionedAgents));

		// Show loading message
		const loadingMessage: ChatMessage = {
			id: this.generateId(),
			timestamp: new Date().toISOString(),
			type: 'loading',
			content: 'Thinking',
		};
		this.addMessage(loadingMessage);
		this.state.isProcessing = true;

		// TODO: Integrate with daemon to process message
		// Remove loading message from DOM and state
		this.removeMessage(loadingMessage.id);

		// Use the first mentioned agent for the response
		const responseAgent = agentNames.length > 0 ? agentNames[0] : 'Spark Assistant';

		const response: ChatMessage = {
			id: this.generateId(),
			timestamp: new Date().toISOString(),
			type: 'agent',
			content: `I received your message: "${message.content}"`,
			agent: responseAgent,
		};
		this.addMessage(response);
		this.state.isProcessing = false;
	}
}
