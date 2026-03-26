# Agent Integration

blueprints-cli is designed for use by LLM agents. Two integration paths are available: a native MCP server (preferred) and a JSON CLI mode.

## MCP Server (Preferred)

The MCP server exposes blueprints as tools over stdio transport, allowing MCP-compatible clients (Claude Desktop, Claude Code, etc.) to call blueprint operations directly without shell execution.

### Setup

Choose the setup method that matches your context:

**Option 1 — Zero-install via `npx` (recommended for most projects)**

No global install required. Add this to your MCP client configuration:

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

**Option 2 — Auto-discovery in the repo (for contributors and local dev)**

When working inside the `blueprints-cli` repository, an `.mcp.json` file is already present at the project root. MCP-compatible clients (e.g. Claude Code) will detect and connect to the server automatically — no manual configuration needed.

**Option 3 — After a global install**

If you have installed the package globally (`npm install -g @codetools/blueprints-cli`), the `bp-mcp` binary is available directly:

```json
{
  "mcpServers": {
    "blueprints": {
      "command": "bp-mcp"
    }
  }
}
```

### Available Tools

#### `list_blueprints`

List all available blueprints.

```json
Input:  { "namespace": "optional/prefix" }

Output: {
  "global":  [{ "name": "...", "location": "..." }],
  "project": [{ "name": "...", "location": "..." }]
}
```

#### `info_blueprint`

Inspect a blueprint and get its required variables.

```json
Input:  { "blueprint": "component" }

Output: {
  "name": "component",
  "location": "/path/to/component",
  "hooks": { "preGenerate": [], "postGenerate": [] },
  "requiredVariables": [
    { "name": "styleType", "default": "css" },
    { "name": "route",     "default": null }
  ]
}
```

#### `generate_blueprint`

Generate files from a blueprint.

```json
Input: {
  "blueprint":   "component",
  "instance":    "Button",
  "destination": "/optional/output/dir",
  "data":        { "styleType": "scss" },
  "dryRun":      false
}

Output (normal): {
  "success": true,
  "blueprint": "component",
  "instance": "Button",
  "destination": "/output/dir"
}

Output (dryRun: true): {
  "dryRun": true,
  "destination": "/output/dir",
  "files": [
    { "path": "/output/dir/Button/Button.tsx", "content": "..." }
  ]
}
```

#### `create_blueprint`

Create a new blueprint template.

```json
Input: {
  "name":   "component",
  "global": false,
  "source": "/optional/seed/directory"
}

Output: {
  "success":  true,
  "blueprint": "component",
  "location":  "/path/to/.blueprints/component"
}
```

---

## CLI JSON Mode

When MCP is not available, use the CLI with `--json` on every command for structured output.

### Recommended Agent Workflow

```bash
# 1. Discover available blueprints
bp list --json

# 2. Inspect required variables
bp info <blueprint> --json

# 3. Preview without writing
bp generate <blueprint> <instance> --dry-run --json [key=value ...]

# 4. Execute
bp generate <blueprint> <instance> --json [key=value ...]
```

### Output Shapes

**Success:**
```json
{ "success": true, "blueprint": "component", "instance": "Button", "destination": "/path" }
```

**Dry-run:**
```json
{
  "dryRun": true,
  "destination": "/path",
  "files": [{ "path": "/path/Button/Button.tsx", "content": "rendered content" }]
}
```

**Error** (stderr, exit code 1):
```json
{ "error": { "code": "BLUEPRINT_NOT_FOUND", "message": "Blueprint \"x\" not found" } }
```

### Error Codes

| Code | Cause |
| ---- | ----- |
| `BLUEPRINT_NOT_FOUND` | No blueprint with that name in project or global store |
| `BLUEPRINT_ALREADY_EXISTS` | `bp new` target path already exists |
| `INVALID_SOURCE` | `bp import` source blueprint does not exist in global store |
| `LIFECYCLE_SCRIPT_ERROR` | A `preGenerate` or `postGenerate` hook threw an error |
| `UNKNOWN_ERROR` | Uncategorized error |

### Notes for Agents

- Always append `--json` to every command — never parse human-readable output.
- Auto-generated variables (`blueprintInstance`, `blueprintInstance_ClassFormat`, etc.) do not need to be supplied; see [Template Variables](template-variables.md) for the full list.
- Do not use `bp ask` or `bp models` in automated contexts — those are reserved for human operators.
- Variable values with spaces must be quoted: `title="My Title"`.
