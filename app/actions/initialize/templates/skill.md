# blueprints-cli

Use blueprints-cli whenever the user asks you to scaffold, generate, or create files from a repeatable template in this project. blueprints-cli turns named blueprint templates into real files and directories.

## When to Use

- User asks to generate a component, service, module, page, or other repeatable structure
- An existing blueprint matches the structure needed
- User asks to create a new blueprint from scratch or from an existing directory
- User asks to list, inspect, or remove blueprints

## Preferred Workflow (MCP)

When the blueprints MCP server is connected, call MCP tools directly — no shell required.

### Step 1 — Discover available blueprints

```
list_blueprints({ namespace?: string })
→ { global: [{ name, location }], project: [{ name, location }] }
```

### Step 2 — Inspect the blueprint

```
info_blueprint({ blueprint: "name" })
→ { name, location, hooks, requiredVariables: [{ name, default }] }
```

Variables with `"default": null` must be supplied. Auto-generated variables (see below) never need to be supplied.

### Step 3 — Preview (dry run)

```
generate_blueprint({ blueprint, instance, destination?, data?, dryRun: true })
→ { dryRun: true, destination, files: [{ path, content }] }
```

### Step 4 — Generate

```
generate_blueprint({ blueprint, instance, destination?, data?, dryRun: false })
→ { success: true, blueprint, instance, destination }
```

### Creating a blueprint

```
create_blueprint({ name, global?: false, source?: "/path/to/seed/dir", files?: ["path[:content]"] })
→ { success: true, blueprint, location }
```

`files` entries use the format `"path/to/file[:content]"` where the path is relative to `files/` inside the blueprint. Content after the `:` is optional.

## CLI Fallback (When MCP is Unavailable)

Always append `--json` to every command. Never parse human-readable output.

```bash
# 1. Discover
bp list --json

# 2. Inspect
bp info <blueprint> --json

# 3. Preview
bp generate <blueprint> <instance> --dry-run --json [key=value ...]

# 4. Generate
bp generate <blueprint> <instance> --json [key=value ...]

# Create a blueprint
bp new <name> --json
```

## Auto-Generated Template Variables

These are always available — never pass them explicitly:

| Variable | Format | Example (input: `my-service`) |
| -------- | ------ | ----------------------------- |
| `blueprintInstance` | as given | `my-service` |
| `blueprintInstance_ClassFormat` | PascalCase | `MyService` |
| `blueprintInstance_PascalCaseFormat` | PascalCase | `MyService` |
| `blueprintInstance_CamelCaseFormat` | camelCase | `myService` |
| `blueprintInstance_DashedFormat` | kebab-case | `my-service` |
| `blueprintInstance_SlugFormat` | kebab-case | `my-service` |
| `blueprintInstance_SnakeCaseFormat` | SNAKE_CASE | `MY_SERVICE` |
| `blueprintInstance_ConstantFormat` | CONSTANT_CASE | `MY_SERVICE` |

Every variable above also has `Pluralized` and `Singularized` suffixes (e.g. `blueprintInstance_ClassFormatPluralized` → `MyServices`).

Template syntax: `__variableName__` in file/directory names, `{{ variableName }}` in file contents.

## Error Codes

| Code | Meaning |
| ---- | ------- |
| `BLUEPRINT_NOT_FOUND` | No matching blueprint in project or global store |
| `BLUEPRINT_ALREADY_EXISTS` | `bp new` target already exists |
| `INVALID_SOURCE` | `bp import` source blueprint does not exist globally |
| `LIFECYCLE_SCRIPT_ERROR` | A `preGenerate` or `postGenerate` hook threw |

## Notes

- Never parse human-readable CLI output — always use `--json` or MCP tools.
- Do not use `bp ask` or `bp models` in automated contexts.
- Variable values with spaces must be quoted: `title="My Title"`.
- MCP server command: `bp-mcp` (or `npx -y -p @codetools/blueprints-cli bp-mcp`).
