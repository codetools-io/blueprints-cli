const path = require('path')
const fs = require('fs-extra')
const getMetadata = require('../../utils/getMetadata')
const getTemplateData = require('../../utils/getTemplateData')
const Blueprint = require('../../lib/Blueprint')
const log = require('../../utils/log')

const {
  CURRENT_PATH,
  PROJECT_BLUEPRINTS_PATH,
  GLOBAL_BLUEPRINTS_PATH,
} = require('../../config')

module.exports = async function generate(
  blueprintName,
  blueprintInstance,
  command
) {
  try {
    log.clear()
    const destination = command.dest || CURRENT_PATH
    const data = getTemplateData(command.args.slice(2))
    const metadata = getMetadata({
      blueprint: blueprintName,
      blueprintInstance,
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

    await blueprint.preGenerate({
      destination,
      data: {
        ...data,
        ...metadata,
      },
    })
    await blueprint.generate({
      destination,
      data: {
        ...data,
        ...metadata,
      },
    })
    await blueprint.postGenerate({
      destination,
      data: {
        ...data,
        ...metadata,
      },
    })

    log(
      `Generated ${blueprintInstance} based on the ${blueprintName} blueprint`
    )
    this.output = log.output()

    return log.output()

    function getBlueprintPath(name) {
      const globalBlueprintPath = path.resolve(
        GLOBAL_BLUEPRINTS_PATH,
        `./${name}`
      )
      const projectBlueprintPath = path.resolve(
        PROJECT_BLUEPRINTS_PATH,
        `./${name}`
      )

      if (fs.pathExistsSync(projectBlueprintPath)) {
        return projectBlueprintPath
      }

      if (fs.pathExistsSync(globalBlueprintPath)) {
        return globalBlueprintPath
      }

      return null
    }
  } catch (error) {
    log.error(error)
  }
}
