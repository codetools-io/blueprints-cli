import Blueprint from '../../lib/Blueprint/index.mjs'
import { getBlueprintPath, getMetadata, getTemplateData, log } from '../../utilities.mjs'
import { BlueprintError, CODES } from '../../errors.mjs'

import { CURRENT_PATH } from '../../config.mjs'

export default async function generate(blueprintName, blueprintInstance, command) {
  try {
    log.clear()
    log.jsonMode = this.optsWithGlobals().json

    const destination = command?.dest || CURRENT_PATH
    const dryRun = command?.dryRun || false
    const data = getTemplateData(this.args.slice(2))
    const metadata = getMetadata({
      blueprint: blueprintName,
      blueprintInstance,
      destination,
    })
    const location = getBlueprintPath(blueprintName)

    if (!location) {
      log.error(new BlueprintError('Blueprint not found', CODES.BLUEPRINT_NOT_FOUND))
      return
    }

    const blueprint = new Blueprint({
      name: blueprintName,
      location,
    })

    const result = await blueprint.generate({
      destination,
      data: {
        ...data,
        ...metadata,
      },
      mode: 'scaffold',
      dryRun,
    })

    if (log.jsonMode) {
      if (dryRun) {
        log.json(result)
      } else {
        log.json({ success: true, blueprint: blueprintName, instance: blueprintInstance, destination })
      }
    }

    this.output = log.output()

    process.exit(0)
  } catch (error) {
    log.error(error)
    process.exit(1)
  }
}
