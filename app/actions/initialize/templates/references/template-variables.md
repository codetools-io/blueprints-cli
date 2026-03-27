# Template Variable Reference

## Syntax

| Location | Pattern | Example |
| -------- | ------- | ------- |
| File / directory names | `__variableName__` | `__blueprintInstance__.tsx` |
| File contents | `{{ variableName }}` | `export const {{ blueprintInstance_ConstantFormat }} = ...` |

Whitespace inside content braces is optional: `{{ blueprintInstance }}` and `{{blueprintInstance}}` are equivalent.

## Auto-Generated Variables

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

Every variable above also has `Pluralized` and `Singularized` suffixes:

| Suffix | Example (base: `MyService`) |
| ------ | --------------------------- |
| `Pluralized` | `MyServices` |
| `Singularized` | `MyService` |

## Other Auto-Generated Variables

| Variable | Value |
| -------- | ----- |
| `blueprint` | The blueprint name |
| `blueprintInstanceDestination` | The resolved output directory path |

## Custom Variables

Pass `key=value` pairs after the instance name. Defaults can be set in `blueprint.json` under `data`.

```bash
bp generate report DailyStandup title="Daily Standup" date=2024-01-15
```

Use `bp info <blueprint> --json` to see which variables a blueprint requires beyond the auto-generated set.
