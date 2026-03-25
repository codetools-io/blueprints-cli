import { getAllBlueprints } from './getAllBlueprints.mjs'
import { log } from '../../utilities.mjs'

export default async function list(namespace = '', options) {
  try {
    log.clear()
    log.jsonMode = this.optsWithGlobals().json

    const blueprints = await getAllBlueprints(namespace)

    if (log.jsonMode) {
      log.json({
        global: blueprints.global.map((bp) => ({ name: bp.name, location: bp.location })),
        project: blueprints.project.map((bp) => ({ name: bp.name, location: bp.location })),
      })
    } else {
      log.text(`--- Global Blueprints ---`)
      if (blueprints.global && blueprints.global.length) {
        blueprints.global.forEach((blueprint) => {
          log.text(`\n${blueprint.name} - ${blueprint.location}`)
          if (options.long && blueprint.config.description) {
            log.text(`  Description: ${blueprint.config.description}`)
          }
        })
      } else {
        log.text(`no global blueprints found`)
      }

      log.text(`\n--- Project Blueprints ---`)
      if (blueprints.project && blueprints.project.length) {
        blueprints.project.forEach((blueprint) => {
          log.text(`\n${blueprint.name} - ${blueprint.location}`)
          if (options.long && blueprint.config.description) {
            log.text(`  Description: ${blueprint.config.description}`)
          }
        })
      } else {
        log.text(`no project blueprints found`)
      }
    }

    this.output = log.output()
  } catch (err) {
    log.error(err)
  }
}
