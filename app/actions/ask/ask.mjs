import path from 'path'
import fs from 'fs-extra'
import Bot from '../../lib/Bot/index.mjs'
import { getBlueprintPath, getMetadata, getTemplateData, log } from '../../utilities.mjs'
import { CURRENT_PATH } from '../../config.mjs'

export default async function ask(blueprintName, blueprintInstance, command) {
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

    const bot = new Bot({
      name: blueprintName,
      location,
    })

    await bot.ask({
      destination,
      data: {
        ...data,
        ...metadata,
      },
    })

    this.output = log.output()
  } catch (error) {
    log.error(error)
  }
}
