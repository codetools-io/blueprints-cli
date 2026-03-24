import path from 'path'
import fs from 'fs-extra'
import { PromptTemplate } from '@langchain/core/prompts'
import { z } from 'zod'
import { loadMergedModelRegistry } from '../llm/modelsConfig.mjs'
import { resolveModelSelection } from '../llm/resolveModel.mjs'
import { createStructuredChatModel } from '../llm/createStructuredChatModel.mjs'
import _ from 'lodash'
import date from 'date-fns'
import { parse } from 'yaml'
const { merge } = _
import File from '../../lib/File/index.mjs'
import { getAbsolutePaths, log, scaffold } from '../../utilities.mjs'

class Blueprint {
  constructor({ name, location, source }) {
    this.name = name
    this.location = location
    this.source = source
    this.filesPath = path.resolve(location, './files')
    this.filesContent = {}
    this.prompts = []
    this.config = {
      preGenerate: [],
      postGenerate: [],
      data: {},
      prompts: [],
    }
  }

  async loadConfigFile() {
    try {
      const configPath = path.resolve(this.location, './blueprint.json')

      if (fs.pathExistsSync(configPath)) {
        const configFile = await fs.readJson(configPath)

        this.config = merge({}, this.config, configFile)

        return this.config
      } else {
        throw new Error('Blueprint config not found')
      }
    } catch (err) {
      log.output()
      log.error(err.message)

      throw err
    }
  }

  async loadFilesContent() {
    try {
      const filePaths = await getAbsolutePaths(`${this.filesPath}/**/*`)
      const fileContents = {}

      for (const filePath of filePaths) {
        const stats = await fs.stat(filePath)

        if (stats.isFile()) {
          const content = await fs.readFile(filePath, 'utf8')
          const key = filePath.replace(`${this.filesPath}/`, '')
          fileContents[key] = content
        }
      }
      this.filesContent = fileContents

      return this.filesContent
    } catch (err) {
      log.output()
      log.error(err.message)

      throw err
    }
  }

  remove() {
    if (!this.name) {
      throw new Error('No name specified')
    }
    if (!this.location) {
      throw new Error('No location specified')
    }
    if (!fs.statSync(this.location).isDirectory()) {
      throw new Error('Blueprint not found')
    }
    return fs
      .remove(this.location)
      .then(() => {
        return this
      })
      .catch((err) => {
        throw err
      })
  }

  async create(options) {
    if (!this.source) {
      throw new Error('No source specified')
    }
    if (!this.location) {
      throw new Error('No location specified')
    }
    try {
      await fs.ensureDir(this.location)
      const result = await scaffold({
        source: this.source,
        destination: this.filesPath,
        onlyFiles: false,
        data: {},
      })
      return result
    } catch (err) {
      throw err
    }
  }

  async executeHook({ name, destination, data = {} }) {
    const mergedData = merge({}, this.config.data, data)
    const commands = this.config[name].map((configCommand) => {
      let command = configCommand
      command = command.replace('<blueprintName>', mergedData.blueprint)
      command = command.replace('<blueprintPath>', this.location)
      command = command.replace('<instanceName>', mergedData.blueprintInstance)
      command = command.replace('<instancePath>', path.resolve(destination, mergedData.blueprintInstance))
      return command
    })
    const hookModules = await Promise.allSettled(
      commands.map((command) => {
        const hook = import(path.resolve(this.location, command))

        return hook
      })
    )
    const hookFns = hookModules?.map((hookModule) => hookModule?.value?.default).filter((hookModule) => hookModule)
    const hookResults = await Promise.allSettled(
      hookFns?.map?.((hookFn) => {
        return hookFn(mergedData, { _, fs, date, File, log })
      })
    )
    log.success(`executed ${name} hook`)
    return hookResults
  }

  async preGenerate({ destination, data = {} }) {
    const result = await this.executeHook({
      name: 'preGenerate',
      destination,
      data,
    })
    return Promise.resolve(result)
  }

  async postGenerate({ destination, data = {} }) {
    const result = await this.executeHook({
      name: 'postGenerate',
      destination,
      data,
    })
    return Promise.resolve(result)
  }

