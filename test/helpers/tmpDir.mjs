import os from 'os'
import fs from 'fs-extra'
import path from 'path'

export async function createTmpDir(prefix = 'bp-test-') {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix))
}

export async function cleanupTmpDir(dir) {
  await fs.remove(dir)
}
