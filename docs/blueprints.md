# Blueprint Structure

A blueprint is a directory that contains template files and optional configuration. Blueprints are stored either globally (`~/.blueprints/`) or locally in a project (`.blueprints/`).

## Directory Layout

```
myBlueprint/
├── blueprint.json              # Configuration (optional)
├── files/                      # Template files — required
│   ├── __blueprintInstance__.ts
│   └── src/
│       └── __blueprintInstance__/
│           └── index.ts
├── scripts/                    # Lifecycle hooks (optional)
│   ├── preGenerate.mjs
│   └── postGenerate.mjs
└── prompts/                    # AI generation prompts (optional)
    └── default.md
```

## blueprint.json

All fields are optional. A `blueprint.json` does not need to exist for scaffold generation to work.

```json
{
  "description": "Human-readable description shown in bp list --long",
  "data": {
    "styleType": "css",
    "framework": "react"
  },
  "preGenerate": ["scripts/preGenerate.mjs"],
  "postGenerate": ["scripts/postGenerate.mjs"],
  "prompts": ["prompts/default.md"],
  "model": "claude-haiku"
}
```

| Field | Type | Description |
| ----- | ---- | ----------- |
| `description` | string | Shown in `bp list --long`. |
| `data` | object | Default values for template variables. Overridden by values passed on the command line. |
| `preGenerate` | string[] | Paths to hook scripts that run before file generation. |
| `postGenerate` | string[] | Paths to hook scripts that run after file generation. |
| `prompts` | string[] | Paths to prompt files used by `bp ask` (AI mode only). |
| `model` | string | Default model id used by `bp ask`. See [AI Generation](ai-generation.md). |

## Template Syntax

### File and Directory Names

Wrap a variable name in double underscores to substitute it in file or directory names:

```
files/
  __blueprintInstance__/
    __blueprintInstance__.tsx
    __blueprintInstance__.test.tsx
```

Running `bp generate component Button` renames those paths to `Button/Button.tsx`, `Button/Button.test.tsx`.

### File Contents

Wrap a variable name in double curly braces to substitute it in file contents:

```tsx
// files/__blueprintInstance__/__blueprintInstance__.tsx
export function {{blueprintInstance_PascalCaseFormat}}() {
  return <div className="{{blueprintInstance_DashedFormat}}">...</div>
}
```

Whitespace inside the braces is allowed: `{{ blueprintInstance }}` and `{{blueprintInstance}}` are equivalent.

See [Template Variables](template-variables.md) for the full list of built-in variables.

## Lifecycle Hooks

Hook scripts run before or after file generation. They receive the resolved template data and a set of utility libraries.

### Signature

```js
// scripts/postGenerate.mjs
export default async function(data, libraries) {
  const { _, fs, date, File, log } = libraries

  // ... perform any file operations

  return Promise.resolve()
}
```

### Available Libraries

| Name | Package | Docs |
| ---- | ------- | ---- |
| `fs` | fs-extra | https://github.com/jprichardson/node-fs-extra |
| `_` | lodash | https://lodash.com/docs |
| `date` | date-fns | https://date-fns.org |
| `File` | built-in | Chain-based file manipulation (read, append, prepend, replace, save) |
| `log` | built-in | `log.text()`, `log.success()`, `log.warning()`, `log.error()` |

### Hook Path Tokens

The paths in `preGenerate` and `postGenerate` support these substitution tokens:

| Token | Replaced with |
| ----- | ------------- |
| `<blueprintName>` | The blueprint's name |
| `<blueprintPath>` | Absolute path to the blueprint directory |
| `<instanceName>` | The blueprint instance name |
| `<instancePath>` | Absolute path to the generated instance destination |

### Error Handling

If any hook rejects its Promise, generation stops and a `LIFECYCLE_SCRIPT_ERROR` is thrown. With `--json`, the error appears as:

```json
{ "error": { "code": "LIFECYCLE_SCRIPT_ERROR", "message": "postGenerate hook failed: ..." } }
```

## Creating Blueprints

**From scratch:**
```bash
bp new myBlueprint          # creates in .blueprints/myBlueprint
bp new -g myBlueprint       # creates in ~/.blueprints/myBlueprint
```

**From an existing directory:**
```bash
bp new myBlueprint -s ./src/components/Button
```

This copies the directory into `files/__blueprintInstance__/` and generates the script scaffolding.

## Blueprint Resolution

When running `bp generate myBlueprint ...`, the CLI checks:

1. `.blueprints/myBlueprint` in the current project (or nearest ancestor with a `.blueprints` folder)
2. `~/.blueprints/myBlueprint` globally

The project-local blueprint takes precedence if both exist.
