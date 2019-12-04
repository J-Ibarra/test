import { PreferredCurrencyEnrichedBalance } from './preferred_currency_enriched_balance'

export interface CompleteBalanceDetails {
  accountId: string
  preferredCurrencyTotal: number
  balances: PreferredCurrencyEnrichedBalance[]
}
