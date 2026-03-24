import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const CURRENT_PATH = path.resolve(__dirname, '../../test/fixtures/project-example')
const CURRENT_DIRNAME = path.basename(CURRENT_PATH)
const PROJECT_BLUEPRINTS_PATH = path.resolve(
  __dirname,
  '../../test/fixtures/project-example/.blueprints'
)
const PROJECT_ROOT_PATH = path.resolve(PROJECT_BLUEPRINTS_PATH, '../')
const GLOBAL_BLUEPRINTS_PATH = path.resolve(__dirname, '../../test/fixtures/global-blueprints')

export default {
  CURRENT_PATH,
  CURRENT_DIRNAME,
  PROJECT_ROOT_PATH,
  PROJECT_BLUEPRINTS_PATH,
  GLOBAL_BLUEPRINTS_PATH,
}
