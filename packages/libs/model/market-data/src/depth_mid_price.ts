export interface DepthMidPrice {
  /** The trade symbol(driven by 'base' and 'to' currency ids). */
  symbolId: string
  /** The calculated mid-price (top of bid / top of ask) / 2. */
  price: number
  /** The date the mid-price was calculated/created */
  createdAt: Date
}
