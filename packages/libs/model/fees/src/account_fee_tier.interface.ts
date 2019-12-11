import { FeeTier } from './fee_tier.interface'

export interface AccountFeeTier extends FeeTier {
  /** The id of the targetAddress account. */
  accountId: string
}
