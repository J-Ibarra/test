export interface MonthlyTradeAccumulation {
  /** A unique id for the accumulation. */
  id?: number
  /** The account ID. */
  accountId: string
  /** The trade month. */
  month: number
  /** The trade year. */
  year: number
  /** The total number of accumulated trades. */
  total: number
}
