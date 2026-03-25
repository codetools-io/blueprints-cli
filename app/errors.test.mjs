import { describe, it, expect } from 'vitest'
import { BlueprintError, CODES } from './errors.mjs'

describe('BlueprintError', () => {
  it('has the correct message', () => {
    const err = new BlueprintError('something went wrong', CODES.BLUEPRINT_NOT_FOUND)
    expect(err.message).toBe('something went wrong')
  })

  it('has the correct code', () => {
    const err = new BlueprintError('not found', CODES.BLUEPRINT_NOT_FOUND)
    expect(err.code).toBe('BLUEPRINT_NOT_FOUND')
  })

  it('is an instance of Error', () => {
    const err = new BlueprintError('err', CODES.INVALID_SOURCE)
    expect(err instanceof Error).toBe(true)
  })

  it('has name BlueprintError', () => {
    const err = new BlueprintError('err', CODES.BLUEPRINT_ALREADY_EXISTS)
    expect(err.name).toBe('BlueprintError')
  })
})

describe('CODES', () => {
  it('exports BLUEPRINT_NOT_FOUND', () => {
    expect(typeof CODES.BLUEPRINT_NOT_FOUND).toBe('string')
  })

  it('exports BLUEPRINT_ALREADY_EXISTS', () => {
    expect(typeof CODES.BLUEPRINT_ALREADY_EXISTS).toBe('string')
  })

  it('exports LIFECYCLE_SCRIPT_ERROR', () => {
    expect(typeof CODES.LIFECYCLE_SCRIPT_ERROR).toBe('string')
  })

  it('exports INVALID_SOURCE', () => {
    expect(typeof CODES.INVALID_SOURCE).toBe('string')
  })
})
