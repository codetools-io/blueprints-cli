import Blueprint from '../../lib/Blueprint/index.mjs'
import { getBlueprintPath, getMetadata, getTemplateData, log } from '../../utilities.mjs'

import { CURRENT_PATH } from '../../config.mjs'

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
      mode: 'scaffold',
    })

    this.output = log.output()

    process.exit(0)
  } catch (error) {
    log.error(error)
    console.log(error)
    process.exit(1)
  }
}
