# .blueprints

This directory contains project-local blueprint templates used by [blueprints-cli](https://github.com/codetools-io/blueprints-cli).

## What is a Blueprint?

A blueprint is a directory of template files that blueprints-cli uses to scaffold files and directories. Each blueprint lives under a named subdirectory here.

## Blueprint Directory Structure

```
.blueprints/
└── myBlueprint/
    ├── blueprint.json          # Optional configuration
    ├── files/                  # Template files (required)
    │   └── __blueprintInstance__/
    │       └── index.ts
    ├── scripts/                # Lifecycle hooks (optional)
    │   ├── preGenerate.mjs
    │   └── postGenerate.mjs
    └── prompts/                # AI prompts (optional)
        └── default.md
```

## Quick Command Reference

| Command | Description |
| ------- | ----------- |
| `bp new <name>` | Create a new blueprint in this directory |
| `bp list` | List all available blueprints |
| `bp info <blueprint>` | Inspect a blueprint and its required variables |
| `bp generate <blueprint> <instance>` | Scaffold files from a blueprint |
| `bp remove <blueprint>` | Delete a blueprint |

## Blueprint Resolution Order

When you run `bp generate`, blueprints-cli checks:

1. `.blueprints/` in the current project (or nearest ancestor with a `.blueprints/` folder)
2. `~/.blueprints/` globally

Project-local blueprints take precedence over global ones.

## Docs

Full documentation: https://github.com/codetools-io/blueprints-cli/tree/main/docs
