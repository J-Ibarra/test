import Decimal from 'decimal.js'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { commonWithdrawalRequestValidators } from './common_validators'
import { CompleteValidationParams, WithdrawalRequestValidator } from './withdrawal_request_validator'
import { isFiatCurrency } from '@abx-service-clients/reference-data'

export const cryptoWithdrawalRequestValidators: WithdrawalRequestValidator[] = [
  ...commonWithdrawalRequestValidators,
  ({ amount, availableBalance, currencyCode, feeAmount, feeCurrency }: CompleteValidationParams) => {
    const am = new Decimal(`${amount}`)
    const res = am.add(`${feeAmount}`)
    const bool = res.greaterThan(availableBalance || 0)
    return {
      isInvalid:
        currencyCode !== feeCurrency.code ? amount > availableBalance : bool,
      error: `Withdrawal request amount ${currencyCode}${amount} is greater than available balance`,
    }
  },
  ({ feeAmount, feeCurrencyAvailableBalance, currencyCode, feeCurrency }: CompleteValidationParams) => ({
    isInvalid: currencyCode !== feeCurrency.code && feeAmount > feeCurrencyAvailableBalance,
    error: `Withdrawal request fee amount ${feeCurrency ? feeCurrency.code : ''} ${feeAmount} is greater than available balance`,
  }),
  async ({ currencyCode, address, manager }: CompleteValidationParams) => {
    const addressValid = await cryptoWithdrawalAddressValid(manager, currencyCode, address!)
    return {
      isInvalid: !addressValid,
      error: `${currencyCode} address (${address}) is not valid`,
    }
  },
]

async function cryptoWithdrawalAddressValid(manager: CurrencyManager, currencyCode: CurrencyCode, address: string) {
  const isFiat = isFiatCurrency(currencyCode)

  if (!isFiat) {
    const cryptoCurrency = manager.getCurrencyFromTicker(currencyCode)
    const isAddressValid = await cryptoCurrency.validateAddress(address)

    return isAddressValid
  }

  return true
}

export async function cryptoWithdrawalAddressNotContractAddress(manager: CurrencyManager, currencyCode: CurrencyCode, address: string = '') {
  const isFiat = isFiatCurrency(currencyCode)

  if (!isFiat) {
    const cryptoCurrency = manager.getCurrencyFromTicker(currencyCode)
    const isAddressValid = cryptoCurrency.validateAddressIsNotContractAddress(address)

    return isAddressValid
  }

  return true
}
