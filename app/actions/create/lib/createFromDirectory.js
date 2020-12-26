const path = require('path')
const fs = require('fs-extra')

const {
  CURRENT_PATH,
  PROJECT_BLUEPRINTS_PATH,
  GLOBAL_BLUEPRINTS_PATH,
} = require('../../../config')

module.exports = function createFromDirectory(blueprintName, command) {
  const isGlobal = command.global || false
  const source = command.source.length
    ? path.resolve(command.source)
    : CURRENT_PATH
  const globalLocation = path.resolve(GLOBAL_BLUEPRINTS_PATH, blueprintName)
  const projectLocation = path.resolve(PROJECT_BLUEPRINTS_PATH, blueprintName)
  const location = isGlobal ? globalLocation : projectLocation

  if (fs.pathExistsSync(location)) {
    throw new Error(`A blueprint called ${blueprintName} already exists`)
  }

  return Promise.all([
    fs.outputJson(path.resolve(location, './blueprint.json'), {}, { space: 2 }),
    fs.copy(source, path.resolve(location, './files/__blueprintInstance__')),
  ])
    .then(() => {
      console.log(`${blueprintName} was created at: ${location}`)
    })
    .catch((err) => {
      console.error(err)
      fs.remove(path.resolve(location)).catch((rmError) => {
        console.error(rmError)
      })
    })
}
