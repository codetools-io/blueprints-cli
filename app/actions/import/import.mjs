import path from 'path'
import fs from 'fs-extra'
import Blueprint from '../../lib/Blueprint/index.mjs'
import { log } from '../../utilities.mjs'
import { BlueprintError, CODES } from '../../errors.mjs'

import {
  PROJECT_BLUEPRINTS_PATH,
  GLOBAL_BLUEPRINTS_PATH,
} from '../../config.mjs'

export default async function _import(
  globalBlueprintName,
  localBlueprintName,
  options
) {
  try {
    log.clear()
    log.jsonMode = this.optsWithGlobals().json

    const blueprintName = localBlueprintName || globalBlueprintName
    const source = path.resolve(GLOBAL_BLUEPRINTS_PATH, globalBlueprintName)
    const location = path.resolve(PROJECT_BLUEPRINTS_PATH, `${blueprintName}`)

    if (!fs.pathExistsSync(source)) {
      log.error(new BlueprintError(`Global blueprint "${globalBlueprintName}" does not exist`, CODES.INVALID_SOURCE))
      return
    }

    const blueprint = new Blueprint({
      name: blueprintName,
      source,
      location,
    })

    await blueprint.create()

    if (log.jsonMode) {
      log.json({ success: true, blueprint: globalBlueprintName, location })
    } else {
      log.success(`${globalBlueprintName} was imported to ${location}`)
    }

    this.output = log.output()
  } catch (err) {
    this.output = log.error(err)
  }
}
