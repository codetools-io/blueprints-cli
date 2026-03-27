import path from 'path'
import fs from 'fs-extra'
import { log } from '../../utilities.mjs'

async function readTemplate(filename) {
  const url = new URL(`./templates/${filename}`, import.meta.url)
  return fs.readFile(url, 'utf-8')
}

async function writeIfAbsent(filePath, content) {
  const exists = await fs.pathExists(filePath)
  if (exists) return 'skipped'
  await fs.outputFile(filePath, content)
  return 'created'
}

const SHARED_DESCRIPTION =
  'Use blueprints-cli to generate files from templates instead of writing boilerplate. ' +
  'Reduces token usage. Activate when creating files that match a repeatable pattern ' +
  '(component, service, module, page, etc.) or when managing blueprint templates.'

const COMPATIBILITY = 'Requires blueprints-cli (bp). MCP server recommended for best results.'

const AGENTS_FRONTMATTER = `---
name: blueprints
description: ${SHARED_DESCRIPTION}
compatibility: ${COMPATIBILITY}
---

`

const CLAUDE_FRONTMATTER = `---
name: blueprints
description: ${SHARED_DESCRIPTION}
compatibility: ${COMPATIBILITY}
allowed-tools: mcp__blueprints__list_blueprints mcp__blueprints__info_blueprint mcp__blueprints__generate_blueprint mcp__blueprints__create_blueprint Bash
---

`

export default async function initialize(projectPath, command) {
  try {
    log.clear()
    log.jsonMode = this.optsWithGlobals().json

    const projectBlueprintsPath = projectPath
      ? path.resolve(projectPath, './.blueprints')
      : path.resolve('./.blueprints')

    const projectRoot = path.resolve(projectBlueprintsPath, '../')

    await fs.ensureDir(projectBlueprintsPath)

    const [blueprintsReadme, skillBody, templateVariablesRef] = await Promise.all([
      readTemplate('blueprints-readme.md'),
      readTemplate('skill.md'),
      readTemplate('references/template-variables.md'),
    ])

    const agentFiles = [
      {
        filePath: path.resolve(projectBlueprintsPath, 'README.md'),
        content: blueprintsReadme,
      },
      {
        filePath: path.resolve(projectRoot, '.agents/skills/blueprints/SKILL.md'),
        content: AGENTS_FRONTMATTER + skillBody,
      },
      {
        filePath: path.resolve(projectRoot, '.agents/skills/blueprints/references/template-variables.md'),
        content: templateVariablesRef,
      },
      {
        filePath: path.resolve(projectRoot, '.claude/skills/blueprints/SKILL.md'),
        content: CLAUDE_FRONTMATTER + skillBody,
      },
      {
        filePath: path.resolve(projectRoot, '.claude/skills/blueprints/references/template-variables.md'),
        content: templateVariablesRef,
      },
      {
        filePath: path.resolve(projectRoot, 'AGENTS.md'),
        content: skillBody,
      },
    ]

    const results = await Promise.all(
      agentFiles.map(async ({ filePath, content }) => ({
        file: filePath,
        status: await writeIfAbsent(filePath, content),
      }))
    )

    if (log.jsonMode) {
      log.json({ success: true, location: projectBlueprintsPath, files: results })
    } else {
      log.success(`Project initialized. Blueprints can now be added to ${projectBlueprintsPath}`)
      results.forEach(({ file, status }) => {
        if (status === 'created') log.text(`  created  ${file}`)
        else log.text(`  skipped  ${file} (already exists)`)
      })
    }

    this.output = log.output()
  } catch (err) {
    this.output = log.error(err)
  }
}
