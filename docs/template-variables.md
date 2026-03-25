# Template Variables

Template variables allow file names and file contents to be customized at generation time.

## Syntax

| Location | Pattern | Example |
| -------- | ------- | ------- |
| File / directory names | `__variableName__` | `__blueprintInstance__.tsx` |
| File contents | `{{ variableName }}` | `export const {{ blueprintInstance_ConstantFormat }} = ...` |

Both syntaxes accept the same variable names. Whitespace inside content braces is optional.

## Supplying Variables

Pass `key=value` pairs after the instance name on the command line:

```bash
bp generate report DailyStandup title="Daily Standup" date=2024-01-15
```

Any variable defined in `blueprint.json` under `data` is used as a default and can be overridden by a CLI argument.

## Auto-Generated Variables

The following variables are always available without being explicitly passed. They are derived from the blueprint name, instance name, and destination.

### Base Variables

| Variable | Value |
| -------- | ----- |
| `blueprint` | The blueprint name |
| `blueprintInstance` | The instance name as given |
| `blueprintInstanceDestination` | The resolved output directory path |

### Format Variants

All variants are derived from `blueprintInstance`. Hyphens in the instance name are treated as word separators.

| Variable | Format | Example (`my-service`) |
| -------- | ------ | ---------------------- |
| `blueprintInstance_ClassFormat` | PascalCase | `MyService` |
| `blueprintInstance_PascalCaseFormat` | PascalCase | `MyService` |
| `blueprintInstance_CamelCaseFormat` | camelCase | `myService` |
| `blueprintInstance_DashedFormat` | kebab-case | `my-service` |
| `blueprintInstance_SlugFormat` | kebab-case | `my-service` |
| `blueprintInstance_SnakeCaseFormat` | SNAKE_CASE | `MY_SERVICE` |
| `blueprintInstance_ConstantFormat` | CONSTANT_CASE | `MY_SERVICE` |

### Pluralized and Singularized Variants

Every variable above (except `blueprintInstanceDestination`) also has `Pluralized` and `Singularized` suffixes:

```
blueprintInstancePluralized           → "my-services"
blueprintInstance_ClassFormatPluralized  → "MyServices"
blueprintInstance_CamelCaseFormatSingularized → "myService"
```

These are useful for generating index files or context names that refer to a collection.

## Discovering Required Variables

Use `bp info` to see which variables a blueprint requires beyond the auto-generated set:

```bash
bp info myBlueprint --json
```

```json
{
  "name": "myBlueprint",
  "location": "/path/to/myBlueprint",
  "hooks": { "preGenerate": [], "postGenerate": [] },
  "requiredVariables": [
    { "name": "styleType", "default": "css" },
    { "name": "route", "default": null }
  ]
}
```

Variables with `"default": null` have no fallback and must be supplied on the command line.
