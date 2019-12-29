export interface SymbolPairSummary {
  id: string
  baseId: number
  quoteId: number
  feeId: number
  orderRange: number | null
  sortOrder?: number | null
}
