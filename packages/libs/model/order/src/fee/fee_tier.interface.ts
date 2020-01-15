export interface FeeTier {
  id?: number
  /** The fee tier. */
  tier: number
  /** The id of the targeted symbol. */
  symbolId: string
  /** The tier threshold. */
  threshold: number
  /** The fee rate. */
  rate: number
}
