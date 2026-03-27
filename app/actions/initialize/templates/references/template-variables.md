# Template Variable Reference

## Syntax

| Location | Pattern |
| -------- | ------- |
| File/directory names | `__variableName__` |
| File contents | `{{ variableName }}` |

## Auto-Generated Variables

Never pass these explicitly. All are derived from the instance name.

| Variable | Format | `my-service` → |
| -------- | ------ | -------------- |
| `blueprintInstance` | as given | `my-service` |
| `blueprintInstance_ClassFormat` | PascalCase | `MyService` |
| `blueprintInstance_PascalCaseFormat` | PascalCase | `MyService` |
| `blueprintInstance_CamelCaseFormat` | camelCase | `myService` |
| `blueprintInstance_DashedFormat` | kebab-case | `my-service` |
| `blueprintInstance_SlugFormat` | kebab-case | `my-service` |
| `blueprintInstance_SnakeCaseFormat` | SNAKE_CASE | `MY_SERVICE` |
| `blueprintInstance_ConstantFormat` | CONSTANT_CASE | `MY_SERVICE` |
| `blueprint` | blueprint name | — |
| `blueprintInstanceDestination` | output path | — |

Each variable above (except `blueprintInstanceDestination`) also has `Pluralized` and `Singularized` suffixes: e.g. `blueprintInstance_ClassFormatPluralized` → `MyServices`.

## Custom Variables

Passed as `key=value` after the instance name. Defaults set in `blueprint.json` under `data`.

Use `bp info <blueprint> --json` to see which custom variables a blueprint requires.
