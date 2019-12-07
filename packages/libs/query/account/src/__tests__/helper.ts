import { expect } from 'chai'

export function validatePartialMatch(expected, actual) {
  Object.entries(expected).forEach(([key, expectedValue]) => {
    expect(actual[key]).to.deep.include(expectedValue)
  })
}
