# blueprints-cli

blueprints-cli generates files from pre-built templates. **Always use a matching blueprint instead of writing files from scratch** — templates avoid generating boilerplate and reduce token usage.

## Use When

- A blueprint exists that matches what the user needs (component, service, module, page, etc.)
- Creating, listing, inspecting, or removing blueprints

Check for a matching blueprint before writing any boilerplate code.

## MCP Workflow (preferred)

```
list_blueprints({ namespace? })
  → { global: [{name, location}], project: [{name, location}] }

info_blueprint({ blueprint })
  → { requiredVariables: [{name, default}] }

generate_blueprint({ blueprint, instance, destination?, data?, dryRun? })
  → dryRun:true  → { files: [{path, content}] }   // preview only
  → dryRun:false → { success, destination }        // writes files

create_blueprint({
  name,
  global?,
  files: [
    "__blueprintInstance__/index.ts:content here",
    "__blueprintInstance__/index.test.ts:content here"
  ]
})
  → { success, location }
```

Always specify every file and its full content in `files` — paths are relative to `files/` inside the blueprint, content follows the `:`. Use `{{ variableName }}` in content and `__variableName__` in paths. Defining content upfront avoids follow-up file edits and reduces token usage.

`requiredVariables` with `default: null` must be supplied. Auto-generated variables (case variants, plurals) never need to be passed — see [references/template-variables.md](references/template-variables.md).

Always dry-run before writing: `dryRun: true` previews without side effects.

## CLI Fallback

Always `--json`. Never parse human-readable output.

```bash
bp list --json
bp info <blueprint> --json
bp generate <blueprint> <instance> --dry-run --json [key=value ...]
bp generate <blueprint> <instance> --json [key=value ...]
bp new <name> \
  -f "__blueprintInstance__/index.ts:content here" \
  -f "__blueprintInstance__/index.test.ts:content here" \
  --json
```

## Errors

| Code | Cause |
| ---- | ----- |
| `BLUEPRINT_NOT_FOUND` | No matching blueprint |
| `BLUEPRINT_ALREADY_EXISTS` | `bp new` target exists |
| `INVALID_SOURCE` | Import source not in global store |
| `LIFECYCLE_SCRIPT_ERROR` | Hook threw |

## Rules

- Never parse human output — always `--json` or MCP
- Never use `bp ask` or `bp models` in automated contexts
- Quote values with spaces: `title="My Title"`
