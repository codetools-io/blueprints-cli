import path from 'path'
import fs from 'fs-extra'
import { log } from '../../utilities.mjs'

export default async function initialize(projectPath, command) {
  try {
    log.clear()
    log.jsonMode = this.optsWithGlobals().json

    const projectBlueprintsPath = projectPath
      ? path.resolve(projectPath, './.blueprints')
      : path.resolve('./.blueprints')

    await fs.ensureDir(projectBlueprintsPath)

    if (log.jsonMode) {
      log.json({ success: true, location: projectBlueprintsPath })
    } else {
      log.success(`Project initialized. Blueprints can now be added to ${projectBlueprintsPath}`)
    }

    this.output = log.output()
  } catch (err) {
    this.output = log.error(err)
  }
}
