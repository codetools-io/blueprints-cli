const path = require('path')
const fs = require('fs-extra')
const { PROJECT_ROOT_PATH, GLOBAL_BLUEPRINTS_PATH } = require('../../../config')
const DEFAULT_SCRIPT = `
module.exports = function(data, libraries) {
  // fs docs: https://github.com/jprichardson/node-fs-extra
  // _ docs: https://lodash.com/docs
  // date docs: https://date-fns.org

  const {_, fs, date} = libraries;

  // ...code to execute
}
`

module.exports = async function createBlank(blueprintName, options = {}) {
  let blueprintPath

  try {
    if (!blueprintName) {
      throw new Error('requires a name')
    }

    blueprintPath = options.global
      ? path.resolve(GLOBAL_BLUEPRINTS_PATH, blueprintName)
      : path.resolve(PROJECT_ROOT_PATH, `./.blueprints/${blueprintName}`)

    if (fs.pathExistsSync(blueprintPath)) {
      throw new Error(`A blueprint named ${blueprintName} already exists`)
    }

    await fs.ensureDir(
      path.resolve(blueprintPath, './files/__blueprintInstance__')
    )
    await fs.outputFile(
      path.resolve(blueprintPath, './scripts/preGenerate.js'),
      DEFAULT_SCRIPT.trim()
    )
    await fs.outputFile(
      path.resolve(blueprintPath, './scripts/postGenerate.js'),
      DEFAULT_SCRIPT.trim()
    )
    await fs.outputJson(
      path.resolve(blueprintPath, './blueprint.json'),
      {
        preGenerate: ['scripts/preGenerate.js'],
        postGenerate: ['scripts/postGenerate.js'],
      },
      { spaces: 2 }
    )

    return {
      success: true,
      message: `${blueprintName} was created at ${blueprintPath}`,
    }
  } catch (error) {
    throw error
  }
}
