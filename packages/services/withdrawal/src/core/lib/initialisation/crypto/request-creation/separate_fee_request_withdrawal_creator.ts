import { Transaction } from 'sequelize'
import { calculateConversionRates, WithdrawalRequestCreationResult } from '.'
import { Currency, FiatCurrency, SymbolPairStateFilter } from '@abx-types/reference-data'
import { InitialiseWithdrawalParams, WithdrawalRequestType, WithdrawalState } from '@abx-types/withdrawal'
import { createWithdrawalRequest } from '../../../common/create_withdrawal_request'
import { findCurrencyForCode } from '@abx-service-clients/reference-data'
import { updateWithdrawalRequest } from '../../../common/update_withdrawal_request'

export async function createSeparateWithdrawalFeeRequest(
  initialiseWithdrawalParams: InitialiseWithdrawalParams,
  preferredCurrencyCode: FiatCurrency,
  withdrawalFee: number,
  withdrawalRequestCurrency: Currency,
  feeRequestCurrency: Currency,
  t?: Transaction,
): Promise<WithdrawalRequestCreationResult> {
  const [
    { fiatConversion, kauConversion },
    { fiatConversion: feeFiatConversion, kauConversion: feeKauConversion },
    { id: withdrawalCurrencyId },
  ] = await Promise.all([
    calculateConversionRates({
      amount: initialiseWithdrawalParams.amount,
      cryptoCurrency: initialiseWithdrawalParams.currencyCode,
      preferredCurrencyCode,
    }),
    calculateConversionRates({
      amount: withdrawalFee,
      cryptoCurrency: withdrawalRequestCurrency.code,
      preferredCurrencyCode,
      addFee: false,
    }),
    findCurrencyForCode(initialiseWithdrawalParams.currencyCode, SymbolPairStateFilter.all),
  ])

  const withdrawalAmountRequest = await createWithdrawalRequest(
    {
      ...initialiseWithdrawalParams,
      currencyId: withdrawalCurrencyId,
      state: WithdrawalState.pending,
      fiatCurrencyCode: preferredCurrencyCode,
      fiatConversion: Number(fiatConversion),
      kauConversion: Number(kauConversion),
      type: WithdrawalRequestType.withdrawal,
    },
    t,
  )

  const withdrawalFeeRequest = await createWithdrawalRequest(
    {
      ...initialiseWithdrawalParams,
      amount: withdrawalFee,
      currencyId: feeRequestCurrency.id,
      state: WithdrawalState.pending,
      fiatCurrencyCode: preferredCurrencyCode,
      fiatConversion: Number(feeFiatConversion),
      kauConversion: Number(feeKauConversion),
      memo: `Withdrawal Fee: ${withdrawalAmountRequest.id}`,
      type: WithdrawalRequestType.fee,
      createdAt: withdrawalAmountRequest.createdAt,
    },
    t,
  )

  updateWithdrawalRequest({ id: withdrawalAmountRequest.id, feeWithdrawalRequestId: withdrawalFeeRequest.id }, t)

  return {
    amountRequest: { ...withdrawalAmountRequest, currency: withdrawalRequestCurrency },
    feeRequest: { ...withdrawalFeeRequest, currency: feeRequestCurrency },
  }
}
