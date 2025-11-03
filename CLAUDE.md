# Spark - AI Automation Platform for Obsidian

This project builds a comprehensive AI automation platform that enables intelligent automation workflows within Obsidian vaults.

## Always-Apply Rules

These rules apply to EVERY session and task:

### Development Workflow

**Purpose:** Maximize autonomy, minimize token usage, ensure quality

⚠️ **CRITICAL: These rules are MANDATORY for ALL work (daemon AND plugin)**
⚠️ **DO NOT skip self-validation. DO NOT mark tasks complete without verification.**

#### Key Principles
- **Minimize token usage** – No over-verbose explanations
- **Track progress** – Use TODO lists when working through multi-step tasks
- **Keep plans concise** – High-level approach only, no code in plans
- **Self-validate** – MANDATORY for daemon (tests) and plugin (MCP)
- **Be autonomous** – Work through all steps independently when possible

#### Workflow Steps
** MANDATORY FOR BOTH DAEMON AND PLUGIN - NO EXCEPTIONS **

1. **Plan** - Understand requirements, review context, create TODO list, track progress in separate FEATURE.md file.
2. **Decision** - Figure out options, identify open questions, discus questions with me, I'll make decisions.
   - **Baseline Check**: Run `npm run check` to note current state
3. **Implementation** - Keep it minimal and elegant, respect existing patterns
4. **Check for Errors** - Run `npm run check` (daemon: tests+coverage, plugin: lint+format+tests)
5. **Address Issues** - Fix problems, re-run check
6. **Check Coverage** - Maintain or improve test coverage
7. **Hot-Reload Verification** - Changes should auto-reload, rebuild manually if needed
8. **Self-Validation** - MANDATORY. See validation methods below
   - **Plugin changes**: MUST verify with MCP before completion
   - **Daemon changes**: MUST verify with tests/console logs
9. **User Feedback** - Only after self-validation is complete

**Self-Validation Methods:**

**For Daemon - MANDATORY:**
- ⚠️ **DO NOT mark daemon tasks complete without running tests**
- Run `npm run check` (includes tests + coverage)
- Verify test output shows passing tests
- Check coverage maintains or improves (current: 79%)
- Run daemon in debug mode if needed: `npm run dev:debug`
- Use console logs to verify behavior
- **Only ask user if tests pass but behavior seems wrong**

**Daemon Validation Checklist (MANDATORY FOR ALL DAEMON CHANGES):**
1. ✅ Run `npm run check` in daemon directory
2. ✅ Verify all tests pass (currently 264 tests across 15 suites)
3. ✅ Check coverage didn't decrease (maintain 79% or improve)
4. ✅ Fix any TypeScript errors
5. ✅ Fix any linting errors
6. ✅ If behavior needs verification, run `npm run dev:debug`
7. ✅ Check console logs show expected behavior
8. ✅ Only then mark task as complete

**For Plugin (98% Autonomous with MCP) - MANDATORY:**
- ⚠️ **DO NOT mark plugin tasks complete without MCP verification**
- **Playwright MCP enables autonomous validation**
- Launch Obsidian with debugging: `open -a Obsidian --args --remote-debugging-port=9222`
- Connect via MCP (available after session restart)
- Type keyboard commands (`/`, `@`, `Cmd+K`) automatically
- Read console logs automatically
- Capture screenshots for verification
- Inspect DOM elements programmatically
- Monitor network requests to daemon
- **Only ask user if truly unable to verify after attempting MCP**

**MCP Validation Checklist (MANDATORY FOR ALL PLUGIN CHANGES):**
1. ✅ Check if Obsidian is running with debugging: `curl http://localhost:9222/json`
2. ❌ If not running, launch it: `open -a Obsidian --args --remote-debugging-port=9222`
3. 🔄 Make plugin changes
4. 🔄 Ask user to:
   - Reload plugin (Cmd+R, wait 2 seconds)
   - Navigate to the feature being tested (e.g., open settings, trigger command palette)
5. ✅ Verify via console/logs:
   - Check Obsidian console (Option+Cmd+I) for errors
   - Verify expected console.log output
   - Ask user to test interaction and report results
6. 📸 Alternative: Ask user for screenshots if needed
7. 🔁 Iterate until verified working
8. ✅ Only then mark task as complete

**Note:** Full autonomous MCP keyboard automation requires Accessibility permissions for osascript.
For now, verification requires user interaction + console log analysis.

#### Key Commands

**Daemon:**
- `npm run check` – format, lint, type-check, tests with coverage
- `npm run dev` – development mode with auto-restart
- `npm run dev:debug` – development mode with debug logging

**Plugin:**
- `npm run check` – format, lint, type-check, tests with coverage
- `npm run dev` – development mode with hot-reload
- `npm test` – run tests
- `npm run test:watch` – watch mode for tests
- Reload in Obsidian: `Cmd+R`

**MCP Validation:**
- Launch Obsidian: `open -a Obsidian --args --remote-debugging-port=9222`
- Verify connection: `curl http://localhost:9222/json`
- Check MCP config: `cat ~/.claude.json | grep playwright`

#### Philosophy
- **Maximize autonomy** – work independently through all steps (98% with MCP!)
- **Minimize token usage** – be concise
- **Minimal and elegant** over complex and comprehensive
- **Robust implementations** over quick workarounds
- **Respect patterns** that already exist
- **Self-validate** before asking for human review (MCP for plugin, tests for daemon)
- **Test coverage** is a quality metric, maintain or improve it

---

### Debugging Approach

**Purpose:** Avoid overcomplicating bug fixes

#### Core Principles

