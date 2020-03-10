import { Transaction } from 'sequelize'
import { Currency, CurrencyCode, FiatCurrency } from '@abx-types/reference-data'
import { getTotalWithdrawalAmount } from '../../../../helper'
import * as helper from '../../../../helper'
import { InitialiseWithdrawalParams, CurrencyEnrichedWithdrawalRequest } from '@abx-types/withdrawal'
import { createSingleWithdrawalRequest } from './no_fee_request_creator'
import { createSeparateWithdrawalFeeRequest } from './separate_fee_request_withdrawal_creator'
import { convertAmountToFiatCurrency } from '@abx-utils/fx-rate'

export interface WithdrawalRequestCreationResult {
  amountRequest: CurrencyEnrichedWithdrawalRequest
  feeRequest?: CurrencyEnrichedWithdrawalRequest
}

export async function createWithdrawalRequests(
  initialiseWithdrawalParams: InitialiseWithdrawalParams,
  preferredCurrencyCode: FiatCurrency,
  withdrawalFee: number,
  withdrawalCurrency: Currency,
  withdrawalFeeCurrency: Currency,
  transaction: Transaction,
): Promise<WithdrawalRequestCreationResult> {
  if (initialiseWithdrawalParams.currencyCode !== withdrawalFeeCurrency.code) {
    return createSeparateWithdrawalFeeRequest(
      initialiseWithdrawalParams,
      preferredCurrencyCode,
      withdrawalFee,
      withdrawalCurrency,
      withdrawalFeeCurrency,
    )
  }

  const withdrawalAmountRequest = await createSingleWithdrawalRequest(
    initialiseWithdrawalParams,
    preferredCurrencyCode,
    withdrawalFeeCurrency.id,
    transaction,
  )

  return { amountRequest: { ...withdrawalAmountRequest, currency: withdrawalCurrency } }
}

export async function calculateConversionRates({
  amount,
  cryptoCurrency,
  preferredCurrencyCode,
  addFee = true,
}: {
  amount: number
  cryptoCurrency: CurrencyCode
  preferredCurrencyCode: FiatCurrency
  addFee?: boolean
}) {
  const totalAmount = addFee ? await getTotalWithdrawalAmount(amount, cryptoCurrency) : amount
  const [fiatConversion, kauConversion] = await Promise.all([
    convertAmountToFiatCurrency(cryptoCurrency, preferredCurrencyCode, totalAmount),
    helper.kauConversion(cryptoCurrency, amount),
  ])

  return { totalAmount, fiatConversion, kauConversion }
}
