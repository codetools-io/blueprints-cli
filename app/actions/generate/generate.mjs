import path from 'path'
import fs from 'fs-extra'
import Blueprint from '../../lib/Blueprint/index.mjs'
import { getMetadata, getTemplateData, log } from '../../utilities.mjs'

import { CURRENT_PATH, PROJECT_BLUEPRINTS_PATH, GLOBAL_BLUEPRINTS_PATH } from '../../config.mjs'

function getBlueprintPath(name) {
  const globalBlueprintPath = path.resolve(GLOBAL_BLUEPRINTS_PATH, `./${name}`)
  const projectBlueprintPath = path.resolve(PROJECT_BLUEPRINTS_PATH, `./${name}`)

  if (fs.pathExistsSync(projectBlueprintPath)) {
    return projectBlueprintPath
  }

  if (fs.pathExistsSync(globalBlueprintPath)) {
    return globalBlueprintPath
  }

  return null
}

export default async function generate(blueprintName, blueprintInstance, command) {
  try {
    log.clear()
    const destination = command?.dest || CURRENT_PATH
    const data = getTemplateData(this.args.slice(2))
    const metadata = getMetadata({
      blueprint: blueprintName,
      blueprintInstance,
      destination,
    })
    const location = getBlueprintPath(blueprintName)

    if (!location) {
      log.error('Blueprint not found')
      return
    }

    const blueprint = new Blueprint({
      name: blueprintName,
      location,
    })

    await blueprint.generate({
      destination,
      data: {
        ...data,
        ...metadata,
      },
      ai: false,
    })

    this.output = log.output()

    process.exit(0)
  } catch (error) {
    log.error(error)
    console.log(error)
    process.exit(1)
  }
}
