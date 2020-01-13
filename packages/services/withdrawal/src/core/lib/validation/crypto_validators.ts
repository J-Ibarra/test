import Decimal from 'decimal.js'
import { CurrencyManager } from '@abx-query-libs/blockchain-currency-gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { commonWithdrawalRequestValidators } from './common_validators'
import { CompleteValidationParams, WithdrawalRequestValidator } from './withdrawal_request_validator'
import { isFiatCurrency } from '@abx-service-clients/reference-data'

export const cryptoWithdrawalRequestValidators: WithdrawalRequestValidator[] = [
  ...commonWithdrawalRequestValidators,
  ({ amount, availableBalance, currencyCode, feeAmount, feeCurrency }: CompleteValidationParams) => {
    return {
      isInvalid:
        currencyCode !== feeCurrency.code
          ? amount > availableBalance!.value!
          : new Decimal(amount).add(feeAmount).greaterThan(availableBalance.value || 0),
      error: `Withdrawal request amount ${currencyCode}${amount} is greater than available balance`,
    }
  },
  ({ feeAmount, feeCurrencyAvailableBalance, currencyCode, feeCurrency }: CompleteValidationParams) => ({
    isInvalid: currencyCode !== feeCurrency.code && feeAmount > feeCurrencyAvailableBalance.value!,
    error: `Withdrawal request fee amount ${feeCurrency ? feeCurrency.code : ''} ${feeAmount} is greater than available balance`,
  }),
  ({ currencyCode, address, manager }: CompleteValidationParams) => ({
    isInvalid: !cryptoWithdrawalAddressValid(manager, currencyCode, address!),
    error: `${currencyCode} address (${address}) is not valid`,
  }),
]

function cryptoWithdrawalAddressValid(manager: CurrencyManager, currencyCode: CurrencyCode, address: string) {
  const isFiat = isFiatCurrency(currencyCode)

  if (!isFiat) {
    const cryptoCurrency = manager.getCurrencyFromTicker(currencyCode)
    const isAddressValid = cryptoCurrency.validateAddress(address)

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
