# Examples

## Status Reports

Generate recurring status reports that vary only by project, status, and date.

### 1. Create the Blueprint

```bash
bp new -g statusReport
```

### 2. Add a Template File

Create `~/.blueprints/statusReport/files/__blueprintInstance__/__date__-Report.txt`:

```
Hello Team!

Here's the latest update on {{projectName}}:
- Status as of now: {{status}}
- Report Date: {{date}}

Keep the momentum going!
```

### 3. Generate a Report

```bash
bp generate statusReport ProjectAlpha projectName="Project Alpha" status="On Track" date=2024-01-15
```

Output file `./ProjectAlpha/2024-01-15-Report.txt`:

```
Hello Team!

Here's the latest update on Project Alpha:
- Status as of now: On Track
- Report Date: 2024-01-15

Keep the momentum going!
```

---

## React Component Blueprint

A blueprint that scaffolds a component, test file, and index export.

### Blueprint Structure

```
component/
├── blueprint.json
└── files/
    └── __blueprintInstance_PascalCaseFormat__/
        ├── __blueprintInstance_PascalCaseFormat__.tsx
        ├── __blueprintInstance_PascalCaseFormat__.test.tsx
        └── index.ts
```

`blueprint.json`:
```json
{
  "description": "React functional component with tests",
  "data": {
    "styleType": "css"
  }
}
```

`__blueprintInstance_PascalCaseFormat__.tsx`:
```tsx
import styles from './{{blueprintInstance_PascalCaseFormat}}.module.{{styleType}}'

export interface {{blueprintInstance_PascalCaseFormat}}Props {}

export function {{blueprintInstance_PascalCaseFormat}}({}: {{blueprintInstance_PascalCaseFormat}}Props) {
  return <div className={styles.root} />
}
```

`index.ts`:
```ts
export { {{blueprintInstance_PascalCaseFormat}} } from './{{blueprintInstance_PascalCaseFormat}}'
export type { {{blueprintInstance_PascalCaseFormat}}Props } from './{{blueprintInstance_PascalCaseFormat}}'
```

### Generate

```bash
# Use default styleType (css)
bp generate component Button -d src/components

# Override styleType
bp generate component Button -d src/components styleType=scss
```

---

## Blueprint from an Existing Directory

If you have an existing component you want to turn into a blueprint:

```bash
bp new myComponent -s ./src/components/Button
```

This copies `./src/components/Button` into `files/__blueprintInstance__/` and creates the standard hook scaffolding. You can then go into the blueprint and add `{{ }}` variables to the template files.

---

## Using a Lifecycle Hook

A `postGenerate` hook that appends an export to an index file after generation.

`scripts/postGenerate.mjs`:
```js
export default async function(data, { File, log }) {
  const indexPath = `${data.blueprintInstanceDestination}/../index.ts`

  await new File(indexPath)
    .ensureText(`export { ${data.blueprintInstance_PascalCaseFormat} } from './${data.blueprintInstance_PascalCaseFormat}'`)
    .apply()
    .save()

  log.success(`Updated index.ts`)
  return Promise.resolve()
}
```

Register it in `blueprint.json`:
```json
{
  "postGenerate": ["scripts/postGenerate.mjs"]
}
```

---

## Dry-Run Before Generating

Preview exactly which files would be written before committing to disk:

```bash
bp generate component Button --dry-run --json
```

```json
{
  "dryRun": true,
  "destination": "/current/dir",
  "files": [
    {
      "path": "/current/dir/Button/Button.tsx",
      "content": "import styles from './Button.module.css'\n..."
    },
    {
      "path": "/current/dir/Button/Button.test.tsx",
      "content": "import { Button } from './Button'\n..."
    },
    {
      "path": "/current/dir/Button/index.ts",
      "content": "export { Button } from './Button'\n..."
    }
  ]
}
```

---

## Importing a Global Blueprint into a Project

Share a blueprint from your global store into a specific project, where it can be customized independently:

```bash
bp import component my-component
```

This copies `~/.blueprints/component` to `.blueprints/my-component` in the current project.
