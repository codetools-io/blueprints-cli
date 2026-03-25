#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import Blueprint from '../app/lib/Blueprint/index.mjs'
import { getBlueprintPath, getMetadata } from '../app/utilities.mjs'
import { getAllBlueprints } from '../app/actions/list/getAllBlueprints.mjs'
import { getInfoResult } from '../app/actions/info/info.mjs'
import createBlank from '../app/actions/create/lib/createBlank.mjs'
import createFromDirectory from '../app/actions/create/lib/createFromDirectory.mjs'
import { CURRENT_PATH } from '../app/config.mjs'

const server = new McpServer({
  name: 'blueprints-cli',
  version: '1.0.0',
})

server.tool(
  'list_blueprints',
  'List all available blueprints, optionally filtered by namespace',
  { namespace: z.string().optional().describe('Optional namespace prefix to filter blueprints') },
  async ({ namespace = '' }) => {
    const blueprints = await getAllBlueprints(namespace)
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            global: blueprints.global.map((bp) => ({ name: bp.name, location: bp.location })),
            project: blueprints.project.map((bp) => ({ name: bp.name, location: bp.location })),
          }),
        },
      ],
    }
  }
)

server.tool(
  'info_blueprint',
  'Inspect a blueprint and get its required variables, hooks, and configuration',
  { blueprint: z.string().describe('Name of the blueprint to inspect') },
  async ({ blueprint }) => {
    const result = await getInfoResult(blueprint)
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    }
  }
)

server.tool(
  'generate_blueprint',
  'Generate files from a blueprint template',
  {
    blueprint: z.string().describe('Name of the blueprint to use'),
    instance: z.string().describe('Name for the generated instance'),
    destination: z.string().optional().describe('Directory to place the generated files'),
    data: z.record(z.string()).optional().describe('Template variables as key-value pairs'),
    dryRun: z.boolean().optional().describe('Preview files without writing to disk'),
  },
  async ({ blueprint, instance, destination, data = {}, dryRun = false }) => {
    const location = getBlueprintPath(blueprint)
    if (!location) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: { code: 'BLUEPRINT_NOT_FOUND', message: `Blueprint "${blueprint}" not found` } }),
          },
        ],
        isError: true,
      }
    }

    const dest = destination || CURRENT_PATH
    const metadata = getMetadata({ blueprint, blueprintInstance: instance, destination: dest })
    const mergedData = { ...data, ...metadata }

    const bp = new Blueprint({ name: blueprint, location })
    const result = await bp.generate({
      destination: dest,
      data: mergedData,
      mode: 'scaffold',
      dryRun,
    })

    const output = dryRun
      ? result
      : { success: true, blueprint, instance, destination: dest }

    return {
      content: [{ type: 'text', text: JSON.stringify(output) }],
    }
  }
)

server.tool(
  'create_blueprint',
  'Create a new blueprint template',
  {
    name: z.string().describe('Name for the new blueprint'),
    global: z.boolean().optional().describe('Create blueprint globally (default: false)'),
    source: z.string().optional().describe('Directory to use as initial blueprint files'),
  },
  async ({ name, global: isGlobal = false, source }) => {
    const command = { global: isGlobal, source: source || false }
    const result = source
      ? await createFromDirectory(name, command)
      : await createBlank(name, command)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, blueprint: name, location: result.location }),
        },
      ],
    }
  }
)

const transport = new StdioServerTransport()
await server.connect(transport)
