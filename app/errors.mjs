export class BlueprintError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'BlueprintError'
    this.code = code
  }
}

export const CODES = {
  BLUEPRINT_NOT_FOUND: 'BLUEPRINT_NOT_FOUND',
  BLUEPRINT_ALREADY_EXISTS: 'BLUEPRINT_ALREADY_EXISTS',
  LIFECYCLE_SCRIPT_ERROR: 'LIFECYCLE_SCRIPT_ERROR',
  INVALID_SOURCE: 'INVALID_SOURCE',
}
