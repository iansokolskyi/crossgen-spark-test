// Mock Obsidian API for testing
// This provides minimal stubs for Obsidian types used in the plugin

export class Plugin {
	app: any;
	manifest: any;
	constructor(app: any, manifest: any) {
		this.app = app;
		this.manifest = manifest;
	}
	async loadData(): Promise<any> {
		return {};
	}
	async saveData(_data: any): Promise<void> {}
	addCommand(_command: any): void {}
	addRibbonIcon(_icon: string, _title: string, _callback: () => void): void {}
	registerDomEvent(_el: HTMLElement, _type: string, _callback: () => void): void {}
	registerInterval(_intervalID: number): void {}
}

export class Modal {
	app: any;
	containerEl: HTMLElement;
	constructor(app: any) {
		this.app = app;
		this.containerEl = document.createElement('div');
	}
	open(): void {}
	close(): void {}
	onOpen(): void {}
	onClose(): void {}
}

export class Notice {
	constructor(_message: string, _timeout?: number) {}
}

export class ItemView {
	app: any;
	containerEl: HTMLElement;
	constructor(_leaf: any) {
		this.app = null;
		this.containerEl = document.createElement('div');
	}
	getViewType(): string {
		return 'view';
	}
	getDisplayText(): string {
		return 'View';
	}
	async onOpen(): Promise<void> {}
	async onClose(): Promise<void> {}
}

export class MarkdownView {
	app: any;
	file: any;
	editor: any;
	constructor() {
		this.app = null;
		this.file = null;
		this.editor = null;
	}
}

export class TFile {
	path: string;
	name: string;
	basename: string;
	extension: string;
	constructor(path: string) {
		this.path = path;
		this.name = path.split('/').pop() || '';
		this.extension = this.name.split('.').pop() || '';
		this.basename = this.name.replace(`.${this.extension}`, '');
	}
}

export class TFolder {
	path: string;
	name: string;
	constructor(path: string) {
		this.path = path;
		this.name = path.split('/').pop() || '';
	}
}

export const Platform = {
	isMobile: false,
	isDesktop: true,
	isMacOS: true,
	isWin: false,
	isLinux: false,
};

export const Workspace = {
	getActiveFile: jest.fn(),
	getActiveViewOfType: jest.fn(),
	on: jest.fn(),
	off: jest.fn(),
};

export const Vault = {
	read: jest.fn(),
	modify: jest.fn(),
	create: jest.fn(),
	delete: jest.fn(),
	getFiles: jest.fn(() => []),
	getAbstractFileByPath: jest.fn(),
};

export const MetadataCache = {
	getFileCache: jest.fn(),
	on: jest.fn(),
	off: jest.fn(),
};
