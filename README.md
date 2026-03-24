# blueprints-cli

blueprints-cli is a tool for generating files from templates, referred to as 'blueprints'. It's commonly used in development environments for creating components, applications, containers, and configurations. The tool aims to automate file creation, focusing on simplicity, flexibility, and extensibility.

## Installation

Install blueprints-cli using npm:

```bash
npm install -g @codetools/blueprints-cli
```

Or, using yarn:

```bash
yarn global add @codetools/blueprints-cli
```

## Quick Start

### 1. Create a Blueprint

Create a new blueprint:

```bash
bp new -g ExampleBlueprint
```

### 2. Configure the Blueprint

Add files for reuse to your blueprint:

```
~/.blueprints/ExampleBlueprint/files/
```

### 3. Use the Blueprint

Generate files in your desired directory:

```bash
bp generate <blueprintName> <blueprintInstanceName>
```

## Get to Know `blueprints-cli`

### Why: Making File Creation Easy

`blueprints-cli` is here to make creating lots of files easy and quick. It's perfect for when you need to make many files that are kind of the same but still need some small changes. This way, you don't have to spend so much time on making each file from scratch.

### How: The Simplicity of Blueprints

Think of blueprints as your personal shortcuts for file-making. Once you set up a blueprint, it becomes a go-to template for creating new files. It's like having a base recipe that you can tweak a little each time, depending on what you need.

**Example:** You make a blueprint for your weekly report. Then, every week, you just change the date, status, and notes, and your report is ready to go.

Blueprint File *(Before)*:
```plaintext
Weekly Report for {{ projectName }}

Date: {{ date }}
Status: {{ status }}

Notes:
{{ notes }}
```

Generated File *(After)*:
```plaintext
Weekly Report for Project X

Date: 2023-12-08
Status: On Track

Notes:
All milestones met, team is making excellent progress.
```

## Commands

Below is a table outlining the available commands, their descriptions, and options:

| Command | Description | Options |
| ------- | ----------- | ------- |
| `ask\|a <blueprint> <blueprintInstance>` | Generate files using AI and blueprint prompts/templates. | `-d, --dest <destination>`: Output directory.<br>`-m, --model <id>`: Model id from the registry (see `bp models`). |
| `generate\|g <blueprint> <blueprintInstance>` | Generate files from a blueprint. | `-d, --dest <destination>`: Specify the directory for the files.<br>`<args>`: Additional arguments for template data and metadata. |
| `models\|md` | List configured AI model ids, providers, and API model names. | None |
| `help [command]` | Display help for a command. | None |
| `import <globalBlueprint> [localBlueprint]` | Import a global blueprint to a local project. | None |
| `init [projectPath]` | Initialize a local blueprints project. | None |
| `list\|ls [namespace]` | List all available blueprints. | `-l, --long`: Show more details about each blueprint. |
| `new <blueprint>` | Create a new blueprint. | `-g, --global`: Create the blueprint globally. <br> `-s, --source [sourcePath]`: Specify an initial source path for blueprint files. |
| `remove\|rm <blueprint>` | Remove a blueprint. | `-g, --global`: Remove a global blueprint. |

## AI generation (`bp ask`)

`bp ask` uses LangChain with structured output. You need an API key for whichever **provider** your chosen model uses:

| Provider | Environment variable |
| -------- | -------------------- |
| OpenAI | `OPENAI_API_KEY` |
| Anthropic | `ANTHROPIC_API_KEY` |
| Google (Gemini) | `GOOGLE_API_KEY` |

Run **`bp models`** (alias **`bp md`**) to see built-in and configured model **ids**, providers, and provider-native model names.

### How the model is chosen

Precedence (first match wins):

1. **`bp ask ... -m <id>`** — registry id (see `bp models`).
2. **`BP_MODEL`** — same id as above.
3. **`blueprint.json`** — optional top-level **`"model": "<id>"`**.
4. **`OPENAI_MODEL`** — OpenAI API model name only (skips the id registry; legacy escape hatch).
5. **`defaultModel`** in config (see below).
6. Built-in default id **`gpt-4o-mini`**.

### Extending the model list

Add **`~/.blueprints/models.json`** and/or **`<project>/.blueprints/models.json`**. The project file is merged **after** the global file; entries with the same **`id`** override earlier ones.

```json
{
  "defaultModel": "work-gpt",
  "models": [
    {
      "id": "work-gpt",
      "provider": "openai",
      "model": "gpt-4o",
      "label": "Work OpenAI",
      "temperature": 0
    },
    {
      "id": "work-claude",
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "label": "Work Anthropic"
    }
  ]
}
```

Each entry needs **`id`**, **`provider`** (`openai`, `anthropic`, or `google`), and **`model`** (the name expected by that provider’s API). Optional: **`label`**, **`temperature`**, **`maxTokens`**.

## Glossary

- **Global Blueprints:** Blueprints available for any project, stored so you can use them anywhere.
- **Local Blueprints:** Blueprints made for specific projects, useful for unique project needs.
- **Metadata:** This is information used by the blueprint to format your file names and other details automatically, ensuring everything stays consistent.
- **Template Data:** These are the specific details you provide, like project names or dates, that customize your blueprint for each file you create.

## Basic Example: Creating Project Status Reports

### Scenario

You're regularly creating status reports for different projects. Each report should be friendly and informative, including the project's name, its status, and the report's date.

### Step 1: Creating the Blueprint

First, we create the blueprint:

```bash
bp new -g statusReportBlueprint
```

Now we have a blueprint created at `~/.blueprints/statusReportBlueprint`

### Step 2: Defining the Blueprint's Templates
- Create a file at `~/.blueprints/statusReportBlueprint/files/__blueprintInstance__/__date__-Report.txt`
- File Content (`__date__-Report.txt`):
  ```plaintext
  Hello Team!

  Here's the latest update on {{projectName}}:
  - Status as of now: {{status}}
  - Report Date: {{date}}

  Keep the momentum going!
  ```

### Step 3: Generating the Report

To create a report for "Project Alpha" on a specific date, we run:

```bash
bp generate statusReportBlueprint ProjectAlpha projectName="Project Alpha" status="On Track" date=2023-12-08
```

Here's what happens:

- The command interprets `ProjectAlpha` and `2023-12-08` to dynamically create:
  - A filename: `ProjectAlpha/2023-12-08-Report.txt`.
  - A report content that warmly addresses "Project Alpha" and mentions the specific date.
- The `status` value is also seamlessly integrated into the report, completing the picture.


### End Result

The result is a customized, friendly status report at `./ProjectAlpha/2023-12-08-Report.txt`, containing:

```plaintext
Hello Team!

Here's the latest update on Project Alpha:
- Status as of now: On Track
- Report Date: 2023-12-08

Keep the momentum going!
```
