import path from 'path'
import Blueprint from '../../lib/Blueprint/index.mjs'
import { log } from '../../utilities.mjs'

import {
  PROJECT_BLUEPRINTS_PATH,
  GLOBAL_BLUEPRINTS_PATH,
} from '../../config.mjs'

export default async function remove(blueprintName, options) {
  try {
    log.clear()
    log.jsonMode = this.optsWithGlobals().json

    const isGlobal = options.global || false
    const globalLocation = path.resolve(GLOBAL_BLUEPRINTS_PATH, blueprintName)
    const projectLocation = path.resolve(PROJECT_BLUEPRINTS_PATH, blueprintName)
    const location = isGlobal ? globalLocation : projectLocation

    const blueprint = new Blueprint({
      name: blueprintName,
      location: location,
    })

    await blueprint.remove()

    if (log.jsonMode) {
      log.json({ success: true, blueprint: blueprintName, location })
    } else {
      log.success(`${blueprintName} was removed from: ${location}`)
    }

    this.output = log.output()
  } catch (err) {
    this.output = log.error(err)
  }
}
