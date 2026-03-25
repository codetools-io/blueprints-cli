import createFromDirectory from './lib/createFromDirectory.mjs'
import createBlank from './lib/createBlank.mjs'
import { log } from '../../utilities.mjs'

export default async function create(blueprintName, command) {
  try {
    log.clear()
    log.jsonMode = this.optsWithGlobals().json

    const result = command.source
      ? await createFromDirectory(blueprintName, command)
      : await createBlank(blueprintName, command)

    if (log.jsonMode) {
      log.json({ success: true, blueprint: blueprintName, location: result.location })
    } else {
      log.success(result.message)
    }

    this.output = log.output()
  } catch (err) {
    this.output = log.error(err)
  }
}