1. **Understand Before Fixing** - Never write a fix without understanding the root cause
2. **Analyze Error Messages Carefully** - Error messages are hints, trace backwards
3. **Keep Fixes Minimal** - If your fix is >20 lines for a simple bug, you don't understand the problem
4. **Resist Premature Solutions** - Read, trace, understand THEN fix
5. **Question Your Assumptions** - Symptoms ≠ Root Cause

#### Anti-Patterns to Avoid
- ❌ Adding complexity to handle edge cases
- ❌ Working around symptoms
- ❌ Try-catch blocks to suppress errors
- ❌ Elaborate state management for edge cases

#### Debugging Checklist
Before writing any fix:
- [ ] Can you explain WHY the bug happens?
- [ ] Have you traced the execution flow?
- [ ] Did you analyze error messages for hints?
- [ ] Is there a simpler root cause you're missing?
- [ ] Would your fix be obvious to someone reading it later?

After implementing the fix:
- [ ] Run `npm run check` to validate

> "Debugging is twice as hard as writing the code in the first place. Therefore, if you write the code as cleverly as possible, you are, by definition, not smart enough to debug it." - Brian Kernighan

Write simple fixes. If it's complex, you're solving the wrong problem.

---

### TypeScript Standards

**Never use `any` type** - Use proper types, interfaces, union types, or generics instead.

**Type Organization:**
- All types in `src/types/` directory, organized by domain
- Interfaces: Prefix with `I` (e.g., `ISparkPlugin`)
- Extract shared types to avoid circular dependencies

**When types seem difficult:**
1. Stop and think: What is the actual type?
2. Check library docs for exported types
3. Use TypeScript utilities (`Partial<T>`, `Pick<T>`, `Omit<T>`)
4. Create a union: `string | number` is better than `any`

---

## Project Context Rules

For specific implementation details, refer to the comprehensive specs in `/specs/`:

### Architecture & Design
- `PRD.md` - Product requirements and vision
- `PRODUCT_ARCHITECTURE.md` - System architecture (plugin vs daemon)
- `ARCHITECTURE_QUESTIONS.md` - Key architectural decisions

### Implementation Specs
- `DAEMON_SPEC.md` - Daemon implementation details
- `PLUGIN_UI_SPEC.md` - Plugin UI design and behavior
- `MENTION_PARSER.md` - How mentions are parsed and processed
- `TRIGGER_SYSTEM_CLARIFIED.md` - Trigger system design
- `CONFIGURATION.md` - Configuration system
- `FILE_FORMATS.md` - File format specifications
- `RESULT_AND_ERROR_HANDLING.md` - How results and errors are handled

### Implementation Plans
- `IMPLEMENTATION_PLAN_DAEMON.md` - Daemon build phases
- `IMPLEMENTATION_PLAN_PLUGIN.md` - Plugin build phases
- `AI_IMPLEMENTATION.md` - AI integration approach
- `CHAT_FUNCTIONALITY.md` - Chat widget implementation

### Development
- `DEVELOPER_EXPERIENCE.md` - Developer tooling and workflow (includes MCP setup)

**Note:** When working on a specific feature, READ the relevant spec file(s) from `/specs/` for detailed context.

---

## Testing & Validation

### Daemon Testing
- **Framework:** Jest with ts-jest
- **Coverage:** 79% (264 tests across 15 suites)
- **Command:** `npm run check` includes tests + coverage
- **Location:** `daemon/__tests__/`

### Plugin Testing
- **Framework:** Jest with jsdom environment
- **Coverage:** 4% (just getting started, target: 60%+)
- **Command:** `npm test` or `npm run check`
- **Location:** `plugin/__tests__/`
- **Mocks:** Obsidian API and CodeMirror are mocked

### Plugin Validation with Playwright MCP
- **Status:** ✅ Configured and ready
- **Autonomy:** 98% (Claude Code can validate UI changes autonomously)
- **Setup:** See `specs/DEVELOPER_EXPERIENCE.md` for comprehensive guide
- **Quick Start:**
  ```bash
  # One-time: Install MCP
  claude mcp add playwright -s user -- npx -y @executeautomation/playwright-mcp-server

  # Every session: Launch Obsidian with debugging
  open -a Obsidian --args --remote-debugging-port=9222
  ```

**What MCP enables:**
- Keyboard input automation (`/`, `@`, `Cmd+K`, etc.)
- Console log monitoring (automatic)
- Screenshot capture (automatic)
- DOM inspection (programmatic)
- Network request monitoring
- End-to-end test flows

**Typical workflow:**
1. Claude Code makes plugin changes
2. User reloads plugin (Cmd+R, 2 seconds)
3. Claude Code validates automatically via MCP
4. Iterate until working (fully autonomous)

---

## Quick Reference

**Project Structure:**
```
crossgen-spark/
├── daemon/          # Spark daemon (TypeScript)
├── plugin/          # Obsidian plugin (TypeScript)
├── example-vault/   # Test vault with .spark/ configuration
├── specs/           # Detailed specifications (READ THESE!)
└── .cursor/rules/   # Cursor-specific rules (mostly superseded by specs)
```

**Development:**
- Daemon: `cd daemon && npm run dev`
- Plugin: `cd plugin && npm run dev`
- Validation: `npm run check` (in daemon or plugin directory)

**Hot Reload:**
- Uses `tsx watch` for daemon (zero config, automatic restart)
- Config auto-reloads (no daemon restart needed)
- Plugin: standard Obsidian plugin hot reload

---

## Communication Protocol

**File System as API:**
- Plugin writes to files
- Daemon watches files
- Daemon processes and writes results
- Plugin displays notifications

**Zero dependencies** - Plugin works without daemon (writes files), daemon works without plugin (processes files).
