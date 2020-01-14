import { every, sortBy } from 'lodash'

import { ValidationError } from '@abx-types/error'
import { FeeTier } from '@abx-types/order'

/**
 * Validates fee tiers against a set of standard fee tier rules and any additional validations provided.
 * The standard tier validations are:
 * - fee tier number should increment by '1' at each step
 * - fee threshold should increase as the tier number increases(i.e tier[1].threshold < tier[2].threshold)
 * - fee rate should decrease as the tier number increases (i.e tier[1].rate > tier[2].rate)
 *
 * @param feeTiers the fee tiers to validate
 * @param extraValidations any extra validations to run
 */
export function validateTiers(feeTiers: FeeTier[], extraValidations: Array<(tiers: FeeTier[]) => boolean> = []) {
  const symbolToTiers: Map<string, FeeTier[]> = feeTiers.reduce((acc, tier) => {
    acc.set(tier.symbolId, (acc.get(tier.symbolId) || []).concat(tier))

    return acc
  }, new Map<string, FeeTier[]>())

  symbolToTiers.forEach(tiers => validateTiersForSymbol(tiers, extraValidations))
}

function validateTiersForSymbol(symbolTiers: FeeTier[], extraValidations: Array<(tiers: FeeTier[]) => boolean>) {
  const orderedTiers = sortBy(symbolTiers, 'tier')

  if (
    !feeTiersIncrementCorrectly(orderedTiers) ||
    !thresholdIncreasesForEachTierIncrement(orderedTiers) ||
    !ratesDecreaseForEachTierIncrement(orderedTiers) ||
    !every(extraValidations, validation => validation(orderedTiers))
  ) {
    throw new ValidationError('Invalid fee tiers')
  }
}

/**
 * Validate there are no gaps in the tiers i.e. 1, 2, 3, 4
 *
 * @param orderedTiers the ordered tiers for a given symbol
 */
function feeTiersIncrementCorrectly(orderedTiers: FeeTier[]) {
  return every(orderedTiers, ({ tier }, index) => {
    return index === 0 || orderedTiers[index - 1].tier === tier - 1
  })
}

/**
 * Validate thresholds increase as the tier number increments.
 *
 * @param orderedTiers the ordered tiers for a given symbol
 */
function thresholdIncreasesForEachTierIncrement(orderedTiers: FeeTier[]) {
  return every(orderedTiers, ({ threshold }, index) => index === 0 || orderedTiers[index - 1].threshold < threshold)
}

/**
 * Validate rates decrease as the tier number increments.
 *
 * @param orderedTiers the ordered tiers for a given symbol
 */
function ratesDecreaseForEachTierIncrement(orderedTiers: FeeTier[]) {
  return every(orderedTiers, ({ rate }, index) => index === 0 || orderedTiers[index - 1].rate > rate)
}
