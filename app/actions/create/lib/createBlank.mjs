import path from 'path'
import fs from 'fs-extra'
import { PROJECT_ROOT_PATH, GLOBAL_BLUEPRINTS_PATH } from '../../../config.mjs'
import { BlueprintError, CODES } from '../../../errors.mjs'
const DEFAULT_SCRIPT = `
export default async function(data, libraries) {
  // fs docs: https://github.com/jprichardson/node-fs-extra
  // _ docs: https://lodash.com/docs
  // date docs: https://date-fns.org

  const {_, fs, date, File, log} = libraries;

  // ...code to execute

  // must return Promise
  const result = await Promise.resolve(true);
  return result;
}
`
const DEFAULT_PROMPT = `
---
input_variables:
  - template_variables
  - templates
  - format_instructions
---
You are a file generator called a blueprint. You will generate files using the provided templates and template variables.

{format_instructions}

template_variables:
{template_variables}

templates:
{templates}

`

export default async function createBlank(blueprintName, options = {}) {
  let blueprintPath

  try {
    if (!blueprintName) {
      throw new Error('requires a name')
    }

    blueprintPath = options.global
      ? path.resolve(GLOBAL_BLUEPRINTS_PATH, blueprintName)
      : path.resolve(PROJECT_ROOT_PATH, `./.blueprints/${blueprintName}`)

    if (fs.pathExistsSync(blueprintPath)) {
      throw new BlueprintError(`A blueprint named ${blueprintName} already exists`, CODES.BLUEPRINT_ALREADY_EXISTS)
    }

    await fs.ensureDir(
      path.resolve(blueprintPath, './files/__blueprintInstance__')
    )
    await fs.ensureDir(path.resolve(blueprintPath, './prompts/'))
    await fs.outputFile(
      path.resolve(blueprintPath, './scripts/preGenerate.mjs'),
      DEFAULT_SCRIPT.trim()
    )
    await fs.outputFile(
      path.resolve(blueprintPath, './scripts/postGenerate.mjs'),
      DEFAULT_SCRIPT.trim()
    )
    await fs.outputFile(
      path.resolve(blueprintPath, './prompts/default.md'),
      DEFAULT_PROMPT.trim()
    )
    await fs.outputJson(
      path.resolve(blueprintPath, './blueprint.json'),
      {
        preGenerate: ['scripts/preGenerate.mjs'],
        postGenerate: ['scripts/postGenerate.mjs'],
        prompts: ['prompts/default.md'],
      },
      { spaces: 2 }
    )

    return {
      success: true,
      message: `${blueprintName} was created at ${blueprintPath}`,
      location: blueprintPath,
    }
  } catch (error) {
    throw error
  }
}
