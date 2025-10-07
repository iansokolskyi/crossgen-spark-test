# Architecture Decisions - Status Report

**Date:** 2024  
**Purpose:** Track which architectural questions have been resolved and which remain open

---

## ✅ RESOLVED DECISIONS

### 1. The Plugin vs Core Split
**DECISION:** File-based event architecture  
**Details:** Plugin writes raw user input to markdown, daemon watches files and processes  
**Status:** ✅ Fully specified in PRODUCT_ARCHITECTURE.md

### 2. The Mention System Parsing
**DECISION:** Priority-based resolution with proximity context  
**Details:**
- `@betty` → Check agents, then files, then folders
- Trailing `/` indicates folder: `@finance/Q4/`
- File extension indicates file: `@rules.md`
- Context ordered from current file outward (concentric circles)
**Status:** ✅ Fully specified in MENTION_PARSER.md

### 3. Command Execution Context
**DECISION:** Rich context with proximity-based ordering  
**Details:**
- Priority 1: Mentioned files/folders
- Priority 2: Current file
- Priority 3: Parent directory (siblings)
- Priority 4: Other vault files (by distance from current file)
**Status:** ✅ Fully specified in MENTION_PARSER.md

### 4. Error Handling Philosophy
**DECISION:** Simple notifications with detailed logs  
**Details:**
- Show ❌ emoji in file
- Simple toast notification
- Detailed error written to `.spark/logs/error-{id}.md`
- Notification links to log file
- Automatic retry for transient errors
**Status:** ✅ Fully specified in RESULT_AND_ERROR_HANDLING.md

### 5. Result Writing
**DECISION:** Most commands don't write results, just show ✅  
**Details:**
- The action IS the result (modified files, sent emails, created reports)
- Just mark line with ✅ to indicate completion
- Only write results for commands that explicitly request inline output
**Status:** ✅ Fully specified in RESULT_AND_ERROR_HANDLING.md

### 6. State Management & Persistence
**DECISION:** Hybrid approach  
**Details:**
- Conversations: Markdown files (`.spark/conversations/`)
- Daemon state: JSON files (`.spark/state/`)
- Notifications: JSONL append-only file
- Human-readable when possible, database when necessary
**Status:** ✅ Implied in various specs

### 7. Plugin UI Design
**DECISION:** Two interfaces with distinct purposes  
**Details:**
- Command Palette: Notion-style inline autocomplete (atomic actions)
- Chat Widget: Intercom-style floating chat (conversational sessions)
- Both share same mention system and context loading
**Status:** ✅ Fully specified in PLUGIN_UI_SPEC.md

### 8. MCP Integration Philosophy
**DECISION:** Reference-only, not installation  
**Details:**
- Spark only references MCP servers in config
- Users install/configure MCP servers separately
- Daemon validates they exist and calls them
- Not responsible for installation or management
**Status:** ✅ Specified in CONFIGURATION.md

---

## ✅ ADDITIONAL RESOLVED DECISIONS

### 2. The Daemon's Role
**DECISION:** System service (always-running)  
**Details:**
- Daemon runs as system service (systemd on Linux, launchd on macOS)
- Starts automatically on boot
- Runs continuously in background
- Requires installation process
- True 24/7 automation capability
**Status:** ✅ Decided - System service

### 5. Trigger System
**DECISION:** ✅ Triggers contain inline instructions, not references to SOPs  
**Details:**
- Triggers are rules that watch for file changes (frontmatter, file creation, etc.)
- When trigger matches, the instructions IN the trigger file tell daemon what to do
- No separate SOP files - instructions are inline in the trigger definition
- Example: Kanban board status change triggers email sending

**Clarified understanding:**
```yaml
# .spark/triggers/email-automation.yaml
- name: send_email_on_status_change
  watch:
    directory: "emails/"
    frontmatter_field: status
    from_value: draft
    to_value: sent
  
  # Instructions inline (not reference to separate file)
  instructions: |
    When a file's status changes from "draft" to "sent":
    1. Extract the recipient from the `to:` frontmatter field
    2. Extract the subject from the `subject:` frontmatter field
    3. Take the content of the file as the email body
    4. Send email via $gmail
    5. Update frontmatter: sent_date: [current timestamp]
    6. Move file to sent/ folder
```

**Status:** ✅ Decided - Instructions inline, no SOP references

**Note:** The term "SOP" in the PRD was misleading. Triggers contain the instructions directly, not references to separate instruction files.

### 6. AI Provider Abstraction
**DECISION:** Claude Code only  
**Details:**
- Use Claude Code as the AI interface
- No abstraction for other providers
- Simpler implementation
- Leverage existing Claude Code integration
**Status:** ✅ Decided - Claude Code only

### 9. Security & Sandboxing
**DECISION:** Out of scope  
**Details:**
- Marketplace features are vision/future
- Not part of current implementation
- Focus on personal use case
**Status:** ✅ Decided - Deferred to future

### 10. Bundle Installation System
**DECISION:** Out of scope  
**Details:**
- Marketplace features are vision/future
- Not part of current implementation
- Manual creation of commands/agents/SOPs
**Status:** ✅ Decided - Deferred to future

---

---

## CONFIRMED DECISIONS FOR IMPLEMENTATION

### 1. Daemon Management
**DECISION:** ✅ System service (always-running)
- Daemon runs as background service
- Installed via setup script
- Starts on boot (systemd/launchd)
- True 24/7 automation

### 2. AI Provider
**DECISION:** ✅ Claude Code only
- Use existing Claude Code integration
- No provider abstraction needed
- Simpler implementation
- Can add other providers later if needed

### 3. Security & Marketplace
**DECISION:** ✅ Out of scope
- Marketplace is vision/future
- Focus on personal dogfooding use case
- No bundle system needed now
- No sandboxing needed now

### 4. Multiple Trigger Matching
**DECISION:** ✅ Run all matching triggers in priority order
**Details:**
- If multiple triggers match the same file change, execute all of them
- Process in priority order (highest to lowest)
- Each trigger is independent with its own instructions
- Example: File status changes, trigger 1 sends email, trigger 2 logs the action
**Status:** ✅ Decided - Execute all matches

---

## READY TO PROCEED

**We have enough decisions to build:**

✅ Architecture (file-based event system)  
✅ Daemon (system service, always-running)  
✅ Plugin (command palette + chat widget)  
✅ Mention parser (proximity-based context)  
✅ AI provider (Claude Code only)  
✅ Error handling (notifications + logs)  
✅ Result handling (✅ indicator, minimal inline results)  
✅ Configuration (YAML files)  
✅ File formats (from PRD)  

**All decisions resolved! ✅**

---

## NEXT STEP

**Ready to create:**

1. **Implementation Plan** - Phases, milestones, timeline
2. **Installation Guide** - How to set up daemon as system service
3. **Testing Strategy** - How to validate each component
4. **Development Roadmap** - Priority order for building features

**All architecture decisions are resolved. Ready to move to implementation planning!**
