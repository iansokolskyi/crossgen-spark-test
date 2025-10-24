# Chat Functionality Specification

**Status:** Planning Phase  
**Date:** October 24, 2025  
**Related Docs:** AGENT_SDK_NEXT_STEPS.md, PRD.md

---

## Executive Summary

This specification outlines the implementation of a cursor-like floating chat window functionality for Spark. The chat system will enable users to interact with AI agents through a persistent overlay in the bottom-right corner of the screen, with support for conversation history and file modification capabilities.

## Requirements Overview

Based on Linear task requirements:

1. **Floating chat window** triggered by Cmd+K hotkey
2. **Persistent conversation history** stored in .spark/conversations/
3. **Same mention system** as command palette (@agent, @file, @folder/)
4. **Agent file modification** capabilities for vault operations

## Architecture

### Components

1. **ChatWindowManager** - Plugin component for UI management
2. **ConversationManager** - Handles conversation persistence and loading
3. **ChatMessageHandler** - Processes messages through existing CommandExecutor
4. **ChatResultWriter** - Writes chat responses back to the chat UI

### Data Flow

```
User Input (Cmd+K) → ChatWindowManager → ConversationManager → 
MessageHandler → CommandExecutor → Agent SDK → 
ResultWriter → ChatWindowManager → UI Update
```

## Implementation Plan

### Phase 1: Planning
- Define data structures for conversations
- Design storage format for .spark/conversations/
- Outline UI components and interactions
- Plan integration with existing architecture

### Phase 2: Decision Making
- Finalize UI/UX design decisions
- Confirm storage and persistence strategy
- Determine message processing flow
- Resolve any architectural questions

### Phase 3: Implementation
- Implement conversation storage system
- Create chat UI components
- Integrate with existing daemon communication
- Add hotkey support and window management
- Implement agent interaction capabilities

## Key Features

### 1. Floating Chat Window

- Triggered by Cmd+K hotkey
- Overlay in bottom-right corner
- Resizable with minimum/maximum dimensions
- Closeable with ESC key or close button
- Stays on top of other Obsidian elements
- Dynamic title showing mentioned agents with truncation

### 2. Conversation History

- Each conversation stored in separate JSON file
- File format: .spark/conversations/{timestamp}-{id}.json
- Includes messages, timestamps, agent information
- Searchable conversation history
- Export/import conversation capabilities

### 3. Agent Interaction

- Same mention syntax as command palette
- Agents can access and modify vault files
- File modification notifications
- Real-time feedback on agent actions

### 4. Integration Points

- Leverages existing CommandExecutor for processing
- Uses current agent configuration system
- Integrates with proximity-based context loading
- Supports existing provider abstraction

## Configuration

```yaml
features:
  chat:
    enabled: true
    hotkey: "Cmd+K"
    position: "bottom-right"
    default_width: 400px
    default_height: 500px
    max_width: 800px
    max_height: 90vh
    persist_conversations: true
    conversation_limit: 100
```

## Storage Format

Conversations stored in .spark/conversations/:

```json
{
  "id": "conv-12345",
  "created": "2025-10-24T10:00:00Z",
  "updated": "2025-10-24T10:15:00Z",
  "messages": [
    {
      "id": "msg-1",
      "timestamp": "2025-10-24T10:00:00Z",
      "type": "user",
      "content": "@betty review @finance/Q4/"
    },
    {
      "id": "msg-2", 
      "timestamp": "2025-10-24T10:01:00Z",
      "type": "agent",
      "agent": "betty",
      "content": "I've reviewed Q4 finances...",
      "files_modified": ["reports/Q4-summary.md"]
    }
  ]
}
```

## Agent File Modification Capabilities

### File Operations Through Chat

Agents in chat can perform the following file operations:

1. **Read Files** - Access any vault file (except system directories)
2. **Create Files** - Generate new files in specified locations
3. **Edit Files** - Modify existing files based on user requirements
4. **Multi-file Operations** - Work with multiple files simultaneously

### File Modification Workflow

```
User Request → Agent Processing → File Operations → 
Result Notification → Chat Feedback
```

### Permissions and Safety

- Sandboxed to vault directory (no access to system dirs)
- Restricted from .spark/, .obsidian/, .git/, node_modules/, .trash/
- User can configure additional restrictions
- All file modifications logged and reported back to user

### Notification System

When agents modify files, the chat interface displays:

```
📝 Betty modified 2 files:
  • reports/Q4-analysis.md (new)
  • finance/summary.md (edited)

[View Changes] [Dismiss]
```

## Next Steps

1. **Complete Planning Phase** - Finalize all architectural decisions
2. **Decision Making Phase** - Resolve any open questions
3. **Implementation Phase** - Build and test the functionality
4. **Validation Phase** - User testing and feedback integration

## Resolved Questions

1. **Conversations scope:** Global - conversations can reference and modify multiple files across the vault
2. **Concurrent sessions:** Start with single session implementation, design for future multi-session support
3. **File modifications:** Agents can create files, directories, and modify existing files when requested
4. **Notification integration:** Use existing notifications.jsonl system, plan future UI notifications

## Implementation Plan

### Phase 1: UI Implementation (Starting Point)

**Plugin Components:**
1. **ChatWindow** - Floating overlay component
2. **ChatInput** - Message input with mention support and decoration
3. **ChatMessages** - Message display with formatting
4. **ChatManager** - Window state management
5. **ChatSelector** - Conversation management and selection

**UI Features:**
- Toggle visibility with Cmd+K
- Draggable and resizable window
- Auto-scroll to latest messages
- Message timestamps and agent indicators
- Loading animation with jumping dots during agent processing
- Keyboard shortcuts: Enter to send, Shift+Enter for new line
- Multi-agent chat title support with truncation (e.g., "Chat with betty and mykola", "Chat with agent1, agent2 and 3 others")
- **Command palette integration**: @mentions and /commands in chat input
- **Mention decoration**: Visual styling for agents, files, folders, and commands
- **Chat selector**: New chat button and conversation list dropdown

**Integration Points:**
- Leverage existing mention system from command palette
- Use existing MentionDecorator for chat input styling
- Use Obsidian's CSS framework for styling
- Integrate with existing hotkey system

### Phase 2: Conversation Management

**Storage Components:**
1. **ConversationStorage** - Read/write .spark/conversations/
2. **ConversationManager** - Session state management
3. **MessageHistory** - Message persistence and retrieval
4. **ChatSelector** - New chat creation and conversation switching

**Chat Selector Features:**
- New Chat button (always creates fresh conversation)
- Conversation history dropdown showing recent conversations
- Conversation preview with first message or date
- Switch between conversations without losing context
- Default to most recent conversation on open

### Phase 3: Agent Integration & Command Palette

**Processing Components:**
1. **ChatMessageHandler** - Process messages through CommandExecutor
2. **ChatResultWriter** - Format and display agent responses
3. **FileModificationTracker** - Track and report file changes
4. **ChatMentionHandler** - Handle @mentions and /commands in chat

**Command Palette Integration:**
- Same @agent, @file, @folder/ syntax as command palette
- Same /command syntax for spark commands
- Mention decoration with visual styling (colors, icons)
- Clickable mentions for quick navigation
- Auto-completion suggestions for mentions

### Phase 4: Enhanced Features

**Advanced Chat Features:**
1. **Conversation Search** - Find messages across all conversations
2. **Export/Import** - Backup and restore conversations
3. **Multi-agent Support** - Simultaneous conversations with multiple agents
4. **Context Preservation** - Maintain file/folder context across messages
5. **Quick Actions** - Common commands via mention shortcuts
