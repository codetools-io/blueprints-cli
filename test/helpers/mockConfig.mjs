import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const fixturesPath = path.resolve(__dirname, '../fixtures')

export const TEST_CONFIG = {
  CURRENT_PATH: path.resolve(fixturesPath, 'project-example'),
  CURRENT_DIRNAME: 'project-example',
  PROJECT_BLUEPRINTS_PATH: path.resolve(fixturesPath, 'project-example/.blueprints'),
  PROJECT_ROOT_PATH: path.resolve(fixturesPath, 'project-example'),
  GLOBAL_BLUEPRINTS_PATH: path.resolve(fixturesPath, 'global-blueprints'),
}
