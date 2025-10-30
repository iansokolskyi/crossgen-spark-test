// Mock CodeMirror for testing

export const EditorView = {
	theme: jest.fn(),
	decorations: jest.fn(),
};

export const EditorState = {
	create: jest.fn(),
};

export const StateField = {
	define: jest.fn(),
};

export const Decoration = {
	mark: jest.fn(),
	widget: jest.fn(),
};

export const ViewPlugin = {
	define: jest.fn(),
};
