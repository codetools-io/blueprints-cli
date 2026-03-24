import Table from 'cli-table3'
import {
  loadMergedModelRegistry,
  getGlobalModelsPath,
  getProjectModelsPath,
} from '../../lib/llm/modelsConfig.mjs'
import { log } from '../../utilities.mjs'

export default async function modelsCommand() {
  log.clear()
  const { entries, defaultModelId } = await loadMergedModelRegistry()
  const sorted = [...entries].sort((a, b) => a.id.localeCompare(b.id))

  const table = new Table({
    head: ['id', 'provider', 'model', 'label'],
    wordWrap: true,
  })

  for (const m of sorted) {
    const mark = m.id === defaultModelId ? ' *' : ''
    table.push([`${m.id}${mark}`, m.provider, m.model, m.label || '—'])
  }

  log.text('Configured models (* = default when no -m, BP_MODEL, blueprint.json model, or OPENAI_MODEL):')
  log.text(table.toString())
  log.text('')
  log.text(`Global config: ${getGlobalModelsPath()}`)
  log.text(`Project config: ${getProjectModelsPath() || '(no project .blueprints)'}`)
  this.output = log.output()
}
