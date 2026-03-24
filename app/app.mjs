import { Command } from 'commander'
import pkg from './pkg.mjs'
import create from './actions/create/index.mjs'
import generate from './actions/generate/index.mjs'
import _import from './actions/import/index.mjs'
import initialize from './actions/initialize/index.mjs'
import list from './actions/list/index.mjs'
import remove from './actions/remove/index.mjs'
import help from './actions/help/index.mjs'
import ask from './actions/ask/index.mjs'

const app = new Command()

app.name(pkg.name).description(pkg.description).version(pkg.version)

app
  .command('ask')
  .description('generate files with a blueprint processed by AI')
  .argument('<blueprint>', 'name of the blueprint to use')
  .argument('<blueprintInstance>', 'name of the blueprint instance to create')
  .option('-d, --dest <destination>', 'which directory to place the files')
  .option('-m, --model <model>', 'AI model to use', 'gpt-4o-mini')
  .alias('a')
  .action(ask)

app
  .command('generate')
  .description('generate files with a blueprint')
  .argument('<blueprint>', 'name of the blueprint to use')
  .argument('<blueprintInstance>', 'name of the blueprint instance to create')
  .option('-d, --dest <destination>', 'which directory to place the files')
  .alias('g')
  .action(generate)

app
  .command('list')
  .description('list all available blueprints')
  .alias('ls')
  .argument('[namespace]', 'namespace of the blueprints to show')
  .option('-l, --long', 'shows more detail about the blueprints', false)
  .action(list)

app
  .command('new')
  .description('create a blueprint')
  .argument('<blueprint>', 'name of blueprint to create')
  .option('-g, --global', 'creates the blueprint globally', false)
  .option(
    '-s, --source [sourcePath]',
    'Path to use for initial blueprint files',
    false
  )
  .action(create)

app
  .command('import')
  .description('create a project blueprint based on a global blueprint')
  .argument('<globalBlueprint>', 'name of the global blueprint to use')
  .argument('<localBlueprint>', 'name of the project blueprint create')
  .action(_import)

app
  .command('init')
  .description('initialize a local blueprints project')
  .argument('[projectPath]', 'path where blueprints should be initialized')
  .action(initialize)

app
  .command('remove')
  .description('removes a blueprint')
  .alias('rm')
  .argument('<blueprint>', 'name of the blueprint to remove')
  .option('-g, --global', 'Removes the global blueprint')
  .action(remove)

app.on('--help', help)

export default app
