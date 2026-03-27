# blueprints-cli

A tool for generating files and directories from reusable templates called *blueprints*. Commonly used to scaffold components, services, configurations, and other repeatable file structures.

## Installation

```bash
npm install -g @codetools/blueprints-cli
```

## Quick Start

```bash
# 1. Create a blueprint
bp new -g myBlueprint

# 2. Add template files to ~/.blueprints/myBlueprint/files/

# 3. Generate from the blueprint
bp generate myBlueprint MyInstance
```

## Commands

| Command | Description | Options |
| ------- | ----------- | ------- |
| `generate\|g <blueprint> <instance>` | Generate files from a blueprint. Extra `key=value` args supply template data. | `-d, --dest <dir>`: Output directory.<br>`--dry-run`: Preview without writing.<br>`--json`: Machine-readable output. |
| `info\|i <blueprint>` | Inspect a blueprint and list its required variables. | `--json` |
| `list\|ls [namespace]` | List all available blueprints. | `-l, --long`: Show descriptions.<br>`--json` |
| `new <blueprint>` | Create a new blueprint template. | `-g, --global`: Create globally.<br>`-s, --source <path>`: Seed from a directory.<br>`-f, --file <filespec>`: Add a file (repeatable); format: `path[:content]`.<br>`--json` |
| `import <globalBlueprint> [localBlueprint]` | Copy a global blueprint into the current project. | `--json` |
| `remove\|rm <blueprint>` | Remove a blueprint. | `-g, --global`: Remove from global store.<br>`--json` |
| `init [projectPath]` | Initialize a `.blueprints` directory in a project. | `--json` |
| `ask\|a <blueprint> <instance>` | Generate files using AI and blueprint prompts. | `-d, --dest <dir>`<br>`-m, --model <id>` |
| `models\|md` | List configured AI model ids, providers, and model names. | — |

The global `--json` flag is supported on all commands except `ask` and `models`. When set, output is emitted as structured JSON to stdout; errors are emitted as `{ "error": { "code", "message" } }` to stderr with exit code 1.

## Example

```bash
# Inspect a blueprint first
bp info statusReport --json

# Generate with template data
bp generate statusReport ProjectAlpha projectName="Project Alpha" status="On Track" date=2023-12-08
```

## MCP Server (Agent Integration)

blueprints-cli ships an MCP server so AI agents (Claude Code, Claude Desktop, etc.) can call blueprint operations directly without shell execution.

**Recommended — zero-install via `npx`:**

```json
{
  "mcpServers": {
    "blueprints": {
      "command": "npx",
      "args": ["-y", "-p", "@codetools/blueprints-cli", "bp-mcp"]
    }
  }
}
```

**Working inside this repo?** An `.mcp.json` is included at the project root — compatible clients connect automatically with no extra setup.

See [Agent Integration](docs/agent-integration.md) for all setup options, available tools, and CLI JSON mode.

## Documentation

- [Blueprint Structure](docs/blueprints.md) — directory layout, `blueprint.json` schema, template syntax, lifecycle hooks
- [Template Variables](docs/template-variables.md) — `{{ var }}` / `__var__` patterns and auto-generated metadata
- [AI Generation](docs/ai-generation.md) — `bp ask`, model configuration, prompt files
- [Agent Integration](docs/agent-integration.md) — `--json`, `--dry-run`, `bp info`, MCP server
- [Examples](docs/examples.md) — full worked examples
