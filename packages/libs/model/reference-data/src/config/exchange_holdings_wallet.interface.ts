import { CryptoCurrency } from '../crypto_currency.enum'

export interface ExchangeHoldingsWallet {
  currency: CryptoCurrency
  publicKey: string
}
