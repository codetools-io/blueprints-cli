import { describe, test, expect } from 'vitest'
import help from './help.mjs'

describe('help', () => {
  test('can show list of allowed pipes', async () => {
    const result = await help()

    expect(result).toEqual(`
Pipes:

ClassFormat (ex. ComponentName)

DashedFormat (ex. component-name)

CamelCaseFormat (ex. componentName)

PascalCaseFormat (ex. ComponentName)

SlugFormat (ex. component-name)

ConstantFormat (ex. COMPONENT_NAME)
`)
  })
})
