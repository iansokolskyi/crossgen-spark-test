# Spark Daemon

The intelligence layer for Spark Assistant. A Node.js daemon that watches your Obsidian vault, parses Spark syntax, loads context, calls Claude API, and writes results back to files.

## Architecture

**Design Principles:**
- Class-based architecture with clear responsibilities
- Composition over inheritance
- Design patterns throughout (Strategy, Observer, Factory, etc.)
- No `any` types - full TypeScript safety
- Small, focused files

## Project Structure

```
daemon/
├── src/
│   ├── index.ts              # Entry point
│   ├── SparkDaemon.ts        # Main daemon orchestrator
│   ├── types/                # All TypeScript type definitions
│   ├── config/               # Configuration management
│   ├── watcher/              # File system watching
│   ├── parser/               # Syntax parsing
│   ├── context/              # Context loading
│   ├── ai/                   # Claude API integration
│   ├── triggers/             # Automation triggers
│   ├── writer/               # Result writing
│   ├── notifications/        # Notification system
│   └── logger/               # Logging infrastructure
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Run in dev mode (hot reload)
npm run dev

# Build
npm run build

# Start daemon
npm start -- /path/to/vault

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

## Installation

```bash
# Build and link globally
npm run build
npm link

# Start daemon
spark start ~/Documents/Obsidian
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

## Implementation Progress

See [DAEMON_PROGRESS.md](../DAEMON_PROGRESS.md) for detailed progress tracking.

**Current Phase:** Phase 1 - Project Setup & File Watching

## License

MIT