  async generate({ destination, data = {}, mode = 'scaffold', modelId, cliModelWasExplicit = false }) {
    if (mode !== 'scaffold' && mode !== 'ai') {
      throw new Error(`Invalid generate mode: ${mode}`)
    }
    const generateFn = mode === 'ai' ? 'generateWithAI' : 'generateWithScaffold'

    await this.loadConfigFile()
    await this.loadFilesContent()
    await this.preGenerate({ destination, data })
    await this[generateFn]({ destination, data, modelId, cliModelWasExplicit })
    await this.postGenerate({ destination, data })
  }

  async generateWithScaffold({ destination, data = {} }) {
    try {
      if (!destination) {
        throw new Error('no destination given for blueprint instance')
      }

      if (!fs.pathExistsSync(this.filesPath)) {
        throw new Error('blueprint does not exist')
      }
      const mergedData = merge({}, this.config.data, data)

      await fs.ensureDir(destination)

      await scaffold({ source: this.filesPath, destination, onlyFiles: false, data: mergedData })

      log.success(`generated instance`)

      return Promise.resolve({ type: this.name, location: destination, data })
    } catch (err) {
      throw err
    }
  }

  async generateWithAI({ destination, data = {}, modelId, cliModelWasExplicit = false }) {
    if (!destination) {
      throw new Error('no destination given for blueprint instance')
    }

    if (!fs.pathExistsSync(this.filesPath)) {
      throw new Error('blueprint does not exist')
    }

    await this.loadConfigFile()
    await this.loadFilesContent()
    await this.loadPrompts()

    const mergedData = merge({}, this.config.data, data)

    const { entries, defaultModelId } = await loadMergedModelRegistry()
    const spec = resolveModelSelection({
      cliModelId: modelId,
      cliModelWasExplicit,
      entries,
      fileDefaultModelId: defaultModelId,
      blueprintModelId: this.config.model,
    })

    const ResponseFormat = z.object({
      destination: z.string().describe('base location for where files will be created'),
      files: z
        .object({
          path: z.string().describe('location of the file relative to the destination'),
          content: z.string().describe('content of the file'),
        })
        .array()
        .describe('files to be created'),
    })

    const templates = Object.entries(this.filesContent).map(([fileName, fileContent]) => {
      return `template_name: ${fileName}\n\ntemplate_content:\n${fileContent}\n\n`
    })

    const promptInputs = {
      format_instructions:
        'Respond with structured data matching the enforced schema (files with path and content, and destination).',
      template_variables: JSON.stringify(mergedData),
      templates,
    }

    const promptParts = []
    for (const fragment of this.prompts) {
      const inputVariables = fragment.meta?.input_variables ?? []
      const pt = new PromptTemplate({
        template: fragment.template,
        inputVariables,
      })
      promptParts.push(await pt.format(promptInputs))
    }
    const userPrompt = promptParts.join('\n\n')

    const structuredModel = await createStructuredChatModel(spec, ResponseFormat)

    const writeFiles = async (files) => {
      await Promise.all(
        files.map((file) => {
          const target = path.isAbsolute(file.path) ? file.path : path.join(destination, file.path)
          return fs.outputFile(target, file.content)
        })
      )
    }

    const result = await structuredModel.invoke(userPrompt)
    await writeFiles(result.files)

    log.success(`generated instance with AI`)

    return Promise.resolve({ type: this.name, location: destination, data })
  }

  async loadPromptFile(filepath) {
    try {
      const file = await fs.readFile(filepath, 'utf-8')
      const frontmatterRegex = /^---\n([\s\S]*?)\n---/
      const match = file.match(frontmatterRegex)

      if (match) {
        const frontmatter = match[1]
        const template = file.slice(match[0].length).trim()

        // Parse the YAML frontmatter
        const meta = parse(frontmatter)
        const prompt = { meta, template }
        this.prompts.push(prompt)

        return prompt
      }

      // If no frontmatter is found, return empty settings and the whole file as template
      return { meta: {}, template: file }
    } catch (err) {
      log.error(err)
      throw err
    }
  }

  async loadPrompts() {
    try {
      const filePaths = this.config.prompts.map((prompt) => {
        return path.resolve(this.location, prompt)
      })

      for (const filePath of filePaths) {
        const stats = await fs.stat(filePath)

        if (stats.isFile()) {
          await this.loadPromptFile(filePath)
        }
      }

      return this.prompts
    } catch (err) {
      log.output()
      log.error(err.message)

      throw err
    }
  }
}

export default Blueprint
