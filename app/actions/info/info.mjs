import fs from 'fs-extra'
import Blueprint from '../../lib/Blueprint/index.mjs'
import { getBlueprintPath, getAbsolutePaths, getMetadata, log } from '../../utilities.mjs'
import { BlueprintError, CODES } from '../../errors.mjs'

const FILENAME_REGEX = /__([A-Za-z0-9_-]+_?[A-Za-z0-9-]+)+__/g
const CONTENT_REGEX = /\{\{\s?([A-Za-z0-9_-]+_?[A-Za-z0-9-]+)+\s?\}\}/g

const AUTO_GENERATED_KEYS = new Set(
  Object.keys(getMetadata({ blueprint: '', blueprintInstance: '', destination: '' }))
)

export async function getInfoResult(blueprintName) {
  const location = getBlueprintPath(blueprintName)

  if (!location) {
    throw new BlueprintError(`Blueprint "${blueprintName}" not found`, CODES.BLUEPRINT_NOT_FOUND)
  }

  const blueprint = new Blueprint({ name: blueprintName, location })
  await blueprint.loadConfigFile()

  const allFiles = await getAbsolutePaths('**/*', {
    cwd: blueprint.filesPath,
    dot: true,
  })

  const foundVars = new Set()

  for (const absPath of allFiles) {
    const stat = await fs.stat(absPath)
    if (stat.isDirectory()) continue

    const relPath = absPath.replace(blueprint.filesPath, '')

    for (const match of relPath.matchAll(FILENAME_REGEX)) {
      foundVars.add(match[1])
    }

    const content = await fs.readFile(absPath, 'utf-8')
    for (const match of content.matchAll(CONTENT_REGEX)) {
      foundVars.add(match[1].trim())
    }
  }

  const userVars = [...foundVars].filter((v) => !AUTO_GENERATED_KEYS.has(v))

  const requiredVariables = userVars.map((name) => ({
    name,
    default: blueprint.config.data?.[name] ?? null,
  }))

  return {
    name: blueprintName,
    location,
    hooks: {
      preGenerate: blueprint.config.preGenerate ?? [],
      postGenerate: blueprint.config.postGenerate ?? [],
    },
    requiredVariables,
  }
}

export default async function info(blueprintName) {
  try {
    log.clear()
    log.jsonMode = this.optsWithGlobals().json

    const result = await getInfoResult(blueprintName)

    if (log.jsonMode) {
      log.json(result)
    } else {
      log.text(`Blueprint: ${result.name}`)
      log.text(`Location: ${result.location}`)
      if (result.hooks.preGenerate.length || result.hooks.postGenerate.length) {
        const hookNames = [
          ...result.hooks.preGenerate.map(() => 'preGenerate'),
          ...result.hooks.postGenerate.map(() => 'postGenerate'),
        ]
        log.text(`Hooks: ${[...new Set(hookNames)].join(', ')}`)
      }
      if (result.requiredVariables.length) {
        log.text('Required variables:')
        result.requiredVariables.forEach(({ name, default: def }) => {
          log.text(`  - ${name}${def !== null ? ` (default: "${def}")` : ' (no default)'}`)
        })
      } else {
        log.text('Required variables: none')
      }
    }

    this.output = log.output()
  } catch (err) {
    this.output = log.error(err)
  }
}
