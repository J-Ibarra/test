import { Decimal } from 'decimal.js'

export interface Tax {
  rate: number
  valueInCHF: Decimal
  valueInFeeCurrency: Decimal
}
